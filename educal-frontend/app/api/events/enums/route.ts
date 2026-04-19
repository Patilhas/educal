import { calendarController } from "@/server/calendar/controllers/calendar.controller";
import { withApiAuth } from "@/server/auth/middleware";

export const GET = withApiAuth(async () => calendarController.listEnums());
