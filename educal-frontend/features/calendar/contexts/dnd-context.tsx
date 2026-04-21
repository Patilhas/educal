"use client";

import React, {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useRef,
  useState,
  useMemo,
} from "react";
import { toast } from "sonner";
import { useCalendar } from "@/features/calendar/contexts/calendar-context";
import type { IEvent, IOccurrence } from "@/shared/calendar/types";
import { useTranslations } from "@/i18n";

interface DragDropContextType {
  draggedOccurrence: { event: IEvent; occurrence: IOccurrence } | null;
  isDragging: boolean;
  startDrag: (event: IEvent, occurrence: IOccurrence) => void;
  endDrag: () => void;
  handleEventDrop: (date: Date, hour?: number, minute?: number) => void;
}

interface DndProviderProps {
  children: ReactNode;
}

const DragDropContext = createContext<DragDropContextType | undefined>(
  undefined,
);

export function DndProvider({ children }: DndProviderProps) {
  const { t } = useTranslations();
  const { updateOccurrence, canEditEvents } = useCalendar();
  const [dragState, setDragState] = useState<{
    draggedOccurrence: { event: IEvent; occurrence: IOccurrence } | null;
    isDragging: boolean;
  }>({ draggedOccurrence: null, isDragging: false });

  const onEventDroppedRef = useRef<
    ((event: IEvent, occurrence: IOccurrence, newStartDate: Date, newEndDate: Date) => void) | null
  >(null);

  const startDrag = useCallback((event: IEvent, occurrence: IOccurrence) => {
    setDragState({ draggedOccurrence: { event, occurrence }, isDragging: true });
  }, []);

  const endDrag = useCallback(() => {
    setDragState({ draggedOccurrence: null, isDragging: false });
  }, []);

  const calculateNewDates = useCallback(
    (occurrence: IOccurrence, targetDate: Date, hour?: number, minute?: number) => {
      const originalStart = new Date(occurrence.startDate);
      const originalEnd = new Date(occurrence.endDate);
      const duration = originalEnd.getTime() - originalStart.getTime();

      const newStart = new Date(targetDate);
      if (hour !== undefined) {
        newStart.setHours(hour, minute || 0, 0, 0);
      } else {
        newStart.setHours(
          originalStart.getHours(),
          originalStart.getMinutes(),
          0,
          0,
        );
      }

      return {
        newStart,
        newEnd: new Date(newStart.getTime() + duration),
      };
    },
    [],
  );

  const isSamePosition = useCallback((date1: Date, date2: Date) => {
    return date1.getTime() === date2.getTime();
  }, []);

  const handleEventDrop = useCallback(
    (targetDate: Date, hour?: number, minute?: number) => {
      if (!canEditEvents) return;

      const { draggedOccurrence } = dragState;
      if (!draggedOccurrence) return;

      const { newStart, newEnd } = calculateNewDates(
        draggedOccurrence.occurrence,
        targetDate,
        hour,
        minute,
      );
      const originalStart = new Date(draggedOccurrence.occurrence.startDate);

      // Check if dropped in same position
      if (isSamePosition(originalStart, newStart)) {
        endDrag();
        return;
      }

      // Instantly update event
      const callback = onEventDroppedRef.current;
      if (callback) {
        callback(draggedOccurrence.event, draggedOccurrence.occurrence, newStart, newEnd);
      }
      endDrag();
    },
    [canEditEvents, dragState, calculateNewDates, isSamePosition, endDrag],
  );

  // Default occurrence update handler
  const handleOccurrenceUpdate = useCallback(
    async (event: IEvent, occurrence: IOccurrence, newStartDate: Date, newEndDate: Date) => {
      try {
        await updateOccurrence({
          eventId: event.id,
          occurrenceId: occurrence.id,
          startDate: newStartDate.toISOString(),
          endDate: newEndDate.toISOString(),
        });
        toast.success(t("calendar.messages.occurrenceUpdateSuccess"));
      } catch {
        toast.error(t("calendar.messages.occurrenceUpdateError"));
      }
    },
    [t, updateOccurrence],
  );

  // Set default callback
  React.useEffect(() => {
    onEventDroppedRef.current = handleOccurrenceUpdate;
  }, [handleOccurrenceUpdate]);

  const contextValue = useMemo(
    () => ({
      draggedOccurrence: dragState.draggedOccurrence,
      isDragging: dragState.isDragging,
      startDrag,
      endDrag,
      handleEventDrop,
    }),
    [dragState, startDrag, endDrag, handleEventDrop],
  );

  return (
    <DragDropContext.Provider value={contextValue}>
      {children}
    </DragDropContext.Provider>
  );
}

export function useDragDrop() {
  const context = useContext(DragDropContext);
  if (!context) {
    throw new Error("useDragDrop must be used within a DragDropProvider");
  }
  return context;
}
