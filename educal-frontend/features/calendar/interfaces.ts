export type TEventCategory = string;
export type TEventClassification = string;
export type TEventStatus = string;
export type TEventResponsible = string;
export type TUserRole = "viewer" | "editor" | "admin";

const USER_ROLE_HIERARCHY: Record<TUserRole, number> = {
  viewer: 0,
  editor: 1,
  admin: 2,
};

export function hasRoleAtLeast(role: TUserRole, minimumRole: TUserRole) {
  return USER_ROLE_HIERARCHY[role] >= USER_ROLE_HIERARCHY[minimumRole];
}

export function canManageCalendarEvents(role: TUserRole) {
  return hasRoleAtLeast(role, "editor");
}

// ─── Reference entities (DB table rows) ─────────────────────────────────────

export interface ICategory {
  value: string;
  color: string;
}

export interface IClassification {
  value: string;
}

export interface IStatus {
  name: string;
}

export interface IResponsible {
  value: string;
}

// ─── Core entities ────────────────────────────────────────────────────────────

export interface IUser {
  id: string;
  name: string;
  picturePath: string | null;
  role: TUserRole;
}

export type IEventUser = Pick<IUser, "id" | "name" | "picturePath">;

export interface IOccurrence {
  id: string;
  description: string;
  startDate: string;
  endDate: string;
}

export interface IEvent {
  id: number;
  name: string;
  objective: string;
  daysBetweenOccurrences: string;
  category: TEventCategory;
  classification: TEventClassification;
  status: TEventStatus;
  responsible: TEventResponsible;
  occurrences: IOccurrence[];
  user: IEventUser;
}

export interface ICalendarCell {
  day: number;
  currentMonth: boolean;
  date: Date;
}

// Shape returned by GET /api/events/enums
export interface IEventEnums {
  categories: ICategory[];
  classifications: string[];
  statuses: string[];
  responsibles: string[];
}
