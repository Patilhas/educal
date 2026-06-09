"use client";

import type React from "react";
import { createContext, useCallback, useContext, useMemo, useState } from "react";
import {
  createEventRequest,
  deleteEventRequest,
  updateEventRequest,
  updateOccurrenceRequest,
} from "@/features/calendar/client-requests";
import { useLocalStorage } from "@/features/calendar/hooks";
import { getEventAcademicYearStart } from "@/shared/calendar/academic-year";
import type { IEvent, IEventEnums, IHolidayPeriod, TEventCategory } from "@/shared/calendar/types";
import type { IUser } from "@/shared/user/types";
import { canManageCalendarEvents } from "@/shared/user/roles";
import { getEventColorByCategory } from "@/features/calendar/helpers";
import type { TCalendarView, TEventColor } from "@/features/calendar/types";
import { registerRuleTranslations } from "@/i18n/register-rules";

interface ICalendarContext {
  selectedDate: Date;
  academicYearStart: number;
  view: TCalendarView;
  setView: (view: TCalendarView) => void;
  agendaModeGroupBy: "date" | "category";
  setAgendaModeGroupBy: (groupBy: "date" | "category") => void;
  use24HourFormat: boolean;
  toggleTimeFormat: () => void;
  setSelectedDate: (date: Date | undefined) => void;
  selectedUserId: IUser["id"] | "all";
  setSelectedUserId: (userId: IUser["id"] | "all") => void;
  badgeVariant: "dot" | "colored";
  setBadgeVariant: (variant: "dot" | "colored") => void;
  selectedCategories: TEventCategory[];
  filterEventsBySelectedCategories: (category: TEventCategory) => void;
  filterEventsBySelectedUser: (userId: IUser["id"] | "all") => void;
  users: IUser[];
  currentUser: IUser | null;
  canEditEvents: boolean;
  eventEnums: IEventEnums;
  events: IEvent[];
  holidays: IHolidayPeriod[];
  addHoliday: (h: IHolidayPeriod) => void;
  replaceHoliday: (h: IHolidayPeriod) => void;
  removeHoliday: (id: string) => void;
  addEvent: (event: IEvent) => Promise<void>;
  updateEvent: (event: IEvent) => Promise<void>;
  updateOccurrence: (params: {
    eventId: number;
    occurrenceId: string;
    startDate?: string;
    endDate?: string;
    description?: string;
  }) => Promise<void>;
  removeEvent: (eventId: number) => Promise<void>;
  clearFilter: () => void;
  getEventColor: (category: string) => TEventColor;
}

interface CalendarSettings {
  badgeVariant: "dot" | "colored";
  view: TCalendarView;
  use24HourFormat: boolean;
  agendaModeGroupBy: "date" | "category";
}

const DEFAULT_SETTINGS: CalendarSettings = {
  badgeVariant: "colored",
  view: "day",
  use24HourFormat: true,
  agendaModeGroupBy: "date",
};

const CalendarContext = createContext<ICalendarContext | null>(null);

export function CalendarProvider({
  children,
  users,
  currentUser,
  events,
  initialEventEnums,
  initialHolidaysByYear = {},
  badge = "colored",
  view = "day",
}: {
  children: React.ReactNode;
  users: IUser[];
  currentUser: IUser | null;
  events: IEvent[];
  initialEventEnums: IEventEnums;
  initialHolidaysByYear?: Record<number, IHolidayPeriod[]>;
  view?: TCalendarView;
  badge?: "dot" | "colored";
}) {
  registerRuleTranslations(initialEventEnums.rules);

  const [settings, setSettings] = useLocalStorage<CalendarSettings>(
    "calendar-settings",
    {
      ...DEFAULT_SETTINGS,
      badgeVariant: badge,
      view: view,
    },
  );

  const [badgeVariant, setBadgeVariantState] = useState<"dot" | "colored">(
    settings.badgeVariant,
  );
  const [currentView, setCurrentViewState] = useState<TCalendarView>(
    settings.view,
  );
  const [use24HourFormat, setUse24HourFormatState] = useState<boolean>(
    settings.use24HourFormat,
  );
  const [agendaModeGroupBy, setAgendaModeGroupByState] = useState<
    "date" | "category"
  >(settings.agendaModeGroupBy);

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedUserId, setSelectedUserId] = useState<IUser["id"] | "all">(
    "all",
  );
  const [selectedCategories, setSelectedCategories] = useState<TEventCategory[]>([]);

  const [allEvents, setAllEvents] = useState<IEvent[]>(events || []);
  const [holidaysByYear, setHolidaysByYear] = useState<Record<number, IHolidayPeriod[]>>(initialHolidaysByYear);
  const canEditEvents = currentUser ? canManageCalendarEvents(currentUser.role) : false;
  const academicYearStart = selectedDate.getFullYear();

  const categoryColorMap = useMemo(
    () =>
      Object.fromEntries(initialEventEnums.categories.map(({ value, color }) => [value, color])),
    [initialEventEnums.categories],
  );

  const getEventColor = useCallback(
    (category: string): TEventColor => getEventColorByCategory(category, categoryColorMap),
    [categoryColorMap],
  );

  const updateSettings = (newPartialSettings: Partial<CalendarSettings>) => {
    setSettings({
      ...settings,
      ...newPartialSettings,
    });
  };

  const setBadgeVariant = (variant: "dot" | "colored") => {
    setBadgeVariantState(variant);
    updateSettings({ badgeVariant: variant });
  };

  const setView = (newView: TCalendarView) => {
    setCurrentViewState(newView);
    updateSettings({ view: newView });
  };

  const toggleTimeFormat = () => {
    const newValue = !use24HourFormat;
    setUse24HourFormatState(newValue);
    updateSettings({ use24HourFormat: newValue });
  };

  const setAgendaModeGroupBy = (groupBy: "date" | "category") => {
    setAgendaModeGroupByState(groupBy);
    updateSettings({ agendaModeGroupBy: groupBy });
  };

  const filterEventsBySelectedCategories = (category: TEventCategory) => {
    const isCategorySelected = selectedCategories.includes(category);
    const newCategories = isCategorySelected
      ? selectedCategories.filter((c) => c !== category)
      : [...selectedCategories, category];

    setSelectedCategories(newCategories);
  };

  const filterEventsBySelectedUser = (userId: IUser["id"] | "all") => {
    setSelectedUserId(userId);
  };

  const handleSelectDate = (date: Date | undefined) => {
    if (!date) return;
    setSelectedDate(date);
  };

  const addEvent = async (event: IEvent) => {
    const createdEvent = await createEventRequest(event);
    setAllEvents((prev) => [createdEvent, ...prev]);
  };

  const updateEvent = async (event: IEvent) => {
    const updatedEvent = await updateEventRequest(event);
    setAllEvents((prev) =>
      prev.map((item) => (item.id === updatedEvent.id ? updatedEvent : item)),
    );
  };

  const updateOccurrence = async ({
    eventId,
    occurrenceId,
    startDate,
    endDate,
    description,
  }: {
    eventId: number;
    occurrenceId: string;
    startDate?: string;
    endDate?: string;
    description?: string;
  }) => {
    const updatedEvent = await updateOccurrenceRequest({
      eventId,
      occurrenceId,
      startDate,
      endDate,
      description,
    });

    setAllEvents((prev) =>
      prev.map((item) => (item.id === updatedEvent.id ? updatedEvent : item)),
    );
  };

  const removeEvent = async (eventId: number) => {
    await deleteEventRequest(eventId);
    setAllEvents((prev) => prev.filter((event) => event.id !== eventId));
  };

  const addHoliday = (h: IHolidayPeriod) => {
    setHolidaysByYear((prev) => ({
      ...prev,
      [academicYearStart]: [...(prev[academicYearStart] ?? []), h],
    }));
  };

  const replaceHoliday = (h: IHolidayPeriod) => {
    setHolidaysByYear((prev) => ({
      ...prev,
      [academicYearStart]: (prev[academicYearStart] ?? []).map((item) =>
        item.id === h.id ? h : item,
      ),
    }));
  };

  const removeHoliday = (id: string) => {
    setHolidaysByYear((prev) => ({
      ...prev,
      [academicYearStart]: (prev[academicYearStart] ?? []).filter((h) => h.id !== id),
    }));
  };

  const clearFilter = () => {
    setSelectedCategories([]);
    setSelectedUserId("all");
  };

  const filteredEvents = useMemo(() => {
    return allEvents.filter((event) => {
      const matchesCategory =
        selectedCategories.length === 0 || selectedCategories.includes(event.category);
      const matchesUser =
        selectedUserId === "all" || event.user.id === selectedUserId;
      const matchesAcademicYear =
        getEventAcademicYearStart(event) === academicYearStart;

      return matchesCategory && matchesUser && matchesAcademicYear;
    });
  }, [allEvents, selectedCategories, selectedUserId, academicYearStart]);

  const holidays = useMemo(
    () => holidaysByYear[academicYearStart] ?? [],
    [holidaysByYear, academicYearStart],
  );

  const value = {
    selectedDate,
    academicYearStart,
    setSelectedDate: handleSelectDate,
    selectedUserId,
    setSelectedUserId,
    badgeVariant,
    setBadgeVariant,
    users,
    currentUser,
    canEditEvents,
    eventEnums: initialEventEnums,
    selectedCategories,
    filterEventsBySelectedCategories,
    filterEventsBySelectedUser,
    events: filteredEvents,
    view: currentView,
    use24HourFormat,
    toggleTimeFormat,
    setView,
    agendaModeGroupBy,
    setAgendaModeGroupBy,
    holidays,
    addHoliday,
    replaceHoliday,
    removeHoliday,
    addEvent,
    updateEvent,
    updateOccurrence,
    removeEvent,
    clearFilter,
    getEventColor,
  };

  return (
    <CalendarContext.Provider value={value}>
      {children}
    </CalendarContext.Provider>
  );
}

export function useCalendar(): ICalendarContext {
  const context = useContext(CalendarContext);
  if (context === null)
    throw new Error("useCalendar must be used within a CalendarProvider.");
  return context;
}
