"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { fetchCourses, fetchDepartments, createCourse, deleteCourse } from "@/lib/api";
import { Plus, Pencil, Trash2, Search, Building2, GraduationCap } from "lucide-react";
import { toast } from "sonner";
import { ImageSelector } from "@/components/MediaManager";
import Link from "next/link";
import { RequirePermission } from "@/components/RequirePermission";

export default function ManageCoursesPage() {
  const [courses, setCourses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    slug: "",
    description: "",
    thumbnail: "",
    professorName: "",
    departmentId: "",
  });

  const loadData = useCallback(async () => {
    try {
      const [coursesData, deptsData] = await Promise.all([
        fetchCourses(),
        fetchDepartments(),
      ]);
      setCourses(coursesData);
      setDepartments(deptsData);
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
    setForm({ title: "", slug: "", description: "", thumbnail: "", professorName: "", departmentId: "" });
    setDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createCourse(form);
      toast.success("درس ایجاد شد");
      setDialogOpen(false);
      loadData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (course) => {
    if (!confirm(`آیا از حذف "${course.title}" اطمینان دارید؟`)) return;
    try {
      await deleteCourse(course.slug);
      toast.success("درس حذف شد");
      loadData();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const filtered = courses.filter(
    (c) =>
      c.title.includes(search) ||
      c.professorName?.includes(search) ||
      c.department?.faculty?.name.includes(search)
  );

  return (
    <RequirePermission permissions={["courses.create", "courses.edit"]}>
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">مدیریت درس‌افزار</h1>
          <p className="mt-1 text-sm text-muted-foreground">ایجاد، ویرایش و حذف دروس</p>
        </div>
        <Button onClick={openCreate} className="flex-row-reverse gap-2 rounded-xl">
          <Plus className="size-4" />
          درس جدید
        </Button>
      </motion.div>

      <div className="relative max-w-sm">
        <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="جستجوی درس..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-10 rounded-xl border-border/70 bg-muted/40 pr-9 shadow-none"
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((course) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-4 rounded-xl border border-border/60 bg-card/50 px-4 py-3 transition-colors hover:bg-card/80"
            >
              <div className="size-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                {course.thumbnail ? (
                  <img src={course.thumbnail} alt="" className="size-full object-cover" />
                ) : (
                  <div className="flex size-full items-center justify-center text-muted-foreground">
                    <GraduationCap className="size-5" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{course.title}</p>
                <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                  <Building2 className="size-3" />
                  {course.department?.faculty?.name} — {course.department?.name}
                </p>
                {course.professorName && (
                  <p className="text-xs text-muted-foreground/70">{course.professorName}</p>
                )}
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="size-8 rounded-xl" asChild>
                  <Link href={`/dashboard/courses/manage/${course.slug}`}>
                    <Pencil className="size-3.5" />
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 rounded-xl text-destructive hover:text-destructive"
                  onClick={() => handleDelete(course)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </motion.div>
          ))}
          {filtered.length === 0 && (
            <p className="py-12 text-center text-muted-foreground">درسی یافت نشد</p>
          )}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>درس جدید</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">عنوان</label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
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
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">توضیحات</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="flex min-h-[80px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <ImageSelector
                label="تصویر درس"
                value={form.thumbnail}
                onChange={(url) => setForm({ ...form, thumbnail: url })}
                folder="/filamoon_uploads/courses"
                className="col-span-2 sm:col-span-1"
              />
              <div className="space-y-2">
                <label className="text-sm font-medium">نام استاد</label>
                <Input
                  value={form.professorName}
                  onChange={(e) => setForm({ ...form, professorName: e.target.value })}
                  className="h-11 rounded-xl"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">گروه</label>
              <select
                value={form.departmentId}
                onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
                className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                required
              >
                <option value="">انتخاب گروه...</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.faculty?.name} — {d.name}
                  </option>
                ))}
              </select>
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setDialogOpen(false)}>انصراف</Button>
              <Button type="submit">ایجاد</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
    </RequirePermission>
  );
}
