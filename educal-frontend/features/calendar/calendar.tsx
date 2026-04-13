import CalendarBody from "@/features/calendar/calendar-body";
import { CalendarProvider } from "@/features/calendar/contexts/calendar-context";
import { DndProvider } from "@/features/calendar/contexts/dnd-context";
import { CalendarHeader } from "@/features/calendar/header/calendar-header";
import { getEventEnums, getEvents, getUsers } from "@/features/calendar/requests";

async function getCalendarData() {
  const [events, users, eventEnums] = await Promise.all([
    getEvents(),
    getUsers(),
    getEventEnums(),
  ]);

  return {
    events,
    users,
    eventEnums,
  };
}

export default async function Calendar() {
  const { events, users, eventEnums } = await getCalendarData();

  return (
    <CalendarProvider events={events} users={users} view="month" initialEventEnums={eventEnums}>
      <DndProvider>
        <div className="w-full border rounded-xl">
          <CalendarHeader />
          <CalendarBody />
        </div>
      </DndProvider>
    </CalendarProvider>
  );
}
