import { redirect } from "next/navigation";
import { LoginForm } from "@/features/auth/login-form";
import { getCurrentUser } from "@/server/auth/session";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect("/");
  }

  return (
    <main className="flex min-h-dvh items-center justify-center px-4">
      <div className="w-full max-w-md">
        <LoginForm />
      </div>
    </main>
  );
}

