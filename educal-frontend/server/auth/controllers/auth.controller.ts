import { AUTH_SESSION_COOKIE_NAME } from "@/server/auth/config";
import { authService } from "@/server/auth/services/auth.service";
import { fail, ok, readJson } from "@/server/shared/api-response";
import type { IRequestWithAuth } from "@/server/auth/session";
import { getSessionTokenFromRequest } from "@/server/auth/session";
import { NextResponse } from "next/server";

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

export const authController = {
  async listUsers() {
    try {
      return ok(await authService.listCalendarUsers());
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
    } catch (error) {
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


