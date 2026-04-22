import { AUTH_SESSION_COOKIE_NAME } from "@/server/auth/config";
import { authService } from "@/server/auth/services/auth.service";
import { fail, ok, readJson } from "@/server/shared/api-response";
import type { IRequestWithAuth } from "@/server/auth/session";
import { getSessionTokenFromRequest } from "@/server/auth/session";
import { NextResponse } from "next/server";
import { DomainError } from "@/server/shared/domain-error";

const clearSessionCookie = (response: NextResponse) => {
  response.cookies.set({
    name: AUTH_SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
  });
};

const parseUserId = (rawUserId: string) => {
  const userId = rawUserId.trim();
  if (!userId) {
    throw new DomainError("VALIDATION_ERROR", 400, "userId inválido");
  }

  return userId;
};

export const authController = {
  async listUsers(request: IRequestWithAuth) {
    try {
      return ok(await authService.listUsers(request.auth.user));
    } catch (error) {
      return fail(error);
    }
  },

  async createUser(request: IRequestWithAuth) {
    try {
      const payload = await readJson(request);
      return ok(await authService.createUser(request.auth.user, payload), 201);
    } catch (error) {
      return fail(error);
    }
  },

  async updateUser(request: IRequestWithAuth, rawUserId: string) {
    try {
      const userId = parseUserId(rawUserId);
      const payload = await readJson(request);
      return ok(await authService.updateUser(request.auth.user, userId, payload));
    } catch (error) {
      return fail(error);
    }
  },

  async deleteUser(request: IRequestWithAuth, rawUserId: string) {
    try {
      const userId = parseUserId(rawUserId);
      await authService.deleteUser(request.auth.user, userId);
      return ok({ deleted: true });
    } catch (error) {
      return fail(error);
    }
  },

  async login(request: Request) {
    try {
      const payload = await readJson(request);
      const session = await authService.login(payload);

      const response = ok({ user: session.user });
      response.cookies.set({
        name: AUTH_SESSION_COOKIE_NAME,
        value: session.token,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        ...(session.staySignedIn
          ? {
              maxAge: Math.floor((session.expiresAt.getTime() - Date.now()) / 1000),
            }
          : {}),
      });

      return response;
    } catch (error) {
      return fail(error);
    }
  },

  async logout(request: Request | IRequestWithAuth) {
    try {
      // Best-effort session deletion: attempt to delete if we have valid auth
      if ('auth' in request && request.auth) {
        const { token } = request.auth;
        await authService.logout(token);
      } else {
        // Try to extract token from request headers even without auth validation
        const token = getSessionTokenFromRequest(request);
        if (token) {
          await authService.logout(token);
        }
      }

      const response = ok({ loggedOut: true });
      clearSessionCookie(response);
      return response;
    } catch {
      // Even if session deletion fails, clear the cookie
      const response = ok({ loggedOut: true });
      clearSessionCookie(response);
      return response;
    }
  },

  async me(request: IRequestWithAuth) {
    try {
      const { user } = request.auth;
      return ok({ user });
    } catch (error) {
      return fail(error);
    }
  },
};


