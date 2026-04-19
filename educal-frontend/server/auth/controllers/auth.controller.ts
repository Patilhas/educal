import { AUTH_SESSION_COOKIE_NAME } from "@/server/auth/config";
import { authService } from "@/server/auth/services/auth.service";
import { fail, ok, readJson } from "@/server/shared/api-response";
import type { IRequestWithAuth } from "@/server/auth/session";

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

  async logout(request: IRequestWithAuth) {
    try {
      const { token } = request.auth;
      await authService.logout(token);

      const response = ok({ loggedOut: true });
      response.cookies.set({
        name: AUTH_SESSION_COOKIE_NAME,
        value: "",
        maxAge: 0,
        path: "/",
      });

      return response;
    } catch (error) {
      return fail(error);
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


