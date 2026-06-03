"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { fetchFaculties, createFaculty, updateFaculty, deleteFaculty } from "@/lib/api";
import { Plus, Pencil, Trash2, Building2, Layers } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { RequirePermission } from "@/components/RequirePermission";

export default function FacultiesPage() {
  const [faculties, setFaculties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState(null);
  const [form, setForm] = useState({ name: "", slug: "" });

  const loadFaculties = useCallback(async () => {
    try {
      const data = await fetchFaculties();
      setFaculties(data);
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFaculties();
  }, [loadFaculties]);

  const openCreate = () => {
    setEditingFaculty(null);
    setForm({ name: "", slug: "" });
    setDialogOpen(true);
  };

  const openEdit = (faculty) => {
    setEditingFaculty(faculty);
    setForm({ name: faculty.name, slug: faculty.slug });
    setDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingFaculty) {
        await updateFaculty(editingFaculty.slug, form);
        toast.success("دانشکده بروزرسانی شد");
      } else {
        await createFaculty(form);
        toast.success("دانشکده ایجاد شد");
      }
      setDialogOpen(false);
      loadFaculties();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (faculty) => {
    if (!confirm(`آیا از حذف "${faculty.name}" اطمینان دارید؟`)) return;
    try {
      await deleteFaculty(faculty.slug);
      toast.success("دانشکده حذف شد");
      loadFaculties();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <RequirePermission permissions={["faculties.create", "faculties.edit"]}>
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">مدیریت دانشکده‌ها</h1>
          <p className="mt-1 text-sm text-muted-foreground">ایجاد، ویرایش و حذف دانشکده‌ها</p>
        </div>
        <Button onClick={openCreate} className="flex-row-reverse gap-2 rounded-xl">
          <Plus className="size-4" />
          دانشکده جدید
        </Button>
      </motion.div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {faculties.map((faculty) => (
            <motion.div
              key={faculty.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-4 rounded-xl border border-border/60 bg-card/50 px-4 py-3 transition-colors hover:bg-card/80"
            >
              <div className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <Building2 className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{faculty.name}</p>
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Layers className="size-3" />
                  {faculty._count?.departments ?? 0} گروه
                </p>
              </div>
              <Button variant="ghost" asChild className="flex-row-reverse gap-2 rounded-xl text-xs">
                <Link href={`/dashboard/departments?facultyId=${faculty.id}`}>
                  <Layers className="size-3.5" />
                  مدیریت گروه‌ها
                </Link>
              </Button>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="size-8 rounded-xl" onClick={() => openEdit(faculty)}>
                  <Pencil className="size-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 rounded-xl text-destructive hover:text-destructive"
                  onClick={() => handleDelete(faculty)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </motion.div>
          ))}
          {faculties.length === 0 && (
            <p className="py-12 text-center text-muted-foreground">دانشکده‌ای یافت نشد</p>
          )}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingFaculty ? "ویرایش دانشکده" : "دانشکده جدید"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">نام</label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="h-11 rounded-xl"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">اسلاگ</label>
              <Input
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                className="h-11 rounded-xl"
                dir="ltr"
                required
                disabled={!!editingFaculty}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setDialogOpen(false)}>انصراف</Button>
              <Button type="submit">{editingFaculty ? "بروزرسانی" : "ایجاد"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
    </RequirePermission>
  );
}
