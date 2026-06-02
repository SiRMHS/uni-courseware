"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { fetchAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Eye, EyeOff, Megaphone } from "lucide-react";
import { toast } from "sonner";
import TipTapEditor from "@/components/TipTapEditor";

export default function AnnouncementsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: "", body: "", published: false });

  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  useEffect(() => {
    if (user && !isSuperAdmin) router.push("/dashboard");
  }, [user, isSuperAdmin, router]);

  const load = useCallback(async () => {
    try {
      const data = await fetchAnnouncements();
      setAnnouncements(data);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm({ title: "", body: "", published: false });
    setDialogOpen(true);
  };

  const openEdit = (a) => {
    setEditing(a);
    setForm({ title: a.title, body: a.body || "", published: a.published });
    setDialogOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await updateAnnouncement(editing.id, form);
        toast.success("اعلامیه بروزرسانی شد");
      } else {
        await createAnnouncement(form);
        toast.success("اعلامیه ایجاد شد");
      }
      setDialogOpen(false);
      load();
    } catch (err) { toast.error(err.message); }
  };

  const handleDelete = async (a) => {
    if (!confirm(`حذف "${a.title}"؟`)) return;
    try {
      await deleteAnnouncement(a.id);
      toast.success("حذف شد");
      load();
    } catch (err) { toast.error(err.message); }
  };

  const togglePublish = async (a) => {
    try {
      await updateAnnouncement(a.id, { published: !a.published });
      toast.success(a.published ? "مخفی شد" : "منتشر شد");
      load();
    } catch (err) { toast.error(err.message); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">مدیریت اعلامیه‌ها</h1>
          <p className="mt-1 text-sm text-muted-foreground">ایجاد و مدیریت اعلامیه‌های سامانه</p>
        </div>
        <Button onClick={openCreate} className="flex-row-reverse gap-2 rounded-xl">
          <Plus className="size-4" />
          اعلامیه جدید
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : announcements.length === 0 ? (
        <Card className="border-border/60">
          <CardContent className="flex flex-col items-center gap-4 py-16">
            <Megaphone className="size-12 text-muted-foreground/40" />
            <p className="text-muted-foreground">اعلامیه‌ای وجود ندارد</p>
            <Button variant="outline" className="rounded-xl" onClick={openCreate}>ایجاد اعلامیه</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {announcements.map((a, i) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-start gap-4 rounded-xl border border-border/60 bg-card/50 p-4"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{a.title}</p>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${a.published ? "bg-emerald-500/10 text-emerald-600" : "bg-gray-500/10 text-gray-500"}`}>
                    {a.published ? "منتشر شده" : "پیش‌نویس"}
                  </span>
                </div>
                {a.body && <div className="prose prose-sm dark:prose-invert mt-1 line-clamp-2 [&_img]:max-h-32 [&_img]:rounded-lg" dangerouslySetInnerHTML={{ __html: a.body }} />}
                <p className="mt-2 text-[10px] text-muted-foreground/60">
                  {new Date(a.createdAt).toLocaleDateString("fa-IR")}
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button variant="ghost" size="icon" className="size-8 rounded-xl" onClick={() => togglePublish(a)} title={a.published ? "مخفی کردن" : "انتشار"}>
                  {a.published ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                </Button>
                <Button variant="ghost" size="icon" className="size-8 rounded-xl" onClick={() => openEdit(a)}>
                  <Pencil className="size-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="size-8 rounded-xl text-destructive" onClick={() => handleDelete(a)}>
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "ویرایش اعلامیه" : "اعلامیه جدید"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">عنوان</label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="h-11 rounded-xl" required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">متن (اختیاری)</label>
              <TipTapEditor content={form.body} onChange={(val) => setForm({ ...form, body: val })} />
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} className="rounded" />
              منتشر شده
            </label>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setDialogOpen(false)}>انصراف</Button>
              <Button type="submit">{editing ? "بروزرسانی" : "ایجاد"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
