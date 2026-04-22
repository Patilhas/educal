import { authController } from "@/server/auth/controllers/auth.controller";
import { withApiAuth } from "@/server/auth/middleware";

export const GET = withApiAuth(async (request) => authController.me(request));

