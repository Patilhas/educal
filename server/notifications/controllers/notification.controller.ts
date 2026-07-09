import { notificationService } from "@/server/notifications/services/notification.service";
import { fail, ok } from "@/server/shared/api-response";
import { DomainError } from "@/server/shared/domain-error";
import type { IRequestWithAuth } from "@/server/auth/session";

const parseNotificationId = (rawValue: string) => {
  if (!rawValue) {
    throw new DomainError("VALIDATION_ERROR", 400, "notificationId inválido");
  }
  return rawValue;
};

export const notificationController = {
  async listMine(request: IRequestWithAuth) {
    try {
      return ok(await notificationService.listMine(request));
    } catch (error) {
      return fail(error);
    }
  },

  async markRead(request: IRequestWithAuth, notificationIdValue: string) {
    try {
      const notificationId = parseNotificationId(notificationIdValue);
      await notificationService.markRead(request, notificationId);
      return ok({ read: true });
    } catch (error) {
      return fail(error);
    }
  },

  async markAllRead(request: IRequestWithAuth) {
    try {
      await notificationService.markAllRead(request);
      return ok({ read: true });
    } catch (error) {
      return fail(error);
    }
  },
};
