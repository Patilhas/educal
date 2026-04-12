import { calendarController } from "@/server/calendar/controllers/calendar.controller";

interface RouteContext {
  params: Promise<{ eventId: string; occurrenceId: string }>;
}

export async function PATCH(request: Request, context: RouteContext) {
  const { eventId, occurrenceId } = await context.params;
  return calendarController.patchOccurrence(request, eventId, occurrenceId);
}
