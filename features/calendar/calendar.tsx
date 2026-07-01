import CalendarBody from "@/features/calendar/calendar-body";
import { CalendarProvider } from "@/features/calendar/contexts/calendar-context";
import { DndProvider } from "@/features/calendar/contexts/dnd-context";
import { CalendarActionsBar } from "@/features/calendar/header/calendar-actions-bar";
import { CalendarHeader } from "@/features/calendar/header/calendar-header";
import { getEventEnums, getEvents, getVacations, getUsers } from "@/features/calendar/requests";
import type { IUser } from "@/shared/user/types";

async function getCalendarData() {
  const [events, users, eventEnums, vacationsByYear] = await Promise.all([
    getEvents(),
    getUsers(),
    getEventEnums(),
    getVacations(),
  ]);

  return {
    events,
    users,
    eventEnums,
    vacationsByYear,
  };
}

export default async function Calendar({ currentUser }: { currentUser: IUser }) {
  const { events, users, eventEnums, vacationsByYear } = await getCalendarData();

  return (
    <CalendarProvider
      events={events}
      users={users}
      currentUser={currentUser}
      view="month"
      initialEventEnums={eventEnums}
      initialVacationsByYear={vacationsByYear}
    >
      <DndProvider>
        <div className="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-xl border">
          <CalendarHeader />
          <CalendarActionsBar />
          <CalendarBody />
        </div>
      </DndProvider>
    </CalendarProvider>
  )
}
