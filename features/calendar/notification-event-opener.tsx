"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCalendar } from "@/features/calendar/contexts/calendar-context";
import EventDetailsDialog from "@/features/calendar/dialogs/event-details-dialog";

export function NotificationEventOpener() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { allEvents } = useCalendar();

  const openEventId = searchParams.get("openEventId");
  const openOccurrenceId = searchParams.get("openOccurrenceId");

  const event = openEventId
    ? allEvents.find((e) => e.id === Number(openEventId))
    : undefined;
  const occurrence = event?.occurrences?.find((o) => o.id === openOccurrenceId);

  const clearParams = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("openEventId");
    params.delete("openOccurrenceId");
    const query = params.toString();
    router.replace(query ? `/?${query}` : "/");
  };

  useEffect(() => {
    if (openEventId && !event) {
      clearParams();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openEventId, event]);

  if (!event) return null;

  const handleOpenChange = (open: boolean) => {
    if (open) return;
    clearParams();
  };

  return (
    <EventDetailsDialog event={event} occurrence={occurrence} open onOpenChange={handleOpenChange} />
  );
}
