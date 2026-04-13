"use client";

import { format, parseISO } from "date-fns";
import { Calendar, Clock, Layers, List, Tag, Text, User } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCalendar } from "@/features/calendar/contexts/calendar-context";
import AddEditEventDialog from "@/features/calendar/dialogs/add-edit-event-dialog";
import DeleteEventDialog from "@/features/calendar/dialogs/delete-event-dialog";
import { formatTime, getEventCategoryLabel } from "@/features/calendar/helpers";
import type { IEvent, IOccurrence } from "@/features/calendar/interfaces";
import { useTranslations } from "@/i18n/use-translations";

interface IProps {
  event: IEvent;
  occurrence?: IOccurrence;
  children: ReactNode;
}

export default function EventDetailsDialog({ event, occurrence, children }: IProps) {
  const { use24HourFormat } = useCalendar();
  const { t } = useTranslations();

  // Use the provided occurrence or fall back to the first one
  const displayOccurrence = occurrence || event.occurrences[0];

  const startDate = displayOccurrence ? parseISO(displayOccurrence.startDate) : new Date();
  const endDate = displayOccurrence ? parseISO(displayOccurrence.endDate) : new Date();

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{event.name}</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[80vh]">
          <div className="space-y-4 p-4">
            <div className="flex items-start gap-2">
              <Text className="mt-1 size-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{t("calendar.dialogs.eventDetails.fields.objective")}</p>
                <p className="text-sm text-muted-foreground">{event.objective}</p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-start gap-2">
                <Tag className="mt-1 size-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{t("calendar.dialogs.eventDetails.fields.category")}</p>
                  <p className="text-sm text-muted-foreground">
                    {t(getEventCategoryLabel(event.category))}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Layers className="mt-1 size-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{t("calendar.dialogs.eventDetails.fields.classification")}</p>
                  <p className="text-sm text-muted-foreground">
                    {t(`calendar.classifications.${event.classification}` as never)}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <List className="mt-1 size-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{t("calendar.dialogs.eventDetails.fields.status")}</p>
                  <p className="text-sm text-muted-foreground">{t(`calendar.statuses.${event.status}` as never)}</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Clock className="mt-1 size-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{t("calendar.dialogs.eventDetails.fields.daysBetween")}</p>
                  <p className="text-sm text-muted-foreground">
                    {event.daysBetweenOccurrences || "-"}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <User className="mt-1 size-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{t("calendar.dialogs.eventDetails.fields.responsible")}</p>
                <p className="text-sm text-muted-foreground">{t(`calendar.responsibles.${event.responsible}` as never)}</p>
              </div>
            </div>

            {displayOccurrence && (
              <>
                <div className="flex items-start gap-2">
                  <Calendar className="mt-1 size-4 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{t("calendar.dialogs.eventDetails.fields.startDate")}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(startDate, "EEEE dd MMMM")}
                      <span className="mx-1">{t("calendar.dialogs.eventDetails.fields.at")}</span>
                      {formatTime(parseISO(displayOccurrence.startDate), use24HourFormat)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Clock className="mt-1 size-4 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{t("calendar.dialogs.eventDetails.fields.endDate")}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(endDate, "EEEE dd MMMM")}
                      <span className="mx-1">{t("calendar.dialogs.eventDetails.fields.at")}</span>
                      {formatTime(parseISO(displayOccurrence.endDate), use24HourFormat)}
                    </p>
                  </div>
                </div>
              </>
            )}

            <div className="flex items-start gap-2">
              <Text className="mt-1 size-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{t("calendar.dialogs.eventDetails.fields.createdBy")}</p>
                <p className="text-sm text-muted-foreground">
                  {event.user.name}
                </p>
              </div>
            </div>

            <div className="space-y-2 rounded-md border p-3">
              <p className="text-sm font-medium">{t("calendar.dialogs.eventDetails.fields.occurrences")}</p>
              {(event.occurrences ?? []).length === 0 && (
                <p className="text-sm text-muted-foreground">{t("calendar.dialogs.eventDetails.fields.noOccurrences")}</p>
              )}
              {(event.occurrences ?? []).map((occ, index) => (
                <div key={occ.id} className="rounded-md border p-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {t("calendar.dialogs.eventDetails.fields.occurrenceLabel")} {index + 1}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {occ.description}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(parseISO(occ.startDate), "dd/MM/yyyy HH:mm")} -{" "}
                    {format(parseISO(occ.endDate), "dd/MM/yyyy HH:mm")}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </ScrollArea>
        <div className="flex justify-end gap-2">
          <AddEditEventDialog event={event}>
            <Button variant="outline">{t("calendar.header.editEvent")}</Button>
          </AddEditEventDialog>
          <DeleteEventDialog eventId={event.id} />
        </div>
        <DialogClose />
      </DialogContent>
    </Dialog>
  );
}
