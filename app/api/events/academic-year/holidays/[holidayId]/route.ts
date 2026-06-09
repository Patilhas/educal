import { calendarController } from "@/server/calendar/controllers/calendar.controller";
import { withApiAuthContext } from "@/server/auth/middleware";
import type { IRequestWithAuth } from "@/server/auth/session";

interface RouteContext {
  params: Promise<{ holidayId: string }>;
}

export const PUT = withApiAuthContext(async (request: IRequestWithAuth, context: RouteContext) => {
  const { holidayId } = await context.params;
  return calendarController.updateHoliday(request, holidayId);
});

export const DELETE = withApiAuthContext(async (request: IRequestWithAuth, context: RouteContext) => {
  const { holidayId } = await context.params;
  return calendarController.deleteHoliday(request, holidayId);
});
