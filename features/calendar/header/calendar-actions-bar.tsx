"use client";

import { motion } from "framer-motion";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  slideFromRight,
  transition,
} from "@/features/calendar/animations";
import { useCalendar } from "@/features/calendar/contexts/calendar-context";
import { useTranslations } from "@/i18n/use-translations";
import AddEditEventDialog from "@/features/calendar/dialogs/add-edit-event-dialog";
import { AcademicYearTools } from "@/features/calendar/header/academic-year-tools";
import { FilterEvents } from "@/features/calendar/header/filter";
import { UserSelect } from "@/features/calendar/header/user-select";
import Settings from "@/features/calendar/settings/settings";
import Views from "./view-tabs";

export function CalendarActionsBar() {
  const { canEditEvents } = useCalendar();
  const { t } = useTranslations();

  return (
    <div className="border-b px-4 py-3">
      <motion.div
        className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between"
        variants={slideFromRight}
        initial="initial"
        animate="animate"
        transition={transition}
      >
        <div className="flex flex-wrap items-center gap-2">
          <FilterEvents />
          <Views />
          <AcademicYearTools />
        </div>

        <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
          <div className="min-w-55 flex-1 lg:flex-none">
            <UserSelect />
          </div>

          {canEditEvents && (
            <AddEditEventDialog>
              <Button className="w-full lg:w-auto">
                <Plus className="h-4 w-4" />
                {t("calendar.header.addEvent")}
              </Button>
            </AddEditEventDialog>
          )}

          <Settings />
        </div>
      </motion.div>
    </div>
  );
}


