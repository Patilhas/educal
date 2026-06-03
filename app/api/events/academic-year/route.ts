import { calendarController } from "@/server/calendar/controllers/calendar.controller";
import { withApiAuth } from "@/server/auth/middleware";

export const GET = withApiAuth(async (request) => {
  return calendarController.validateAcademicYear(request);
});

export const POST = withApiAuth(async (request) => {
  return calendarController.migrateAcademicYear(request);
});

