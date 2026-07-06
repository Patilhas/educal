import { DomainError } from "@/server/shared/domain-error";
import { hasRoleAtLeast } from "@/shared/user/roles";
import type { TUserRole } from "@/shared/user/types";

export type TRolePolicy = TUserRole | "any";

function assertRole(role: TUserRole, minimum: TUserRole): void {
  if (!hasRoleAtLeast(role, minimum)) {
    throw new DomainError("FORBIDDEN", 403, `Requer pelo menos o role ${minimum}`);
  }
}

/**
 * Wraps `instance`'s methods listed in `policy`, enforcing a minimum role
 * before each call. `getRole` is only invoked for methods whose policy is
 * not "any", so it doesn't need to handle every method's argument shape,
 * only the ones that carry a caller identity.
 *
 * Methods not listed in `policy` are not exposed on the returned object at
 * all: a method added to `instance` without a policy entry fails to
 * compile at its call site (the returned type won't have it) instead of
 * silently skipping the access check.
 */
export function withRolePolicy<TInstance extends object, TPolicy extends Partial<Record<keyof TInstance, TRolePolicy>>>(
  instance: TInstance,
  policy: TPolicy,
  getRole: (args: unknown[]) => TUserRole,
): { [K in keyof TPolicy]: TInstance[K & keyof TInstance] } {
  const wrapped: Record<string, unknown> = {};

  for (const key of Object.keys(policy)) {
    const minimum = policy[key as keyof TPolicy] as TRolePolicy;
    const original = instance[key as keyof TInstance] as unknown as (...args: unknown[]) => unknown;

    wrapped[key] = (...args: unknown[]) => {
      if (minimum !== "any") {
        assertRole(getRole(args), minimum);
      }
      return original.apply(instance, args);
    };
  }

  return wrapped as { [K in keyof TPolicy]: TInstance[K & keyof TInstance] };
}
