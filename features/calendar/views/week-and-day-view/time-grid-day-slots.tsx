import { useCalendar } from "@/features/calendar/contexts/calendar-context";
import AddEditEventDialog from "@/features/calendar/dialogs/add-edit-event-dialog";
import { DroppableArea } from "@/features/calendar/dnd/droppable-area";

interface TimeGridDaySlotsProps {
  day: Date;
  hours: number[];
}

export function TimeGridDaySlots({ day, hours }: TimeGridDaySlotsProps) {
  const { canEditEvents } = useCalendar();

  return (
    <>
      {hours.map((hour, index) => (
        <div key={hour} className="relative" style={{ height: "96px" }}>
          {index !== 0 && (
            <div className="pointer-events-none absolute inset-x-0 top-0 border-b"></div>
          )}

          <DroppableArea
            date={day}
            hour={hour}
            minute={0}
            className="absolute inset-x-0 top-0 h-12"
          >
            {canEditEvents && (
              <AddEditEventDialog startDate={day} startTime={{ hour, minute: 0 }}>
                <div className="absolute inset-0 cursor-pointer transition-colors hover:bg-secondary" />
              </AddEditEventDialog>
            )}
          </DroppableArea>

          <div className="pointer-events-none absolute inset-x-0 top-1/2 border-b border-dashed border-border"></div>

          <DroppableArea
            date={day}
            hour={hour}
            minute={30}
            className="absolute inset-x-0 bottom-0 h-12"
          >
            {canEditEvents && (
              <AddEditEventDialog startDate={day} startTime={{ hour, minute: 30 }}>
                <div className="absolute inset-0 cursor-pointer transition-colors hover:bg-secondary" />
              </AddEditEventDialog>
            )}
          </DroppableArea>
        </div>
      ))}
    </>
  );
}

