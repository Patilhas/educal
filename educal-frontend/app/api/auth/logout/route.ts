import { authController } from "@/server/auth/controllers/auth.controller";
import { withApiAuth } from "@/server/auth/middleware";

export const POST = withApiAuth(async (request) => authController.logout(request));

