import { calendarController } from "@/server/calendar/controllers/calendar.controller";
import { withApiAuthContext } from "@/server/auth/middleware";

interface RouteContext {
  params: Promise<{ eventId: string }>;
}

export const PUT = withApiAuthContext(async (request: Request, context: RouteContext) => {
    const { eventId } = await context.params;
    return calendarController.updateEvent(request, eventId);
});

export const DELETE = withApiAuthContext(async (_request: Request, context: RouteContext) => {
    const { eventId } = await context.params;
    return calendarController.deleteEvent(eventId);
});
