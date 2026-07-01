import { calendarController } from "@/server/calendar/controllers/calendar.controller";
import { withApiAuth } from "@/server/auth/middleware";

export const POST = withApiAuth(async (request) => {
  return calendarController.createVacation(request);
});
