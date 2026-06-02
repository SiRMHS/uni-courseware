"use client";

import { useEffect, useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { fetchNotifications } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import { themes } from "@/lib/themes";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";
import SearchDialog from "./SearchDialog";
import Link from "next/link";
import { Bell, LogOut, Menu, Search, User } from "lucide-react";

function getInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2);
}

const pageTitles = {
  "/dashboard": "داشبورد",
  "/dashboard/courses": "درس‌افزار",
  "/dashboard/courses/manage": "مدیریت درس‌افزار",
  "/dashboard/library": "کتابخانه",
  "/dashboard/library/manage": "مدیریت کتابخانه",
  "/dashboard/users": "مدیریت کاربران",
  "/dashboard/faculties": "دانشکده‌ها",
  "/dashboard/departments": "گروه‌ها",
  "/dashboard/categories": "دسته‌بندی‌ها",
};

export function Header() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef(null);

  useEffect(() => {
    fetchNotifications()
      .then(setNotifications)
      .catch(() => {});
  }, []);

  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (!notifOpen) return;
    function handleClick(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [notifOpen]);

  const pageTitle = Object.entries(pageTitles).find(([path]) =>
    pathname.startsWith(path)
  )?.[1] ?? "داشبورد";

  const roleLabel = {
    SUPER_ADMIN: "مدیر ارشد",
    ADMIN: "مدیر",
    PROFESSOR: "استاد",
    STUDENT: "دانشجو",
  };

  return (
    <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="min-w-0 md:hidden flex items-center gap-2">
            <button
              type="button"
              className="flex items-center justify-center rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-accent/50"
              onClick={() => window.dispatchEvent(new CustomEvent("toggle-sidebar"))}
            >
              <Menu className="size-5" />
            </button>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold leading-none">{pageTitle}</p>
              <p className="mt-1 text-xs text-muted-foreground">فایــلامــون</p>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button variant="outline" size="icon" className="rounded-xl" onClick={() => setSearchOpen(true)}>
            <Search className="h-4 w-4" />
          </Button>
          <ThemeToggle />
          <div className="relative" ref={notifRef}>
            <Button variant="outline" size="icon" className="relative rounded-xl" onClick={() => setNotifOpen((o) => !o)}>
              <Bell className="h-4 w-4" />
              {notifications.length > 0 && (
                <span className="absolute -left-1.5 -top-1.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                  {notifications.length}
                </span>
              )}
            </Button>
            {notifOpen && (
              <div className="absolute left-0 top-full z-50 mt-2 w-80 rounded-xl border border-border/60 bg-card shadow-lg backdrop-blur-xl">
                <div className="border-b border-border/40 p-3">
                  <p className="text-sm font-semibold">اعلان‌ها</p>
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">اعلانی وجود ندارد</p>
                  ) : (
                    notifications.map((n) => (
                      <a
                        key={n.id}
                        href={n.link || "#"}
                        target={n.link ? "_blank" : undefined}
                        rel={n.link ? "noopener noreferrer" : undefined}
                        className="block border-b border-border/20 px-3 py-2.5 transition-colors hover:bg-muted/50 last:border-b-0"
                      >
                        <p className="text-sm font-medium">{n.title}</p>
                        {n.body && (
                          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{n.body}</p>
                        )}
                        <p className="mt-1 text-[10px] text-muted-foreground/60">
                          {new Date(n.createdAt).toLocaleDateString("fa-IR")}
                        </p>
                      </a>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <DropdownMenu dir="rtl">
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-10 flex-row-reverse gap-2 rounded-xl px-2">
                  <Avatar className="size-9">
                    {user?.avatar && <AvatarImage src={user.avatar} />}
                  <AvatarFallback className="bg-linear-to-br from-primary to-primary/60 text-primary-foreground">
                    {getInitials(user?.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="text-right flex-col">
                  <p className="text-sm font-medium leading-tight">{user?.name}</p>
                  <p className="text-[10px] text-muted-foreground">{roleLabel[user?.role]}</p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <p className="truncate">{user?.name}</p>
                <p className="truncate text-xs font-normal text-muted-foreground" dir="ltr">{user?.email || user?.username || ""}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="flex-row-reverse justify-end gap-2 text-right" asChild>
                <Link href="/dashboard/profile">
                  <User className="h-4 w-4" />
                  پروفایل
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs text-muted-foreground">تم</DropdownMenuLabel>
              {Object.entries(themes).map(([key, t]) => (
                <DropdownMenuItem key={key} onClick={() => setTheme(key)} className="flex items-center gap-2">
                  <div className={`size-3 rounded-full border ${key === theme ? "ring-2 ring-ring ring-offset-1" : ""}`} style={{ backgroundColor: `rgb(${t.vars["--primary"]})` }} />
                  {t.name}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="flex-row-reverse justify-end gap-2 text-right text-destructive"
                onClick={logout}
              >
                <LogOut className="h-4 w-4" />
                خروج
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  );
}
