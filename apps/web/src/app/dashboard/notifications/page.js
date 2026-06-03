"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth-context";
import { fetchNotifications, createNotification, deleteNotification } from "@/lib/api";
import { Bell, Plus, Trash2, Link as LinkIcon, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { RequirePermission } from "@/components/RequirePermission";

export default function NotificationsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: "", body: "", link: "" });
  const [submitting, setSubmitting] = useState(false);

  const loadNotifications = useCallback(async () => {
    try {
      const data = await fetchNotifications();
      setNotifications(data);
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/dashboard/login");
      return;
    }
    loadNotifications();
  }, [authLoading, user, router, loadNotifications]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSubmitting(true);
    try {
      await createNotification(form);
      toast.success("اعلان ایجاد شد");
      setForm({ title: "", body: "", link: "" });
      loadNotifications();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("آیا از حذف این اعلان اطمینان دارید؟")) return;
    try {
      await deleteNotification(id);
      toast.success("اعلان حذف شد");
      loadNotifications();
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">مدیریت اعلان‌ها</h1>
            <p className="mt-1 text-sm text-muted-foreground">در حال بارگذاری...</p>
          </div>
        </div>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <RequirePermission permissions={["notifications.create", "notifications.delete", "notifications.view"]}>
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">مدیریت اعلان‌ها</h1>
          <p className="mt-1 text-sm text-muted-foreground">ایجاد و حذف اعلان‌های سراسری</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
      >
        <Card className="rounded-xl border-border/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Plus className="size-5" />
              اعلان جدید
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">عنوان *</label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="h-11 rounded-xl"
                  placeholder="عنوان اعلان"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">متن</label>
                <Input
                  value={form.body}
                  onChange={(e) => setForm({ ...form, body: e.target.value })}
                  className="h-11 rounded-xl"
                  placeholder="متن اعلان (اختیاری)"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">لینک</label>
                <Input
                  value={form.link}
                  onChange={(e) => setForm({ ...form, link: e.target.value })}
                  className="h-11 rounded-xl"
                  placeholder="https://example.com (اختیاری)"
                  dir="ltr"
                />
              </div>
              <Button type="submit" className="flex-row-reverse gap-2 rounded-xl" disabled={submitting}>
                <Plus className="size-4" />
                {submitting ? "در حال ایجاد..." : "ایجاد اعلان"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>

      <div className="space-y-2">
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 rounded-xl border border-border/60 bg-card/50 px-4 py-3 transition-colors hover:bg-card/80"
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <Bell className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{notification.title}</p>
              {notification.body && (
                <p className="truncate text-xs text-muted-foreground">{notification.body}</p>
              )}
              <p className="text-xs text-muted-foreground/60">
                {new Date(notification.createdAt).toLocaleDateString("fa-IR")}
              </p>
            </div>
            {notification.link && (
              <Button variant="ghost" size="icon" className="size-8 shrink-0 rounded-xl" asChild>
                <a href={notification.link} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="size-3.5" />
                </a>
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="size-8 shrink-0 rounded-xl text-destructive hover:text-destructive"
              onClick={() => handleDelete(notification.id)}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </motion.div>
        ))}
        {notifications.length === 0 && (
          <p className="py-12 text-center text-muted-foreground">هیچ اعلانی یافت نشد</p>
        )}
      </div>
    </div>
    </RequirePermission>
  );
}
