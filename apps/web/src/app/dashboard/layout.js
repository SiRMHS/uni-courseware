"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { ThemeProvider } from "@/lib/theme-context";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import BottomNav from "./components/BottomNav";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLayout({
  children,
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("sidebarCollapsed");
    if (stored === "true") setSidebarCollapsed(true);
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("sidebarCollapsed", next);
      return next;
    });
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-8">
        <div className="w-full max-w-md space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-32 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex h-screen overflow-x-hidden bg-background text-foreground" dir="rtl">
      <Sidebar collapsed={sidebarCollapsed} onToggleCollapse={toggleSidebar} />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <ThemeProvider>
          <Header />
          <main className="min-w-0 flex-1 overflow-y-auto p-4 pb-20 sm:p-6 lg:p-8 lg:pb-0">{children}</main>
        </ThemeProvider>
      </div>
      <BottomNav />
    </div>
  );
}
