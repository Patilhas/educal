import type { TUserRole } from "@/shared/user/types";

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

