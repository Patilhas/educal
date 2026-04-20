import { Suspense } from "react";
import { redirect } from "next/navigation";
import Calendar from "@/features/calendar/calendar";
import { CalendarSkeleton } from "@/features/calendar/skeletons/calendar-skeleton";
import { getCurrentUser } from "@/server/auth/session";

export default async function Page() {
  const currentUser = await getCurrentUser()

  if (!currentUser) {
    redirect("/login")
  }

  return (
    <main className="flex h-dvh min-h-0 w-full items-center justify-center overflow-hidden">
      <div className="h-[90dvh] min-h-0 w-[90vw] min-w-0">
        <Suspense fallback={<CalendarSkeleton />}>
          <Calendar currentUser={currentUser} />;
        </Suspense>
      </div>
    </main>
  )
}
