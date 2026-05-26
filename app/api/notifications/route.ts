import { calendarService } from "@/server/calendar/services/calendar.service";
import { ok, readJson } from "@/server/shared/api-response";
import { withApiAuth } from "@/server/auth/middleware";
import { DomainError } from "@/server/shared/domain-error";

export const GET = withApiAuth(async (request) => {
  return ok(await calendarService.listNotifications(request.auth.user.id));
});

export const PATCH = withApiAuth(async (request) => {
  const { notificationId } = await readJson<{ notificationId?: string }>(request);

  if (!notificationId) {
    throw new DomainError("VALIDATION_ERROR", 400, "notificationId required");
  }

  await calendarService.markNotificationRead(request, notificationId);
  return ok({ ok: true });
});
