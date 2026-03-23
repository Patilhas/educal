import { Suspense } from "react";
import { Calendar } from "@/features/calendar/calendar";
import { CalendarSkeleton } from "@/features/calendar/skeletons/calendar-skeleton";

export default function Page() {
  return (
      <main className="flex max-h-screen my-10 flex-col">
          <Suspense fallback={<CalendarSkeleton />}>
              <Calendar />
          </Suspense>
      </main>
  )
}
