"use client"

import Link from "next/link";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { LogOutIcon } from "lucide-react";
import type { IUser, TUserRole } from "@/shared/user/types"
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { requestJson } from "@/lib/api-client";
import { useTranslations } from "@/i18n/use-translations";
import { NotificationBell } from "@/features/notifications/notification-bell";

interface MainNavbarProps {
  currentUser: IUser;
  activePath: "/" | "/admin/users";
}

export function MainNavbar({ currentUser, activePath }: MainNavbarProps) {
  const router = useRouter();
  const { t } = useTranslations();

  const links = [
    { href: "/" as const, label: t("common.navBar.calendar") },
    ...(currentUser.role === "admin"
      ? ([{ href: "/admin/users" as const, label: t("common.navBar.users") }] as const)
      : []),
  ]

  const getRoleLabel = (role: TUserRole) => {
    return t(`common.roles.${role}`);
  };

  const handleLogout = async () => {
    try {
      await requestJson<{ loggedOut: boolean }>(
        "/api/auth/logout",
        { method: "POST" },
        t("auth.logout.errors.requestFailed"),
      );

      router.replace("/login");
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t("auth.logout.errors.requestFailed");
      toast.error(message);
    }
  };

  return (
    <nav className="flex items-center justify-between rounded-xl border bg-background px-4 py-3 shadow-sm">
      <div className="flex items-center gap-2">
        {links.map((link) => {
          const isActive = activePath === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {link.label}
            </Link>
          );
        })}
      </div>

      <div className="flex items-center gap-3">
        <NotificationBell />
        <div className="text-right text-sm">
          <p className="font-medium">{currentUser.name}</p>
          <p className="text-xs text-muted-foreground">{getRoleLabel(currentUser.role)}</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleLogout}
          title={t("common.actions.logout")}
        >
          <LogOutIcon className="h-4 w-4" />
        </Button>
      </div>
    </nav>
  );
}


