import Link from "next/link";
import type { IUser } from "@/shared/user/types";
import { cn } from "@/lib/utils";

interface MainNavbarProps {
  currentUser: IUser;
  activePath: "/" | "/admin/users";
}

export function MainNavbar({ currentUser, activePath }: MainNavbarProps) {
  const links = [
    { href: "/" as const, label: "Calendario" },
    ...(currentUser.role === "admin"
      ? ([{ href: "/admin/users" as const, label: "Utilizadores" }] as const)
      : []),
  ];

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

      <div className="text-right text-sm">
        <p className="font-medium">{currentUser.name}</p>
        <p className="text-xs text-muted-foreground">Role: {currentUser.role}</p>
      </div>
    </nav>
  );
}


