import { calendarController } from "@/server/calendar/controllers/calendar.controller";
import { withApiAuthContext } from "@/server/auth/middleware";
import type { IRequestWithAuth } from "@/server/auth/session";

interface RouteContext {
  params: Promise<{ eventId: string }>;
}

export const PUT = withApiAuthContext(async (request: IRequestWithAuth, context: RouteContext) => {
    const { eventId } = await context.params;
    return calendarController.updateEvent(request, eventId);
});

export const DELETE = withApiAuthContext(async (request: IRequestWithAuth, context: RouteContext) => {
    const { eventId } = await context.params;
    return calendarController.deleteEvent(request, eventId);
});
