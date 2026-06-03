"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import {
  Activity, Download, Play, Search, ChevronLeft, ChevronRight,
  Users, List, Calendar, BarChart3, Eye, Trash2, Edit, Upload, Shield,
} from "lucide-react";
import { toast } from "sonner";
import { RequirePermission } from "@/components/RequirePermission";

const ACTION_ICONS = {
  download: { icon: Download, color: "text-blue-500" },
  watch: { icon: Eye, color: "text-emerald-500" },
  upload: { icon: Upload, color: "text-amber-500" },
  delete: { icon: Trash2, color: "text-red-500" },
  edit: { icon: Edit, color: "text-purple-500" },
};

const ACTION_LABELS = {
  download: "دانلود",
  watch: "مشاهده",
  upload: "آپلود",
  delete: "حذف",
  edit: "ویرایش",
};

export default function LogsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0 });
  const [stats, setStats] = useState([]);
  const [activeUsers, setActiveUsers] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: "20" });
      if (search) params.set("search", search);
      if (actionFilter) params.set("action", actionFilter);
      const res = await fetch(`/api/proxy/activities/all?${params}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (!res.ok) throw new Error("خطا");
      const data = await res.json();
      setActivities(data.activities);
      setPagination(data.pagination);
      setStats(data.stats);
      setActiveUsers(data.activeUsers);
    } catch {
      toast.error("خطا در بارگذاری لاگ‌ها");
    } finally {
      setLoading(false);
    }
  }, [page, search, actionFilter]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace("/dashboard/login"); return; }
    load();
  }, [authLoading, user, load, router]);

  const totalActions = stats.reduce((sum, s) => sum + s.count, 0);

  return (
    <RequirePermission permissions={["settings.roles"]}>
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">لاگ فعالیت‌ها</h1>
          <p className="mt-1 text-sm text-muted-foreground">نمایش تمام فعالیت‌های کاربران</p>
        </div>
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-xl border-border/60">
          <CardContent className="flex items-center gap-4 py-5">
            <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10">
              <List className="size-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalActions.toLocaleString("fa-IR")}</p>
              <p className="text-xs text-muted-foreground">کل فعالیت‌ها</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-border/60">
          <CardContent className="flex items-center gap-4 py-5">
            <div className="flex size-12 items-center justify-center rounded-xl bg-emerald-500/10">
              <Users className="size-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{activeUsers.toLocaleString("fa-IR")}</p>
              <p className="text-xs text-muted-foreground">کاربران فعال</p>
            </div>
          </CardContent>
        </Card>
        {stats.slice(0, 2).map((s) => {
          const info = ACTION_ICONS[s.action] || { icon: Activity, color: "text-muted-foreground" };
          const Icon = info.icon;
          return (
            <Card key={s.action} className="rounded-xl border-border/60">
              <CardContent className="flex items-center gap-4 py-5">
                <div className={`flex size-12 items-center justify-center rounded-xl bg-muted`}>
                  <Icon className={`size-5 ${info.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{s.count.toLocaleString("fa-IR")}</p>
                  <p className="text-xs text-muted-foreground">{ACTION_LABELS[s.action] || s.action}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="جستجوی کاربر..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="h-10 rounded-xl border-border/70 bg-muted/40 pr-9 shadow-none"
          />
        </div>
        <div className="flex gap-2">
          {["", "download", "watch", "upload", "delete", "edit"].map((a) => (
            <Button
              key={a}
              variant={actionFilter === a ? "default" : "outline"}
              size="sm"
              className="rounded-xl"
              onClick={() => { setActionFilter(a); setPage(1); }}
            >
              {a ? (ACTION_LABELS[a] || a) : "همه"}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
        </div>
      ) : activities.length === 0 ? (
        <Card className="border-border/60">
          <CardContent className="flex flex-col items-center gap-4 py-16">
            <Activity className="size-12 text-muted-foreground/40" />
            <p className="text-muted-foreground">فعالیتی یافت نشد</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {activities.map((a, i) => {
            const info = ACTION_ICONS[a.action] || { icon: Activity, color: "text-muted-foreground" };
            const Icon = info.icon;
            return (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center gap-3 rounded-xl border border-border/40 bg-card/50 px-4 py-3 transition-colors hover:bg-card/80"
              >
                <Avatar className="size-9 shrink-0">
                  {a.user?.avatar ? <AvatarImage src={a.user.avatar} /> : null}
                  <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
                    {a.user?.name?.slice(0, 2) || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">
                    <span className="font-medium">{a.user?.name || "کاربر"}</span>
                    {" "}
                    <span className="text-muted-foreground">{ACTION_LABELS[a.action] || a.action}</span>
                    {a.target && <span className="text-muted-foreground">: {a.target}</span>}
                  </p>
                  <p className="text-[10px] text-muted-foreground/60">
                    {new Date(a.createdAt).toLocaleString("fa-IR")}
                  </p>
                </div>
                <Icon className={`size-4 shrink-0 ${info.color}`} />
                {a.targetUrl && (
                  <Button variant="ghost" size="icon" className="size-8 shrink-0 rounded-xl" asChild>
                    <a href={a.targetUrl} target="_blank" rel="noopener noreferrer">
                      <Eye className="size-3.5" />
                    </a>
                  </Button>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="icon" className="rounded-xl" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            <ChevronRight className="size-4" />
          </Button>
          <span className="mx-2 text-sm text-muted-foreground">
            {page.toLocaleString("fa-IR")} از {pagination.totalPages.toLocaleString("fa-IR")}
          </span>
          <Button variant="outline" size="icon" className="rounded-xl" disabled={page >= pagination.totalPages} onClick={() => setPage(page + 1)}>
            <ChevronLeft className="size-4" />
          </Button>
        </div>
      )}
    </div>
    </RequirePermission>
  );
}
