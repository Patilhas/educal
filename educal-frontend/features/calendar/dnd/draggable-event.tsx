import { motion } from "framer-motion";
import type React from "react";
import type { ReactNode } from "react";
import { useCalendar } from "@/features/calendar/contexts/calendar-context";
import { useDragDrop } from "@/features/calendar/contexts/dnd-context";
import type { IEvent, IOccurrence } from "@/features/calendar/interfaces";

interface DraggableEventProps {
  event: IEvent;
  occurrence: IOccurrence;
  children: ReactNode;
  className?: string;
}

export function DraggableEvent({
  event,
  occurrence,
  children,
  className,
}: DraggableEventProps) {
  const { canEditEvents } = useCalendar();
  const { startDrag, endDrag, isDragging, draggedOccurrence } = useDragDrop();

  if (!canEditEvents) {
    return <>{children}</>;
  }

  const isCurrentlyDragged = isDragging && draggedOccurrence?.occurrence.id === occurrence.id;

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
  };

  return (
    <motion.div
      className={`${className || ""} ${isCurrentlyDragged ? "opacity-50 cursor-grabbing" : "cursor-grab"}`}
      draggable
      onClick={(e: React.MouseEvent<HTMLDivElement>) => handleClick(e)}
      onDragStart={(e) => {
        (e as DragEvent).dataTransfer!.setData(
          "text/plain",
          occurrence.id,
        );
        startDrag(event, occurrence);
      }}
      onDragEnd={() => {
        endDrag();
      }}
    >
      {children}
    </motion.div>
  );
}
