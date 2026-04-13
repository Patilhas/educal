import { calendarController } from "@/server/calendar/controllers/calendar.controller";

interface RouteContext {
  params: Promise<{ eventId: string }>;
}

export async function PUT(request: Request, context: RouteContext) {
  const { eventId } = await context.params;
  return calendarController.updateEvent(request, eventId);
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { eventId } = await context.params;
  return calendarController.deleteEvent(eventId);
}
