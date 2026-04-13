"use client";

import { isToday, startOfDay, isSunday, isSameMonth } from "date-fns";
import { motion } from "framer-motion";
import { useMemo, useCallback } from "react";

import { cn } from "@/lib/utils";
import { transition } from "@/features/calendar/animations";
import { EventListDialog } from "@/features/calendar/dialogs/events-list-dialog";
import { DroppableArea } from "@/features/calendar/dnd/droppable-area";
import { getMonthCellEvents } from "@/features/calendar/helpers";
import { useCalendar } from "@/features/calendar/contexts/calendar-context";
import { useMediaQuery } from "@/features/calendar/hooks";
import type { ICalendarCell, IEvent, IOccurrence } from "@/features/calendar/interfaces";
import { EventBullet } from "@/features/calendar/views/month-view/event-bullet";
import { MonthEventBadge } from "@/features/calendar/views/month-view/month-event-badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import AddEditEventDialog from "@/features/calendar/dialogs/add-edit-event-dialog";

interface IProps {
  cell: ICalendarCell;
  occurrences: { event: IEvent; occurrence: IOccurrence }[];
  eventPositions: Record<string, number>;
}


const MAX_VISIBLE_EVENTS = 3;

export function DayCell({ cell, occurrences, eventPositions }: IProps) {
  const { day, currentMonth, date } = cell;
  const isMobile = useMediaQuery("(max-width: 768px)");
  const { getEventColor } = useCalendar();

  const { cellOccurrences, currentCellMonth } = useMemo(() => {
    const cellOccurrences = getMonthCellEvents(date, occurrences, eventPositions);
    const currentCellMonth = startOfDay(
      new Date(date.getFullYear(), date.getMonth(), 1),
    );
    return { cellOccurrences, currentCellMonth };
  }, [date, occurrences, eventPositions]);

  const renderEventAtPosition = useCallback(
    (position: number) => {
      const item = cellOccurrences.find((e) => e.position === position);
      if (!item) {
        return (
          <motion.div
            key={`empty-${position}`}
            className="hidden h-6.5 lg:block"
            initial={false}
            animate={false}
          />
        );
      }
      const showBullet = isSameMonth(
        new Date(item.occurrence.startDate),
        currentCellMonth,
      );

      return (
        <motion.div
          key={`event-${item.occurrence.id}-${position}`}
          className="shrink-0"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: position * 0.1, ...transition }}
        >
          {showBullet && (
            <EventBullet
              className="lg:hidden"
              color={getEventColor(item.event.category)}
            />
          )}
          <MonthEventBadge
            className="hidden lg:flex"
            event={item.event}
            occurrence={item.occurrence}
            cellDate={startOfDay(date)}
          />
        </motion.div>
      );
    },
    [cellOccurrences, currentCellMonth, date, getEventColor],
  );

  const showMoreCount = cellOccurrences.length - MAX_VISIBLE_EVENTS;

  const showMobileMore = isMobile && currentMonth && showMoreCount > 0;
  const showDesktopMore = !isMobile && currentMonth && showMoreCount > 0;

  const cellContent = useMemo(
    () => (
      <motion.div
        className={cn(
          "flex h-full min-h-0 flex-col gap-1 border-l border-t",
          isSunday(date) && "border-l-0",
        )}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={transition}
      >
        <DroppableArea date={date} className="flex h-full min-h-0 w-full flex-col py-2">
          <motion.span
            className={cn(
              "h-6 px-1 text-xs font-semibold lg:px-2",
              !currentMonth && "opacity-20",
              isToday(date) &&
              "flex w-6 translate-x-1 items-center justify-center rounded-full bg-primary px-0 font-bold text-primary-foreground",
            )}
          >
            {day}
          </motion.span>

          <motion.div
            className={cn(
              "mt-1 flex min-h-0 flex-1 gap-1 px-2 lg:flex-col lg:gap-2 lg:px-0",
              !currentMonth && "opacity-50",
            )}
          >
            {cellOccurrences.length === 0 && !isMobile ? (
              <div className="w-full h-full flex justify-center items-center group">
                <AddEditEventDialog startDate={date}>
                  <Button
                    variant="ghost"
                    className="border opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  >
                    <Plus className="h-4 w-4" />
                    <span className="max-sm:hidden">Adicionar Evento</span>
                  </Button>
                </AddEditEventDialog>
              </div>
            ) : (
              [0, 1, 2].map(renderEventAtPosition)
            )}
          </motion.div>

          {showMobileMore && (
            <div className="flex justify-end items-end mx-2">
              <span className="text-[0.6rem] font-semibold text-accent-foreground">
                +{showMoreCount}
              </span>
            </div>
          )}

          {showDesktopMore && (
            <motion.div
              className={cn(
                "h-4.5 px-1.5 my-2 text-end text-xs font-semibold text-muted-foreground",
                !currentMonth && "opacity-50",
              )}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, ...transition }}
            >
              <EventListDialog date={date} occurrences={cellOccurrences} />
            </motion.div>
          )}
        </DroppableArea>
      </motion.div>
    ),
    [
      date,
      day,
      currentMonth,
      cellOccurrences,
      showMobileMore,
      showDesktopMore,
      showMoreCount,
      renderEventAtPosition,
      isMobile,
    ],
  );

  if (isMobile && currentMonth) {
    return (
      <EventListDialog date={date} occurrences={cellOccurrences}>
        {cellContent}
      </EventListDialog>
    );
  }

  return cellContent;
}
