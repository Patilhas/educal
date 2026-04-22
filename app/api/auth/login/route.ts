import { authController } from "@/server/auth/controllers/auth.controller";

export async function POST(request: Request) {
  return authController.login(request);
}

