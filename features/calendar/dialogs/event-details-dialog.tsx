"use client";

import { format, parseISO } from "date-fns";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useCalendar } from "@/features/calendar/contexts/calendar-context";
import AddEditEventDialog from "@/features/calendar/dialogs/add-edit-event-dialog";
import DeleteEventDialog from "@/features/calendar/dialogs/delete-event-dialog";
import { formatTime, getEventCategoryLabel } from "@/features/calendar/helpers";
import type { IEvent, IOccurrence } from "@/shared/calendar/types";
import type { EventGapConstraint } from "@/features/calendar/components/event-constraint-list";
import { useTranslations } from "@/i18n/use-translations";

interface IProps {
  event: IEvent;
  occurrence?: IOccurrence;
  children?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

function MetaField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70">
        {label}
      </p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}

export default function EventDetailsDialog({ event, occurrence, children, open, onOpenChange }: IProps) {
  const { use24HourFormat, canEditEvents, eventEnums, allEvents, academicYearStart } = useCalendar();
  const yearEvents = allEvents.filter((e) => e.academicYearStart === academicYearStart);
  const { t } = useTranslations();

  const displayOccurrence = occurrence || event.occurrences[0];
  const startDate = displayOccurrence ? parseISO(displayOccurrence.startDate) : new Date();
  const endDate = displayOccurrence ? parseISO(displayOccurrence.endDate) : new Date();
  const occurrenceCount = (event.occurrences ?? []).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent
        showCloseButton={false}
        aria-describedby={undefined}
        className="flex flex-col w-[85vw] max-w-[85vw] h-[82vh] max-h-[82vh] p-0 gap-0 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-start gap-4 px-8 pt-7 pb-6 shrink-0 border-b">
          <div className="flex-1 min-w-0">
            <DialogTitle className="text-xl font-semibold tracking-tight leading-snug">
              {event.name}
            </DialogTitle>
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              <Badge variant="secondary">{t(getEventCategoryLabel(event.category))}</Badge>
              <Badge variant="outline">
                {t(`calendar.classifications.${event.classification}` as never)}
              </Badge>
              <Badge variant="outline">
                {t(`calendar.statuses.${event.status}` as never)}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 pt-0.5">
            {canEditEvents && (
              <>
                <AddEditEventDialog event={event}>
                  <Button variant="outline" size="sm">
                    {t("calendar.header.editEvent")}
                  </Button>
                </AddEditEventDialog>
                <DeleteEventDialog eventId={event.id} />
              </>
            )}
            <DialogClose asChild>
              <Button variant="ghost" size="icon-sm" className="ml-1">
                <X className="size-4" />
                <span className="sr-only">Close</span>
              </Button>
            </DialogClose>
          </div>
        </div>

        {/* Two-panel body */}
        <div className="flex flex-1 min-h-0">
          {/* Left panel — event details */}
          <div className="w-[38%] shrink-0 flex flex-col gap-7 px-8 py-7 bg-muted/30 border-r overflow-y-auto">
            {/* Objective */}
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70">
                {t("calendar.dialogs.eventDetails.fields.objective")}
              </p>
              <p className="text-sm leading-relaxed">{event.objective}</p>
            </div>

            {/* Metadata grid */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-5">
              <MetaField
                label={t("calendar.dialogs.eventDetails.fields.responsible")}
                value={t(`calendar.responsibles.${event.responsible}` as never)}
              />
              <MetaField
                label={t("calendar.dialogs.eventDetails.fields.createdBy")}
                value={event.user.name}
              />
              {displayOccurrence && (
                <>
                  <MetaField
                    label={t("calendar.dialogs.eventDetails.fields.startDate")}
                    value={`${format(startDate, "dd MMM")} · ${formatTime(
                      parseISO(displayOccurrence.startDate),
                      use24HourFormat,
                    )}`}
                  />
                  <MetaField
                    label={t("calendar.dialogs.eventDetails.fields.endDate")}
                    value={`${format(endDate, "dd MMM")} · ${formatTime(
                      parseISO(displayOccurrence.endDate),
                      use24HourFormat,
                    )}`}
                  />
                </>
              )}
            </div>

            {/* Applied rules */}
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70">
                {t("calendar.dialogs.eventDetails.fields.rules")}
              </p>
              <div className="space-y-2">
                {(event.rules ?? []).map((rule, index) => {
                  const meta = eventEnums.rules.find((r) => r.id === rule.type);
                  if (!meta) return null;
                  return (
                    <div key={`${rule.type}-${index}`} className="rounded-md border bg-background px-3 py-2 space-y-1.5">
                      <p className="text-sm font-medium">{t(`calendar.rules.${rule.type}.label` as never)}</p>
                      <div className="flex flex-col gap-1.5">
                        {meta.fields.map((fieldDef) => {
                          const label = t(`calendar.rules.${rule.type}.fields.${fieldDef.id}` as never);

                          if (fieldDef.type === "event-multiselect") {
                            const ids = (rule.config[fieldDef.id] as number[] | undefined) ?? [];
                            const selected = yearEvents.filter((e) => ids.includes(e.id));
                            if (selected.length === 0) return null;
                            return (
                              <div key={fieldDef.id} className="space-y-1">
                                <span className="text-xs text-muted-foreground">{label}</span>
                                <div className="flex flex-wrap gap-1">
                                  {selected.map((e) => (
                                    <Badge key={e.id} variant="secondary" className="text-xs font-normal">{e.name}</Badge>
                                  ))}
                                </div>
                              </div>
                            );
                          }

                          if (fieldDef.type === "event-constraints") {
                            const constraints = (rule.config[fieldDef.id] as EventGapConstraint[] | undefined) ?? [];
                            if (constraints.length === 0) return null;
                            return (
                              <div key={fieldDef.id} className="space-y-1">
                                <span className="text-xs text-muted-foreground">{label}</span>
                                <div className="space-y-0.5">
                                  {constraints.map((c) => {
                                    const ev = yearEvents.find((e) => e.id === c.eventId);
                                    if (!ev) return null;
                                    return (
                                      <div key={c.eventId} className="flex items-center gap-1.5 text-xs">
                                        <Badge variant="secondary" className="font-normal">{ev.name}</Badge>
                                        <span className="text-muted-foreground">{c.minWorkingDays} {t("calendar.dialogs.addEditEvent.rules.eventConstraintList.daysLabel")}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          }

                          const active = Boolean(rule.config[fieldDef.id] ?? fieldDef.defaultValue);
                          return (
                            <span
                              key={fieldDef.id}
                              className={`text-xs ${active ? "text-foreground" : "text-muted-foreground line-through"}`}
                            >
                              {label}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right panel — occurrences */}
          <div className="flex-1 flex flex-col px-8 py-7 overflow-hidden">
            <div className="flex items-baseline gap-2 mb-5 shrink-0">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70">
                {t("calendar.dialogs.eventDetails.fields.occurrences")}
              </p>
              <span className="text-xs text-muted-foreground">({occurrenceCount})</span>
            </div>

            {occurrenceCount === 0 ? (
              <div className="flex items-center justify-center flex-1 text-sm text-muted-foreground">
                {t("calendar.dialogs.eventDetails.fields.noOccurrences")}
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto">
                <div className="grid gap-3 grid-cols-2 pr-1">
                  {(event.occurrences ?? []).map((occ, index) => (
                    <div key={occ.id} className="rounded-lg border bg-background p-4 space-y-2 hover:bg-muted/30 transition-colors">
                      <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70">
                        {t("calendar.dialogs.eventDetails.fields.occurrenceLabel")} {index + 1}
                      </p>
                      <p className="text-sm leading-relaxed">{occ.description}</p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {format(parseISO(occ.startDate), "dd/MM/yyyy HH:mm")} –{" "}
                        {format(parseISO(occ.endDate), "dd/MM/yyyy HH:mm")}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
