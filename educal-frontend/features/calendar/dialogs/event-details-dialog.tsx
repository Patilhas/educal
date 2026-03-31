"use client";

import { format, parseISO } from "date-fns";
import { Calendar, Clock, Layers, List, Tag, Text, User } from "lucide-react";
import type { ReactNode } from "react";
import { toast } from "sonner";
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
import { AddEditEventDialog } from "@/features/calendar/dialogs/add-edit-event-dialog";
import { formatTime } from "@/features/calendar/helpers";
import type { IEvent, IOccurrence } from "@/features/calendar/interfaces";

interface IProps {
  event: IEvent;
  occurrence?: IOccurrence;
  children: ReactNode;
}

export function EventDetailsDialog({ event, occurrence, children }: IProps) {
  const { use24HourFormat, removeEvent } = useCalendar();

  // Use the provided occurrence or fall back to the first one
  const displayOccurrence = occurrence || event.occurrences[0];
  
  const startDate = displayOccurrence ? parseISO(displayOccurrence.startDate) : new Date();
  const endDate = displayOccurrence ? parseISO(displayOccurrence.endDate) : new Date();

  const deleteEvent = (eventId: number) => {
    try {
      removeEvent(eventId);
      toast.success("Evento eliminado com sucesso.");
    } catch {
      toast.error("Erro ao eliminar evento.");
    }
  };

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
                <p className="text-sm font-medium">Objetivo</p>
                <p className="text-sm text-muted-foreground">{event.objective}</p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-start gap-2">
                <Tag className="mt-1 size-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Categoria</p>
                  <p className="text-sm text-muted-foreground">{event.category}</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Layers className="mt-1 size-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Classificação</p>
                  <p className="text-sm text-muted-foreground">
                    {event.classification}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <List className="mt-1 size-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Estado</p>
                  <p className="text-sm text-muted-foreground">{event.status}</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Clock className="mt-1 size-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Dias entre ocorrências</p>
                  <p className="text-sm text-muted-foreground">
                    {event.daysBetweenOccurrences || "-"}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <User className="mt-1 size-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Responsável</p>
                <p className="text-sm text-muted-foreground">{event.responsible}</p>
              </div>
            </div>

            {displayOccurrence && (
              <>
                <div className="flex items-start gap-2">
                  <Calendar className="mt-1 size-4 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Data de início</p>
                    <p className="text-sm text-muted-foreground">
                      {format(startDate, "EEEE dd MMMM")}
                      <span className="mx-1">às</span>
                      {formatTime(parseISO(displayOccurrence.startDate), use24HourFormat)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Clock className="mt-1 size-4 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Data de fim</p>
                    <p className="text-sm text-muted-foreground">
                      {format(endDate, "EEEE dd MMMM")}
                      <span className="mx-1">às</span>
                      {formatTime(parseISO(displayOccurrence.endDate), use24HourFormat)}
                    </p>
                  </div>
                </div>
              </>
            )}

            <div className="flex items-start gap-2">
              <Text className="mt-1 size-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Utilizador criador</p>
                <p className="text-sm text-muted-foreground">
                  {event.user.name}
                </p>
              </div>
            </div>

            <div className="space-y-2 rounded-md border p-3">
              <p className="text-sm font-medium">Ocorrências</p>
              {(event.occurrences ?? []).length === 0 && (
                <p className="text-sm text-muted-foreground">Sem ocorrências.</p>
              )}
              {(event.occurrences ?? []).map((occ, index) => (
                <div key={occ.id} className="rounded-md border p-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Ocorrência {index + 1}
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
            <Button variant="outline">Editar</Button>
          </AddEditEventDialog>
          <Button
            variant="destructive"
            onClick={() => {
              deleteEvent(event.id);
            }}
          >
            Eliminar
          </Button>
        </div>
        <DialogClose />
      </DialogContent>
    </Dialog>
  );
}
