import { notificationController } from "@/server/notifications/controllers/notification.controller";
import { withApiAuthContext } from "@/server/auth/middleware";
import type { IRequestWithAuth } from "@/server/auth/session";

interface RouteContext {
  params: Promise<{ notificationId: string }>;
}

export const POST = withApiAuthContext(async (request: IRequestWithAuth, context: RouteContext) => {
  const { notificationId } = await context.params;
  return notificationController.markRead(request, notificationId);
});
