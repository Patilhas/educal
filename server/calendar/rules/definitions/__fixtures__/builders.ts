import type { IEvent, IOccurrence, IVacationPeriod } from "@/shared/calendar/types";
import type { IUser } from "@/shared/user/types";
import type { IRuleValidationContext } from "@/server/calendar/rules/types";

export function makeUser(overrides: Partial<IUser> = {}): IUser {
  return {
    id: "user-1",
    name: "Test User",
    picturePath: null,
    role: "editor",
    ...overrides,
  };
}

export function makeOccurrence(overrides: Partial<IOccurrence> = {}): IOccurrence {
  return {
    id: "occ-1",
    description: "",
    startDate: "2026-01-05T00:00:00.000Z",
    endDate: "2026-01-05T00:00:00.000Z",
    ...overrides,
  };
}

export function makeEvent(overrides: Partial<IEvent> = {}): IEvent {
  return {
    id: 1,
    name: "Test Event",
    objective: "",
    category: "generic",
    classification: "generic",
    status: "active",
    responsible: "generic",
    rules: [],
    occurrences: [makeOccurrence()],
    user: makeUser(),
    ...overrides,
  };
}

export function makeVacationPeriod(overrides: Partial<IVacationPeriod> = {}): IVacationPeriod {
  return {
    id: "vac-1",
    label: "Test Vacation",
    startDate: "2026-12-20T00:00:00.000Z",
    endDate: "2027-01-04T00:00:00.000Z",
    ...overrides,
  };
}

export function makeContext(overrides: Partial<IRuleValidationContext> = {}): IRuleValidationContext {
  return {
    allEvents: [],
    academicYearStart: 2026,
    vacations: [],
    ...overrides,
  };
}
