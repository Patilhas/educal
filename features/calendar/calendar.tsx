import CalendarBody from "@/features/calendar/calendar-body";
import { CalendarProvider } from "@/features/calendar/contexts/calendar-context";
import { DndProvider } from "@/features/calendar/contexts/dnd-context";
import { CalendarHeader } from "@/features/calendar/header/calendar-header";
import { getEventEnums, getEvents, getUsers, getNotifications } from "@/features/calendar/requests";
import type { IUser } from "@/shared/user/types";

async function getCalendarData(userId: string) {
  const [events, users, eventEnums, initialNotifications] = await Promise.all([
    getEvents(),
    getUsers(),
    getEventEnums(),
    getNotifications(userId),
  ]);

  return {
    events,
    users,
    eventEnums,
    initialNotifications,
  };
}

export default async function Calendar({ currentUser }: { currentUser: IUser }) {
  const { events, users, eventEnums, initialNotifications } = await getCalendarData(currentUser.id);

  return (
    <CalendarProvider
      events={events}
      users={users}
      currentUser={currentUser}
      view="month"
      initialEventEnums={eventEnums}
      initialNotifications={initialNotifications}
    >
      <DndProvider>
        <div className="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-xl border">
          <CalendarHeader />
          <CalendarBody />
        </div>
      </DndProvider>
    </CalendarProvider>
  )
}
