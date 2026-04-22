import { calendarController } from "@/server/calendar/controllers/calendar.controller";
import { withApiAuthContext } from "@/server/auth/middleware";
import type { IRequestWithAuth } from "@/server/auth/session";

interface RouteContext {
  params: Promise<{ eventId: string; occurrenceId: string }>;
}

export const PATCH = withApiAuthContext(async (request: IRequestWithAuth, context: RouteContext) => {
    const { eventId, occurrenceId } = await context.params;
    return calendarController.patchOccurrence(request, eventId, occurrenceId);
});
