import { Suspense } from "react";
import { redirect } from "next/navigation";
import { MainNavbar } from "@/components/main-navbar";
import Calendar from "@/features/calendar/calendar";
import { CalendarSkeleton } from "@/features/calendar/skeletons/calendar-skeleton";
import { getCurrentUser } from "@/server/auth/session";

export default async function Page() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  return (
    <main className="flex h-dvh min-h-0 w-full justify-center overflow-hidden p-4">
      <div className="flex h-full min-h-0 w-full max-w-[1400px] flex-col gap-4">
        <MainNavbar currentUser={currentUser} activePath="/" />
        <div className="min-h-0 flex-1">
          <Suspense fallback={<CalendarSkeleton />}>
            <Calendar currentUser={currentUser} />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
