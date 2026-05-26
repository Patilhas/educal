import { fail } from "@/server/shared/api-response";
import {
  attachAuthToRequest,
  requireAuthFromRequest,
  type IRequestWithAuth,
} from "@/server/auth/session";

export const withApiAuth = (
  handler: (request: IRequestWithAuth) => Promise<Response>,
) => {
  return async (request: Request) => {
    try {
      const auth = await requireAuthFromRequest(request);
      return await handler(attachAuthToRequest(request, auth));
    } catch (error) {
      return fail(error);
    }
  };
};

export const withApiAuthContext = <TContext>(
  handler: (request: IRequestWithAuth, context: TContext) => Promise<Response>,
) => {
  return async (request: Request, context: TContext) => {
    try {
      const auth = await requireAuthFromRequest(request);
      return await handler(attachAuthToRequest(request, auth), context);
    } catch (error) {
      return fail(error);
    }
  };
};

export const withOptionalApiAuth = (
  handler: (request: Request | IRequestWithAuth) => Promise<Response>,
) => {
  return async (request: Request) => {
    try {
      const auth = await requireAuthFromRequest(request);
      return await handler(attachAuthToRequest(request, auth));
    } catch {
      // Best-effort: auth failed, but continue with unauthenticated request
      return await handler(request);
    }
  };
};
