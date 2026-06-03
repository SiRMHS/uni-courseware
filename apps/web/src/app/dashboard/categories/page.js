"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { fetchCategories, createCategory, updateCategory, deleteCategory } from "@/lib/api";
import { Plus, Pencil, Trash2, FolderOpen } from "lucide-react";
import { toast } from "sonner";
import { RequirePermission } from "@/components/RequirePermission";

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [form, setForm] = useState({ name: "", slug: "", parentId: "" });

  const loadCategories = useCallback(async () => {
    try {
      const data = await fetchCategories();
      setCategories(data);
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const openCreate = (parentId) => {
    setEditingCategory(null);
    setForm({ name: "", slug: "", parentId: parentId || "" });
    setDialogOpen(true);
  };

  const openEdit = (category) => {
    setEditingCategory(category);
    setForm({ name: category.name, slug: category.slug, parentId: category.parentId || "" });
    setDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { name: form.name, slug: form.slug };
      if (form.parentId) payload.parentId = form.parentId;
      if (editingCategory) {
        await updateCategory(editingCategory.slug, payload);
        toast.success("دسته‌بندی بروزرسانی شد");
      } else {
        await createCategory(payload);
        toast.success("دسته‌بندی ایجاد شد");
      }
      setDialogOpen(false);
      loadCategories();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (category) => {
    if (!confirm(`آیا از حذف "${category.name}" اطمینان دارید؟`)) return;
    try {
      await deleteCategory(category.slug);
      toast.success("دسته‌بندی حذف شد");
      loadCategories();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <RequirePermission permissions={["categories.create", "categories.edit"]}>
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">مدیریت دسته‌بندی‌ها</h1>
          <p className="mt-1 text-sm text-muted-foreground">ایجاد، ویرایش و حذف دسته‌بندی‌ها</p>
        </div>
        <Button onClick={() => openCreate()} className="flex-row-reverse gap-2 rounded-xl">
          <Plus className="size-4" />
          دسته‌بندی جدید
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
          {categories.map((category) => (
            <div key={category.id}>
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-4 rounded-xl border border-border/60 bg-card/50 px-4 py-3 transition-colors hover:bg-card/80"
              >
                <div className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <FolderOpen className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{category.name}</p>
                  <p className="text-xs text-muted-foreground" dir="ltr">{category.slug}</p>
                </div>
                <Button variant="ghost" size="icon" className="size-7 rounded-lg" onClick={() => openCreate(category.id)} title="افزودن زیردسته">
                  <Plus className="size-3.5" />
                </Button>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="size-8 rounded-xl" onClick={() => openEdit(category)}>
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 rounded-xl text-destructive hover:text-destructive"
                    onClick={() => handleDelete(category)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </motion.div>
              {category.children?.length > 0 && (
                <div className="mr-6 mt-1 space-y-1 border-r border-border/40 pr-4">
                  {category.children.map((child) => (
                    <motion.div
                      key={child.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-4 rounded-xl border border-border/40 bg-card/30 px-4 py-2.5 transition-colors hover:bg-card/60"
                    >
                      <div className="flex size-8 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground">
                        <FolderOpen className="size-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{child.name}</p>
                        <p className="text-xs text-muted-foreground" dir="ltr">{child.slug}</p>
                      </div>
                      <Button variant="ghost" size="icon" className="size-7 rounded-lg" onClick={() => openCreate(child.id)} title="افزودن زیردسته">
                        <Plus className="size-3.5" />
                      </Button>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="size-7 rounded-lg" onClick={() => openEdit(child)}>
                          <Pencil className="size-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 rounded-lg text-destructive hover:text-destructive"
                          onClick={() => handleDelete(child)}
                        >
                          <Trash2 className="size-3" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          ))}
          {categories.length === 0 && (
            <p className="py-12 text-center text-muted-foreground">دسته‌بندی‌ای یافت نشد</p>
          )}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? "ویرایش دسته‌بندی" : "دسته‌بندی جدید"}</DialogTitle>
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
                disabled={!!editingCategory}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">دسته‌بندی والد (اختیاری)</label>
              <select
                value={form.parentId}
                onChange={(e) => setForm({ ...form, parentId: e.target.value })}
                className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                <option value="">بدون والد (دسته اصلی)</option>
                {categories
                  .filter((c) => editingCategory ? c.id !== editingCategory.id : true)
                  .map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
              </select>
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setDialogOpen(false)}>انصراف</Button>
              <Button type="submit">{editingCategory ? "بروزرسانی" : "ایجاد"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
    </RequirePermission>
  );
}
