import { list, put } from "@vercel/blob";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

import type { ICalendarDb } from "@/server/calendar/data/calendar.seed";

const DB_FILE_NAME = "calendar-db.json";
const LOCAL_DB_PATH = join(
  process.cwd(),
  "server",
  "calendar",
  "data",
  "cache",
  DB_FILE_NAME,
);

const shouldUseVercelBlob = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN);

const tryParseDb = (rawValue: string): ICalendarDb | null => {
  try {
    return JSON.parse(rawValue) as ICalendarDb;
  } catch {
    return null;
  }
};

const loadFromLocalFile = async (): Promise<ICalendarDb | null> => {
  try {
    const fileContent = await readFile(LOCAL_DB_PATH, "utf8");
    return tryParseDb(fileContent);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return null;
    }

    throw error;
  }
};

const saveToLocalFile = async (db: ICalendarDb): Promise<void> => {
  await mkdir(dirname(LOCAL_DB_PATH), { recursive: true });
  await writeFile(LOCAL_DB_PATH, JSON.stringify(db), "utf8");
};

const loadFromVercelBlob = async (): Promise<ICalendarDb | null> => {
  const { blobs } = await list({ prefix: DB_FILE_NAME });
  const blob = blobs.find((entry) => entry.pathname === DB_FILE_NAME);
  if (!blob) {
    return null;
  }

  const response = await fetch(blob.url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to load ${DB_FILE_NAME} from Vercel Blob.`);
  }

  return (await response.json()) as ICalendarDb;
};

const saveToVercelBlob = async (db: ICalendarDb): Promise<void> => {
  await put(DB_FILE_NAME, JSON.stringify(db), {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });
};

export const loadCalendarDbFromStorage = async (): Promise<ICalendarDb | null> => {
  if (shouldUseVercelBlob()) {
    return loadFromVercelBlob();
  }

  return loadFromLocalFile();
};

export const saveCalendarDbToStorage = async (db: ICalendarDb): Promise<void> => {
  if (shouldUseVercelBlob()) {
    await saveToVercelBlob(db);
    return;
  }

  await saveToLocalFile(db);
};

