import { format, parseISO } from "date-fns";
import type { FC } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { useCalendar } from "@/features/calendar/contexts/calendar-context";
import EventDetailsDialog from "@/features/calendar/dialogs/event-details-dialog";
import {
  formatTime,
  getBgColor,
  getColorClass,
  getEventCategoryLabel,
  getEventColorByCategory,
  getEventsForMonth,
  getFirstLetters,
} from "@/features/calendar/helpers";
import { EventBullet } from "@/features/calendar/views/month-view/event-bullet";

export default function AgendaEvents() {
  const {
    events,
    use24HourFormat,
    badgeVariant,
    agendaModeGroupBy,
    selectedDate,
  } = useCalendar();

  // Transform events to occurrences
  const occurrences = events.flatMap((event) =>
    event.occurrences.map((occurrence) => ({
      event,
      occurrence,
    }))
  );

  const monthOccurrences = getEventsForMonth(occurrences, selectedDate);

  const agendaOccurrences = monthOccurrences.reduce<
    Record<string, typeof monthOccurrences>
  >((groups, item) => {
    const groupKey =
      agendaModeGroupBy === "date"
        ? format(parseISO(item.occurrence.startDate), "yyyy-MM-dd")
        : item.event.category;

    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }

    groups[groupKey].push(item);
    return groups;
  }, {});

  const groupedAndSortedOccurrences = Object.entries(agendaOccurrences).sort(
    (a, b) => {
      if (agendaModeGroupBy === "date") {
        return new Date(a[0]).getTime() - new Date(b[0]).getTime();
      }

      return a[0].localeCompare(b[0], "pt-PT", { sensitivity: "base" });
    },
  );

  return (
    <Command className="py-4 h-[80vh] bg-transparent">
      <div className="mb-4 mx-4">
        <CommandInput placeholder="Escreve um comando ou pesquisa..." />
      </div>
      <CommandList className="max-h-max px-3 border-t">
        {groupedAndSortedOccurrences.map(([date, groupedOccurrences]) => (
          <CommandGroup
            key={date}
            heading={
              agendaModeGroupBy === "date"
                ? format(parseISO(date), "EEEE, MMMM d, yyyy")
                : getEventCategoryLabel(groupedOccurrences![0].event.category)
            }
          >
            {groupedOccurrences!.map(({ event, occurrence }) => (
              <CommandItem
                key={occurrence.id}
                className={cn(
                  "mb-2 p-4 border rounded-md data-[selected=true]:bg-bg transition-all data-[selected=true]:text-none hover:cursor-pointer",
                  {
                    [getColorClass(getEventColorByCategory(event.category))]:
                      badgeVariant === "colored",
                    "hover:bg-zinc-200 dark:hover:bg-gray-900":
                      badgeVariant === "dot",
                    "hover:opacity-60": badgeVariant === "colored",
                  },
                )}
              >
                <EventDetailsDialog event={event} occurrence={occurrence}>
                  <div className="w-full flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      {badgeVariant === "dot" ? (
                        <EventBullet color={getEventColorByCategory(event.category)} />
                      ) : (
                        <Avatar>
                          <AvatarImage src="" alt="@shadcn" />
                          <AvatarFallback className={getBgColor(getEventColorByCategory(event.category))}>
                            {getFirstLetters(event.name)}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div className="flex flex-col">
                        <p
                          className={cn({
                            "font-medium": badgeVariant === "dot",
                            "text-foreground": badgeVariant === "dot",
                          })}
                        >
                          {event.name}
                        </p>
                      </div>
                    </div>
                    <div className="w-40 flex justify-center items-center gap-1">
                      {agendaModeGroupBy === "date" ? (
                        <>
                          <p className="text-sm">
                            {formatTime(occurrence.startDate, use24HourFormat)}
                          </p>
                          <span className="text-muted-foreground">-</span>
                          <p className="text-sm">
                            {formatTime(occurrence.endDate, use24HourFormat)}
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-sm">
                            {format(occurrence.startDate, "MM/dd/yyyy")}
                          </p>
                          <span className="text-sm">às</span>
                          <p className="text-sm">
                            {formatTime(occurrence.startDate, use24HourFormat)}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </EventDetailsDialog>
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
        <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
      </CommandList>
    </Command>
  );
};
