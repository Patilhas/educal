import { authController } from "@/server/auth/controllers/auth.controller";
import { withApiAuthContext } from "@/server/auth/middleware";
import type { IRequestWithAuth } from "@/server/auth/session";

interface RouteContext {
  params: Promise<{ userId: string }>;
}

export const PATCH = withApiAuthContext(
  async (request: IRequestWithAuth, context: RouteContext) => {
    const { userId } = await context.params;
    return authController.updateUser(request, userId);
  },
);

export const DELETE = withApiAuthContext(
  async (request: IRequestWithAuth, context: RouteContext) => {
    const { userId } = await context.params;
    return authController.deleteUser(request, userId);
  },
);

