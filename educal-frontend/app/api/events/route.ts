import { calendarController } from "@/server/calendar/controllers/calendar.controller";
import { withApiAuth } from "@/server/auth/middleware";

export const GET = withApiAuth(async () => {
  return calendarController.listEvents();
});

export const POST = withApiAuth(async (request) => {
  return calendarController.createEvent(request);
});
