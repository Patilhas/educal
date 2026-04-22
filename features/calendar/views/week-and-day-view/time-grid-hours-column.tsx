import { format } from "date-fns";
import { motion } from "framer-motion";
import { staggerContainer, transition } from "@/features/calendar/animations";

interface TimeGridHoursColumnProps {
  hours: number[];
  use24HourFormat: boolean;
}

export function TimeGridHoursColumn({
  hours,
  use24HourFormat,
}: TimeGridHoursColumnProps) {
  return (
    <motion.div className="relative w-18" variants={staggerContainer}>
      {hours.map((hour, index) => {
        const hourDate = new Date();
        hourDate.setHours(hour, 0, 0, 0);

        return (
          <motion.div
            key={hour}
            className="relative"
            style={{ height: "96px" }}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.02, ...transition }}
          >
            <div className="absolute -top-3 right-2 flex h-6 items-center">
              {index !== 0 && (
                <span className="text-xs text-muted-foreground/70">
                  {format(hourDate, use24HourFormat ? "HH:00" : "h a")}
                </span>
              )}
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

