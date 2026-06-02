"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchBook, fetchCategories, fetchFaculties, fetchDepartments, fetchCourses, updateBookWithFile } from "@/lib/api";
import { ArrowRight, Upload } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { ImageSelector } from "@/components/MediaManager";

export default function EditBookPage() {
  const { slug } = useParams();
  const router = useRouter();
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [filteredDepartments, setFilteredDepartments] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [form, setForm] = useState({
    title: "",
    slug: "",
    author: "",
    description: "",
    image: "",
    categoryId: "",
    facultyId: "",
    departmentId: "",
    courseId: "",
  });

  const loadData = useCallback(async () => {
    try {
      const [bookData, cats, facs, depts, crs] = await Promise.all([
        fetchBook(slug),
        fetchCategories(),
        fetchFaculties(),
        fetchDepartments(),
        fetchCourses(),
      ]);
      setForm({
        title: bookData.title,
        slug: bookData.slug,
        author: bookData.author || "",
        description: bookData.description || "",
        image: bookData.image || "",
        categoryId: bookData.categoryId || "",
        facultyId: bookData.department?.facultyId || "",
        departmentId: bookData.departmentId || "",
        courseId: bookData.courseId || "",
      });
      setCategories(cats);
      setFaculties(facs);
      setDepartments(depts);
      setCourses(crs);
      if (bookData.department?.facultyId) {
        setFilteredDepartments(depts.filter((d) => d.facultyId === bookData.department.facultyId));
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleFacultyChange = (facultyId) => {
    setForm({ ...form, facultyId, departmentId: "", courseId: "" });
    setFilteredDepartments(departments.filter((d) => d.facultyId === facultyId));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("slug", form.slug);
      formData.append("author", form.author);
      formData.append("description", form.description);
      formData.append("image", form.image);
      formData.append("categoryId", form.categoryId);
      formData.append("facultyId", form.facultyId);
      formData.append("departmentId", form.departmentId);
      formData.append("courseId", form.courseId);
      if (selectedFile) {
        formData.append("fileUpload", selectedFile);
      }
      await updateBookWithFile(slug, formData);
      toast.success("کتاب بروزرسانی شد");
      router.push("/dashboard/library/manage");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-40 rounded-xl" />
        <Skeleton className="h-[600px] w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" asChild className="flex-row-reverse gap-2">
        <Link href="/dashboard/library/manage">
          <ArrowRight className="size-4" />
          بازگشت به مدیریت کتابخانه
        </Link>
      </Button>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <Card className="rounded-2xl border-border/60">
          <CardHeader>
            <CardTitle>ویرایش کتاب</CardTitle>
          </CardHeader>
          <CardContent>
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
                    className="h-11 rounded-xl"
                    dir="ltr"
                    disabled
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">نویسنده</label>
                  <Input
                    value={form.author}
                    onChange={(e) => setForm({ ...form, author: e.target.value })}
                    className="h-11 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">دسته‌بندی</label>
                  <select
                    value={form.categoryId}
                    onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                    className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    required
                  >
                    <option value="">انتخاب دسته‌بندی...</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
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
                  label="تصویر کتاب"
                  value={form.image}
                  onChange={(url) => setForm({ ...form, image: url })}
                  folder="/filamoon_uploads/books"
                  className="col-span-2 sm:col-span-1"
                />
                <div className="space-y-2">
                  <label className="text-sm font-medium">فایل کتاب</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={(e) => setSelectedFile(e.target.files[0] || null)}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full rounded-xl"
                  >
                    <Upload className="size-4 ml-2" />
                    {selectedFile ? selectedFile.name : "انتخاب فایل کتاب"}
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">دانشکده</label>
                  <select
                    value={form.facultyId}
                    onChange={(e) => handleFacultyChange(e.target.value)}
                    className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="">انتخاب دانشکده...</option>
                    {faculties.map((f) => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">گروه</label>
                  <select
                    value={form.departmentId}
                    onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
                    className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="">انتخاب گروه...</option>
                    {filteredDepartments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">درس</label>
                  <select
                    value={form.courseId}
                    onChange={(e) => setForm({ ...form, courseId: e.target.value })}
                    className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="">انتخاب درس...</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={submitting} className="rounded-xl">
                  {submitting ? "در حال ذخیره..." : "بروزرسانی"}
                </Button>
                <Button variant="outline" type="button" asChild className="rounded-xl">
                  <Link href="/dashboard/library/manage">انصراف</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
