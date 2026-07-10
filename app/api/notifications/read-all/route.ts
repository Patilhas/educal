import { notificationController } from "@/server/notifications/controllers/notification.controller";
import { withApiAuth } from "@/server/auth/middleware";

export const POST = withApiAuth(async (request) => {
  return notificationController.markAllRead(request);
});
