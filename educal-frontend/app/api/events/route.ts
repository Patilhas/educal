import { calendarController } from "@/server/calendar/controllers/calendar.controller";

export async function GET() {
  return calendarController.listEvents();
}

export async function POST(request: Request) {
  return calendarController.createEvent(request);
}
