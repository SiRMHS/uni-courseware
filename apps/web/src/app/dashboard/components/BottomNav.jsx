"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Home, GraduationCap, Library, MessageSquare, User } from "lucide-react";

export default function BottomNav() {
  const pathname = usePathname();

  const isActive = (path) => pathname.startsWith(path);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 block border-t border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 lg:hidden">
      <div className="flex items-center justify-around py-2">
        <Link
          href="/dashboard"
          className={`flex flex-col items-center gap-0.5 px-3 py-1 text-[10px] transition-colors ${
            isActive("/dashboard") && !isActive("/dashboard/courses") && !isActive("/dashboard/library")
              ? "text-primary"
              : "text-muted-foreground"
          }`}
        >
          <Home className="size-5" />
          خانه
        </Link>
        <Link
          href="/dashboard/courses"
          className={`flex flex-col items-center gap-0.5 px-3 py-1 text-[10px] transition-colors ${
            isActive("/dashboard/courses") ? "text-primary" : "text-muted-foreground"
          }`}
        >
          <GraduationCap className="size-5" />
          درس‌افزار
        </Link>
        <Link
          href="/dashboard/tickets"
          className={`flex flex-col items-center gap-0.5 px-3 py-1 text-[10px] transition-colors ${
            isActive("/dashboard/tickets") ? "text-primary" : "text-muted-foreground"
          }`}
        >
          <MessageSquare className="size-5" />
          تیکت‌ها
        </Link>
        <Link
          href="/dashboard/library"
          className={`flex flex-col items-center gap-0.5 px-3 py-1 text-[10px] transition-colors ${
            isActive("/dashboard/library") ? "text-primary" : "text-muted-foreground"
          }`}
        >
          <Library className="size-5" />
          کتابخانه
        </Link>
        <Link
          href="/dashboard/profile"
          className={`flex flex-col items-center gap-0.5 px-3 py-1 text-[10px] transition-colors ${
            isActive("/dashboard/profile") ? "text-primary" : "text-muted-foreground"
          }`}
        >
          <User className="size-5" />
          حسابم
        </Link>
      </div>
    </nav>
  );
}
