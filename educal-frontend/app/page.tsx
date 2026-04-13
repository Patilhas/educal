import { Suspense } from "react";
import Calendar from "@/features/calendar/calendar";
import { CalendarSkeleton } from "@/features/calendar/skeletons/calendar-skeleton";

export default function Page() {
  return (
      <main className="flex h-dvh min-h-0 w-full items-center justify-center overflow-hidden">
          <div className="h-[90dvh] w-[90vw] min-h-0 min-w-0">
              <Suspense fallback={<CalendarSkeleton />}>
                  <Calendar />
              </Suspense>
          </div>
      </main>
  )
}
