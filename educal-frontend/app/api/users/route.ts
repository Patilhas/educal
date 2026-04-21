import { authController } from "@/server/auth/controllers/auth.controller";
import { withApiAuth } from "@/server/auth/middleware";

export const GET = withApiAuth(async (request) => {
  return authController.listUsers(request);
});

export const POST = withApiAuth(async (request) => {
  return authController.createUser(request);
});
