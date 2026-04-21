import { cookies } from "next/headers";
import type { IUser } from "@/shared/user/types";
import { AUTH_SESSION_COOKIE_NAME } from "@/server/auth/config";
import { authService } from "@/server/auth/services/auth.service";
import { DomainError } from "@/server/shared/domain-error";

const getCookieValue = (cookieHeader: string, key: string): string | null => {
  const value = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${key}=`))
    ?.slice(key.length + 1);

  return value ?? null;
};

export const getSessionTokenFromRequest = (request: Request): string | null => {
  const cookieHeader = request.headers.get("cookie") ?? "";
  return getCookieValue(cookieHeader, AUTH_SESSION_COOKIE_NAME);
};

export const getSessionTokenFromCookies = async (): Promise<string | null> => {
  const cookieStore = await cookies();
  return cookieStore.get(AUTH_SESSION_COOKIE_NAME)?.value ?? null;
};

export interface IAuthContext {
  user: IUser;
  token: string;
}

export interface IRequestWithAuth extends Request {
  auth: IAuthContext;
}

export const requireAuthFromRequest = async (request: Request): Promise<IAuthContext> => {
  const token = getSessionTokenFromRequest(request);
  if (!token) {
    throw new DomainError("UNAUTHORIZED", 401, "Sessão inválida ou expirada");
  }

  const user = token ? await authService.getUserBySessionToken(token) : null;
  if (!user) {
    throw new DomainError("UNAUTHORIZED", 401, "Sessão inválida ou expirada");
  }

  return { user, token };
};

export const attachAuthToRequest = <TRequest extends Request>(
  request: TRequest,
  auth: IAuthContext,
) => {
  return Object.assign(request, { auth }) as TRequest & IRequestWithAuth;
};

export const getCurrentUser = async () => {
  const token = await getSessionTokenFromCookies();
  if (!token) {
    return null;
  }

  return authService.getUserBySessionToken(token);
};


