import { calendarController } from "@/server/calendar/controllers/calendar.controller";
import { withApiAuthContext } from "@/server/auth/middleware";

interface RouteContext {
  params: Promise<{ eventId: string; occurrenceId: string }>;
}

export const PATCH = withApiAuthContext(async (request: Request, context: RouteContext) => {
    const { eventId, occurrenceId } = await context.params;
    return calendarController.patchOccurrence(request, eventId, occurrenceId);
});
