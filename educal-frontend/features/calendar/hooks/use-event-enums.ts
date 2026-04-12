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
let fetchPromise: Promise<IEventEnums> | null = null;

export function useEventEnums(): IEventEnums {
  const [enums, setEnums] = useState<IEventEnums>(cache ?? FALLBACK);

  useEffect(() => {
    if (cache) return;
    
    if (!fetchPromise) {
      fetchPromise = fetchEventEnums();
    }

    fetchPromise
      .then((data) => {
        cache = data;
        setEnums(data);
      })
      .catch((error) => {
        console.error("Failed to fetch event enums", error);
        if (!cache) {
          fetchPromise = null;
        }
      });
  }, []);

  return enums;
}
