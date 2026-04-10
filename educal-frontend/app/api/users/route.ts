import { calendarController } from "@/server/calendar/controllers/calendar.controller";

export async function GET() {
  return calendarController.listUsers();
}
