import { authController } from "@/server/auth/controllers/auth.controller";
import { withOptionalApiAuth } from "@/server/auth/middleware";

export const POST = withOptionalApiAuth(async (request) => authController.logout(request));


