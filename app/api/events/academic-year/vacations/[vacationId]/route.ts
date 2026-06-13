import { calendarController } from "@/server/calendar/controllers/calendar.controller";
import { withApiAuthContext } from "@/server/auth/middleware";
import type { IRequestWithAuth } from "@/server/auth/session";

interface RouteContext {
  params: Promise<{ vacationId: string }>;
}

export const PUT = withApiAuthContext(async (request: IRequestWithAuth, context: RouteContext) => {
  const { vacationId } = await context.params;
  return calendarController.updateVacation(request, vacationId);
});

export const DELETE = withApiAuthContext(async (request: IRequestWithAuth, context: RouteContext) => {
  const { vacationId } = await context.params;
  return calendarController.deleteVacation(request, vacationId);
});
