"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { fetchDepartments, fetchFaculties, createDepartment, updateDepartment, deleteDepartment } from "@/lib/api";
import { Plus, Pencil, Trash2, Building2 } from "lucide-react";
import { toast } from "sonner";

export default function DepartmentsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [departments, setDepartments] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [facultyFilter, setFacultyFilter] = useState(searchParams.get("facultyId") || "");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [form, setForm] = useState({ name: "", slug: "", facultyId: "" });

  const loadData = useCallback(async () => {
    try {
      const [deptsData, facsData] = await Promise.all([
        fetchDepartments(),
        fetchFaculties(),
      ]);
      setDepartments(deptsData);
      setFaculties(facsData);
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openCreate = () => {
    setEditingDepartment(null);
    setForm({ name: "", slug: "", facultyId: facultyFilter || "" });
    setDialogOpen(true);
  };

  const openEdit = (dept) => {
    setEditingDepartment(dept);
    setForm({ name: dept.name, slug: dept.slug, facultyId: dept.facultyId });
    setDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingDepartment) {
        await updateDepartment(editingDepartment.id, form);
        toast.success("گروه بروزرسانی شد");
      } else {
        await createDepartment(form);
        toast.success("گروه ایجاد شد");
      }
      setDialogOpen(false);
      loadData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (dept) => {
    if (!confirm(`آیا از حذف "${dept.name}" اطمینان دارید؟`)) return;
    try {
      await deleteDepartment(dept.id);
      toast.success("گروه حذف شد");
      loadData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleFacultyFilterChange = (facultyId) => {
    setFacultyFilter(facultyId);
    const params = new URLSearchParams(searchParams.toString());
    if (facultyId) {
      params.set("facultyId", facultyId);
    } else {
      params.delete("facultyId");
    }
    router.replace(`/dashboard/departments?${params.toString()}`);
  };

  const filtered = facultyFilter
    ? departments.filter((d) => d.facultyId === facultyFilter)
    : departments;

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">مدیریت گروه‌ها</h1>
          <p className="mt-1 text-sm text-muted-foreground">ایجاد، ویرایش و حذف گروه‌های آموزشی</p>
        </div>
        <Button onClick={openCreate} className="flex-row-reverse gap-2 rounded-xl">
          <Plus className="size-4" />
          گروه جدید
        </Button>
      </motion.div>

      <div className="max-w-sm">
        <select
          value={facultyFilter}
          onChange={(e) => handleFacultyFilterChange(e.target.value)}
          className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">همه دانشکده‌ها</option>
          {faculties.map((f) => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((dept) => (
            <motion.div
              key={dept.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-4 rounded-xl border border-border/60 bg-card/50 px-4 py-3 transition-colors hover:bg-card/80"
            >
              <div className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <Building2 className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{dept.name}</p>
                <p className="text-xs text-muted-foreground">{dept.faculty?.name}</p>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="size-8 rounded-xl" onClick={() => openEdit(dept)}>
                  <Pencil className="size-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 rounded-xl text-destructive hover:text-destructive"
                  onClick={() => handleDelete(dept)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </motion.div>
          ))}
          {filtered.length === 0 && (
            <p className="py-12 text-center text-muted-foreground">گروهی یافت نشد</p>
          )}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingDepartment ? "ویرایش گروه" : "گروه جدید"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
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
                  disabled={!!editingDepartment}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">دانشکده</label>
              <select
                value={form.facultyId}
                onChange={(e) => setForm({ ...form, facultyId: e.target.value })}
                className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                required
              >
                <option value="">انتخاب دانشکده...</option>
                {faculties.map((f) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setDialogOpen(false)}>انصراف</Button>
              <Button type="submit">{editingDepartment ? "بروزرسانی" : "ایجاد"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
