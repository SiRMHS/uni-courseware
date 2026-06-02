"use client";

import { useRef, useState, useEffect } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import {
  Archive,
  BarChart3,
  BookOpen,
  BookMarked,
  Building2,
  ChevronDown,
  ChevronUp,
  FolderOpen,
  GraduationCap,
  HardDrive,
  LayoutDashboard,
  Library,
  LogOut,
  Menu,
  MessageSquare,
  Megaphone,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Send,
  Settings,
  Sun,
  Trash2,
  Users,
  Bell,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

gsap.registerPlugin(useGSAP);

const mainFolders = [
  { title: "داشبورد", href: "/dashboard", icon: LayoutDashboard },
  { title: "درس‌افزار", href: "/dashboard/courses", icon: GraduationCap },
  { title: "کتابخانه", href: "/dashboard/library", icon: Library },
  { title: "تیکت‌ها", href: "/dashboard/tickets", icon: MessageSquare },
  { title: "تیم ما", href: "/dashboard/team", icon: Users },
];

function getInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2);
}

function AccordionSection({ title, icon: Icon, children, defaultOpen = false, collapsed }) {
  const [open, setOpen] = useState(defaultOpen);

  if (collapsed) {
    return (
      <div className="flex justify-center py-1">
        <div className="group relative">
          <Icon className="size-4 shrink-0 text-muted-foreground" />
          <div className="pointer-events-none invisible absolute right-full top-1/2 z-50 mr-2 -translate-y-1/2 whitespace-nowrap rounded-md bg-popover px-2 py-1 text-xs text-popover-foreground opacity-0 transition-all group-hover:visible group-hover:opacity-100">
            {title}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground hover:bg-accent/50 transition-colors"
      >
        {open ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
        <div className="flex items-center gap-2">
          <Icon className="size-3.5" />
          <span>{title}</span>
        </div>
      </button>
      {open && <div className="mr-3 space-y-0.5 border-r border-border/40 pr-2">{children}</div>}
    </div>
  );
}

export function Sidebar({ collapsed = false, onToggleCollapse }) {
  const pathname = usePathname();
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);

  useEffect(() => {
    const handler = () => setMobileSheetOpen((prev) => !prev);
    window.addEventListener("toggle-sidebar", handler);
    return () => window.removeEventListener("toggle-sidebar", handler);
  }, []);

  return (
    <>
      <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
        <SheetTrigger asChild>
          {/* <Button variant="outline" size="icon" className="fixed left-4 top-4 z-50 lg:hidden shadow-lg shadow-black/10">
            <Menu className="h-5 w-5" />
          </Button> */}
        </SheetTrigger>
        <SheetContent side="right" className="w-[88vw] max-w-sm gap-0 p-0">
          <SidebarContent pathname={pathname} mobile />
        </SheetContent>
      </Sheet>

      <aside
        className={cn(
          "hidden shrink-0 border-l border-border/60 bg-card/90 backdrop-blur transition-all duration-300 ease-in-out lg:flex lg:flex-col h-screen",
          collapsed && "border-none bg-transparent backdrop-blur-none",
          collapsed ? "w-16" : "w-80"
        )}
      >
        <SidebarContent pathname={pathname} collapsed={collapsed} onToggleCollapse={onToggleCollapse} />
      </aside>
    </>
  );
}

function SidebarContent({ pathname, mobile = false, collapsed = false, onToggleCollapse }) {
  const rootRef = useRef(null);
  const { user, logout } = useAuth();
  const canManage = user?.role === "SUPER_ADMIN" || user?.role === "ADMIN" || user?.role === "PROFESSOR";

  useGSAP(
    () => {
      const animatedSections = rootRef.current?.querySelectorAll("[data-sidebar-animate]");
      if (!animatedSections?.length) return;
      gsap.from(animatedSections, {
        opacity: 0,
        x: 24,
        duration: 0.7,
        ease: "power3.out",
        stagger: 0.08,
      });
    },
    { scope: rootRef }
  );

  const roleLabel = {
    SUPER_ADMIN: "مدیر ارشد",
    ADMIN: "مدیر",
    PROFESSOR: "استاد",
    STUDENT: "دانشجو",
  };

  return (
    <div ref={rootRef} className="flex h-full flex-col text-right" data-mobile={mobile} dir="rtl">
      <div
        data-sidebar-animate
        className={cn(
          "flex h-16 items-center gap-2 px-5",
          collapsed ? "justify-center px-2" : "border-b border-border/60"
        )}
      >
        {!mobile && (collapsed ? (
          <div
            className="group relative flex size-10 cursor-pointer items-center justify-center rounded-2xl bg-linear-to-br from-primary via-primary/70 to-primary/40 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:opacity-80 hover:rounded-xl"
            onClick={onToggleCollapse}
          >
            <span className="group-hover:hidden">FU</span>
            <PanelLeftOpen className="hidden size-4 group-hover:block" />
          </div>
        ) : (
          <>
<div className="flex size-10 items-center justify-center rounded-2xl bg-linear-to-br from-primary via-primary/80 to-primary/60 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20">              FU
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold leading-none">فایلامـــون</p>
              <p className="text-xs text-muted-foreground">سامانه حمایت از حقوق دانشجویی</p>
            </div>
            <Button variant="ghost" size="icon" className="size-8 rounded-xl shrink-0" onClick={onToggleCollapse}>
              <PanelLeftClose className="size-4" />
            </Button>
          </>
        ))}
      </div>

      <div className={collapsed ? "h-2" : "h-4"} />

      <ScrollArea className="flex-1">
        <div className={cn("flex min-h-full flex-col gap-4", collapsed ? "p-2" : "p-4 pb-0")}>
          <div data-sidebar-animate className={collapsed ? "space-y-3" : "space-y-2"}>
            {!collapsed && (
              <p className="px-3 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">منوی اصلی</p>
            )}
            <div className={collapsed ? "flex flex-col items-center space-y-2" : "space-y-1"}>
              <Button
                asChild
                variant="ghost"
                className={cn(
                  collapsed
                    ? "h-10 w-10 justify-center rounded-xl p-0"
                    : "h-11 w-full flex-row-reverse justify-start rounded-xl px-4 text-right text-sm"
                )}
              >
                <Link href="/dashboard/tickets/create" className={collapsed ? "group relative" : ""}>
                  <Plus className={cn("shrink-0", collapsed ? "size-5" : "h-4 w-4")} />
                  {!collapsed && "ایجاد تیکت جدید"}
                  {collapsed && (
                    <div className="pointer-events-none invisible absolute right-full top-1/2 z-50 mr-2 -translate-y-1/2 whitespace-nowrap rounded-md bg-popover px-2 py-1 text-xs text-popover-foreground opacity-0 transition-all group-hover:visible group-hover:opacity-100">
                      ایجاد تیکت جدید
                    </div>
                  )}
                </Link>
              </Button>
              {mainFolders.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
                return (
                  <Button
                    key={item.href}
                    asChild
                    variant={isActive ? "secondary" : "ghost"}
                    className={cn(
                      collapsed
                        ? "h-10 w-10 justify-center rounded-xl p-0"
                        : "h-11 w-full flex-row-reverse justify-start rounded-xl px-4 text-right text-sm",
                      isActive && "bg-accent/80 text-accent-foreground"
                    )}
                  >
                    <Link href={item.href} className={collapsed ? "group relative" : ""}>
                      <item.icon className={cn("shrink-0", collapsed ? "size-5" : "h-4 w-4")} />
                      {!collapsed && item.title}
                      {collapsed && (
                        <div className="pointer-events-none invisible absolute right-full top-1/2 z-50 mr-2 -translate-y-1/2 whitespace-nowrap rounded-md bg-popover px-2 py-1 text-xs text-popover-foreground opacity-0 transition-all group-hover:visible group-hover:opacity-100">
                          {item.title}
                        </div>
                      )}
                    </Link>
                  </Button>
                );
              })}
            </div>
          </div>

          {canManage && (
            <>
              {!collapsed && <Separator className="bg-border/60" />}

              <div data-sidebar-animate className={collapsed ? "flex flex-col items-center space-y-3" : "space-y-3"}>
                <AccordionSection title="مدیریت درس‌افزار" icon={GraduationCap} defaultOpen collapsed={collapsed}>
                  <NavItem href="/dashboard/courses/manage" icon={BookOpen} pathname={pathname} collapsed={collapsed}>
                    مدیریت دروس
                  </NavItem>
                  <NavItem href="/dashboard/faculties" icon={Building2} pathname={pathname} collapsed={collapsed}>
                    دانشکده‌ها
                  </NavItem>
                  <NavItem href="/dashboard/departments" icon={FolderOpen} pathname={pathname} collapsed={collapsed}>
                    گروه‌ها
                  </NavItem>
                </AccordionSection>

                <AccordionSection title="مدیریت کتابخانه" icon={Library} collapsed={collapsed}>
                  <NavItem href="/dashboard/library/manage" icon={BookOpen} pathname={pathname} collapsed={collapsed}>
                    مدیریت کتاب‌ها
                  </NavItem>
                  <NavItem href="/dashboard/categories" icon={BookMarked} pathname={pathname} collapsed={collapsed}>
                    دسته‌بندی‌ها
                  </NavItem>
                </AccordionSection>

                <AccordionSection title="مدیریت کاربران" icon={Users} collapsed={collapsed}>
                  <NavItem href="/dashboard/users" icon={Users} pathname={pathname} collapsed={collapsed}>
                    کاربران
                  </NavItem>
                  <NavItem href="/dashboard/announcements" icon={Megaphone} pathname={pathname} collapsed={collapsed}>
                    اعلامیه‌ها
                  </NavItem>
                  <NavItem href="/dashboard/notifications" icon={Bell} pathname={pathname} collapsed={collapsed}>
                    اعلان‌ها
                  </NavItem>
                  <NavItem href="/dashboard/tickets/manage" icon={MessageSquare} pathname={pathname} collapsed={collapsed}>
                    مدیریت تیکت‌ها
                  </NavItem>
                </AccordionSection>

                <AccordionSection title="مدیریت FTP" icon={HardDrive} collapsed={collapsed}>
                  <NavItem href="/dashboard/ftp" icon={FolderOpen} pathname={pathname} collapsed={collapsed}>
                    مرورگر فایل
                  </NavItem>
                  <NavItem href="/dashboard/ftp/settings" icon={Settings} pathname={pathname} collapsed={collapsed}>
                    تنظیمات
                  </NavItem>
                </AccordionSection>
              </div>
            </>
          )}

          <div className={collapsed ? "h-2" : "h-4"} />
        </div>
      </ScrollArea>

      {/* Fixed user section at bottom */}
      <div className={cn("shrink-0 bg-card/90 p-4", collapsed && "border-t-0 bg-transparent p-2")}>
        {collapsed ? (
          <div className="flex flex-col items-center gap-2">
            <Link href="/dashboard/profile">
              <Avatar className="size-10 shrink-0 cursor-pointer transition-opacity hover:opacity-80">
                {user?.avatar && <AvatarImage src={user.avatar} />}
                <AvatarFallback className="bg-linear-to-br from-primary to-primary/60 text-primary-foreground">
                  {getInitials(user?.name)}
                </AvatarFallback>
              </Avatar>
            </Link>
            <Button variant="ghost" size="icon" className="size-8 shrink-0 rounded-xl" onClick={logout}>
              <LogOut className="size-4 text-muted-foreground" />
            </Button>
          </div>
        ) : (
          <Link href="/dashboard/profile" className="block">
            <div className="flex flex-row-reverse items-center gap-3 rounded-2xl border border-border/60 bg-background/60 p-3 text-right transition-colors hover:bg-accent/50">
              <Avatar className="size-10 shrink-0">
                {user?.avatar && <AvatarImage src={user.avatar} />}
                <AvatarFallback className="bg-linear-to-br from-primary to-primary/60 text-primary-foreground">
                  {getInitials(user?.name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{user?.name}</p>
                <p className="truncate text-xs text-muted-foreground" dir="ltr">{user?.email || user?.username || ""}</p>
                <p className="text-[10px] text-muted-foreground/70">{roleLabel[user?.role]}</p>
              </div>
              <Button variant="ghost" size="icon" className="size-8 shrink-0 rounded-xl" onClick={(e) => { e.preventDefault(); e.stopPropagation(); logout(); }}>
                <LogOut className="size-4 text-muted-foreground" />
              </Button>
            </div>
          </Link>
        )}
      </div>
    </div>
  );
}

function NavItem({ href, icon: Icon, children, pathname, collapsed }) {
  const isActive = pathname.startsWith(href);
  return (
    <Button
      asChild
      variant={isActive ? "secondary" : "ghost"}
      className={cn(
        collapsed
          ? "h-9 w-9 justify-center rounded-lg p-0"
          : "h-9 w-full flex-row-reverse justify-start rounded-lg px-3 text-right text-sm",
        isActive && "bg-accent/80 text-accent-foreground"
      )}
    >
      <Link href={href} className={collapsed ? "group relative" : ""}>
        <Icon className={cn("shrink-0", collapsed ? "size-4" : "h-3.5 w-3.5")} />
        {!collapsed && children}
        {collapsed && (
          <div className="pointer-events-none invisible absolute right-full top-1/2 z-50 mr-2 -translate-y-1/2 whitespace-nowrap rounded-md bg-popover px-2 py-1 text-xs text-popover-foreground opacity-0 transition-all group-hover:visible group-hover:opacity-100">
            {children}
          </div>
        )}
      </Link>
    </Button>
  );
}
