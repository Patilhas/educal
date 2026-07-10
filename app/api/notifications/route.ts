import { notificationController } from "@/server/notifications/controllers/notification.controller";
import { withApiAuth } from "@/server/auth/middleware";

export const GET = withApiAuth(async (request) => {
  return notificationController.listMine(request);
});
