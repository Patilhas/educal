"use client";

import { useEffect, useState } from "react";
import { fetchEventEnums } from "@/features/calendar/client-requests";
import type { IEventEnums } from "@/features/calendar/interfaces";

const FALLBACK: IEventEnums = {
  categories: [],
  classifications: [],
  statuses: [],
  responsibles: [],
};

let cache: IEventEnums | null = null;

export function useEventEnums(): IEventEnums {
  const [enums, setEnums] = useState<IEventEnums>(cache ?? FALLBACK);

  useEffect(() => {
    if (cache) return;
    fetchEventEnums().then((data) => {
      cache = data;
      setEnums(data);
    });
  }, []);

  return enums;
}
