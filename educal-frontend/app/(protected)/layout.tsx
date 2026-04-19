import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session";

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return children;
}

