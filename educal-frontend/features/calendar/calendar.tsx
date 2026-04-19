import CalendarBody from "@/features/calendar/calendar-body";
import { CalendarProvider } from "@/features/calendar/contexts/calendar-context";
import { DndProvider } from "@/features/calendar/contexts/dnd-context";
import { CalendarHeader } from "@/features/calendar/header/calendar-header";
import { getEventEnums, getEvents, getUsers } from "@/features/calendar/requests";
import { getCurrentUser } from "@/server/auth/session";

async function getCalendarData() {
  const [events, users, eventEnums, currentUser] = await Promise.all([
    getEvents(),
    getUsers(),
    getEventEnums(),
    getCurrentUser(),
  ]);

  return {
    events,
    users,
    eventEnums,
    currentUser,
  };
}

export default async function Calendar() {
  const { events, users, eventEnums, currentUser } = await getCalendarData();

  return (
    <CalendarProvider
      events={events}
      users={users}
      currentUser={currentUser}
      view="month"
      initialEventEnums={eventEnums}
    >
      <DndProvider>
        <div className="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-xl border">
          <CalendarHeader />
          <CalendarBody />
        </div>
      </DndProvider>
    </CalendarProvider>
  );
}
