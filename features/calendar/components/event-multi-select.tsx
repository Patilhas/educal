"use client";

import { useMemo, useRef, useState } from "react";
import { ChevronsUpDown, X } from "lucide-react";
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

interface EventMultiSelectProps {
  value: number[];
  onChange: (ids: number[]) => void;
  events: IEvent[];
  excludeEventId?: number;
}

export function EventMultiSelect({ value, onChange, events, excludeEventId }: EventMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslations();

  const availableEvents = useMemo(
    () => events.filter((e) => e.id !== excludeEventId),
    [events, excludeEventId],
  );

  const byCategory = useMemo(() => {
    const map = new Map<string, IEvent[]>();
    for (const event of availableEvents) {
      if (!map.has(event.category)) map.set(event.category, []);
      map.get(event.category)!.push(event);
    }
    return map;
  }, [availableEvents]);

  const toggle = (id: number) => {
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  };

  const selectedEvents = useMemo(
    () => value.map((id) => events.find((e) => e.id === id)).filter(Boolean) as IEvent[],
    [value, events],
  );

  return (
    <div className="space-y-1.5">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="h-8 w-full justify-between text-xs font-normal"
          >
            <span className="text-muted-foreground">
              {t("calendar.dialogs.addEditEvent.rules.eventMultiSelect.placeholder")}
            </span>
            <ChevronsUpDown className="ml-2 size-3.5 shrink-0 opacity-50" />
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
                        onSelect={() => toggle(event.id)}
                        data-checked={value.includes(event.id)}
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

      {selectedEvents.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedEvents.map((event) => (
            <span
              key={event.id}
              className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 text-xs"
            >
              <span className="max-w-[160px] truncate">{event.name}</span>
              <button
                type="button"
                onClick={() => toggle(event.id)}
                className="shrink-0 text-muted-foreground hover:text-foreground"
                aria-label={`Remove ${event.name}`}
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
