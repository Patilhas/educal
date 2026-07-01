"use client";

import { useMemo, useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { IEvent } from "@/shared/calendar/types";
import { useTranslations } from "@/i18n/use-translations";

export type EventGapConstraint = { eventId: number; minWorkingDays: number };

interface EventConstraintListProps {
  value: EventGapConstraint[];
  onChange: (constraints: EventGapConstraint[]) => void;
  events: IEvent[];
  excludeEventId?: number;
}

export function EventConstraintList({ value, onChange, events, excludeEventId }: EventConstraintListProps) {
  const [open, setOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslations();

  const selectedIds = useMemo(() => new Set(value.map((c) => c.eventId)), [value]);

  const availableEvents = useMemo(
    () => events.filter((e) => e.id !== excludeEventId && !selectedIds.has(e.id)),
    [events, excludeEventId, selectedIds],
  );
  const byCategory = useMemo(() => {
    const map = new Map<string, IEvent[]>();
    for (const event of availableEvents) {
      if (!map.has(event.category)) map.set(event.category, []);
      map.get(event.category)!.push(event);
    }
    return map;
  }, [availableEvents]);

  const addConstraint = (eventId: number) => {
    onChange([...value, { eventId, minWorkingDays: 2 }]);
  };

  const removeConstraint = (eventId: number) => {
    onChange(value.filter((c) => c.eventId !== eventId));
  };

  const updateDays = (eventId: number, minWorkingDays: number) => {
    onChange(value.map((c) => (c.eventId === eventId ? { ...c, minWorkingDays } : c)));
  };

  return (
    <div className="space-y-1.5">
      {value.map(({ eventId, minWorkingDays }) => {
        const event = events.find((e) => e.id === eventId);
        if (!event) return null;
        return (
          <div key={eventId} className="flex items-center gap-2">
            <span className="min-w-0 flex-1 truncate text-xs">{event.name}</span>
            <div className="flex shrink-0 items-center gap-1">
              <input
                type="number"
                min={1}
                value={minWorkingDays}
                onChange={(e) => updateDays(eventId, parseInt(e.target.value, 10) || 1)}
                className="w-14 h-6 rounded border border-input bg-background px-2 text-xs"
              />
              <span className="text-xs text-muted-foreground">
                {t("calendar.dialogs.addEditEvent.rules.eventConstraintList.daysLabel")}
              </span>
              <button
                type="button"
                onClick={() => removeConstraint(eventId)}
                className="text-muted-foreground hover:text-foreground"
                aria-label={`Remove ${event.name}`}
              >
                <X className="size-3.5" />
              </button>
            </div>
          </div>
        );
      })}

      {availableEvents.length > 0 && (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button type="button" variant="outline" size="sm" className="h-7 text-xs gap-1">
              <Plus className="size-3" />
              {t("calendar.dialogs.addEditEvent.rules.eventConstraintList.add")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-0" align="start">
            <Command>
              <CommandInput placeholder={t("calendar.dialogs.addEditEvent.rules.eventMultiSelect.search")} />
            <div
              ref={scrollRef}
              style={{ maxHeight: "16rem", overflowY: "auto", scrollbarWidth: "thin" }}
              onWheelCapture={(e) => {
                if (scrollRef.current) {
                  scrollRef.current.scrollTop += e.deltaY;
                  e.preventDefault();
                  e.stopPropagation();
                }
              }}
            >
              <CommandList>
                <CommandEmpty>{t("calendar.dialogs.addEditEvent.rules.eventMultiSelect.empty")}</CommandEmpty>
                {[...byCategory.entries()].map(([category, categoryEvents]) => (
                  <CommandGroup
                    key={category}
                    heading={t(`calendar.categories.${category}` as never)}
                  >
                    {categoryEvents.map((event) => (
                      <CommandItem
                        key={event.id}
                        value={`${event.id}-${event.name}`}
                        onSelect={() => addConstraint(event.id)}
                      >
                        <span className="truncate">{event.name}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                ))}
              </CommandList>
            </div>
            </Command>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
