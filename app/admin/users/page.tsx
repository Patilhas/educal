import { redirect } from "next/navigation";
import { MainNavbar } from "@/components/main-navbar";
import { UserManagement } from "@/features/admin-users/user-management";
import { authService } from "@/server/auth/services/auth.service";
import { getCurrentUser } from "@/server/auth/session";

export default async function AdminUsersPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  if (currentUser.role !== "admin") {
    redirect("/");
  }

  const users = await authService.listUsers(currentUser);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-350 flex-col gap-4 p-4">
      <MainNavbar currentUser={currentUser} activePath="/admin/users" />
      <UserManagement initialUsers={users} currentUserId={currentUser.id} />
    </main>
  );
}

