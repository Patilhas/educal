import { describe, it, expect } from "vitest";
import { withRolePolicy } from "./authorize";
import { DomainError } from "@/server/shared/domain-error";
import type { TUserRole } from "@/shared/user/types";

class FakeService {
  private greeting = "hello";

  publicAnyone(): string {
    return "ok";
  }

  publicEditorOnly(_actor: { role: TUserRole }, value: number): number {
    return value * 2;
  }

  publicUsesInternalState(): string {
    return this.buildGreeting();
  }

  private buildGreeting(): string {
    return `${this.greeting}, world`;
  }
}

describe("withRolePolicy", () => {
  it("allows a call when the policy is \"any\", without invoking the role extractor", () => {
    const wrapped = withRolePolicy(
      new FakeService(),
      { publicAnyone: "any" },
      () => {
        throw new Error("getRole should not be called for an 'any' policy");
      },
    );
    expect(wrapped.publicAnyone()).toBe("ok");
  });

  it("allows a call when the actor's role meets the minimum", () => {
    const wrapped = withRolePolicy(
      new FakeService(),
      { publicEditorOnly: "editor" },
      (args) => (args[0] as { role: TUserRole }).role,
    );
    expect(wrapped.publicEditorOnly({ role: "admin" }, 3)).toBe(6);
  });

  it("throws a FORBIDDEN DomainError when the actor's role is below the minimum", () => {
    const wrapped = withRolePolicy(
      new FakeService(),
      { publicEditorOnly: "editor" },
      (args) => (args[0] as { role: TUserRole }).role,
    );
    try {
      wrapped.publicEditorOnly({ role: "viewer" }, 3);
      expect.unreachable("expected publicEditorOnly to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(DomainError);
      expect((error as DomainError).code).toBe("FORBIDDEN");
      expect((error as DomainError).status).toBe(403);
    }
  });

  it("does not expose methods that are absent from the policy", () => {
    const wrapped = withRolePolicy(
      new FakeService(),
      { publicAnyone: "any" },
      () => "viewer",
    );
    expect((wrapped as Record<string, unknown>).publicEditorOnly).toBeUndefined();
  });

  it("preserves the original instance's `this` binding for methods using internal state", () => {
    const wrapped = withRolePolicy(
      new FakeService(),
      { publicUsesInternalState: "any" },
      () => "viewer",
    );
    expect(wrapped.publicUsesInternalState()).toBe("hello, world");
  });
});
