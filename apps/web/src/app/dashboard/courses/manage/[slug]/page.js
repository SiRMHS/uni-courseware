"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fetchCourse, fetchFaculties, fetchDepartments, updateCourse, fetchFtpFolders } from "@/lib/api";
import { ArrowRight, FolderOpen, HardDrive, File, Check, ExternalLink, Info } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { ImageSelector } from "@/components/MediaManager";

export default function EditCoursePage() {
  const { slug } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [faculties, setFaculties] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [filteredDepartments, setFilteredDepartments] = useState([]);
  const [selectedFacultyId, setSelectedFacultyId] = useState("");
  const [ftpFolders, setFtpFolders] = useState([]);
  const [currentFtpPath, setCurrentFtpPath] = useState("");
  const [selectedFtpPath, setSelectedFtpPath] = useState("");
  const [ftpLoading, setFtpLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    slug: "",
    description: "",
    thumbnail: "",
    professorName: "",
    departmentId: "",
    ftpPath: "",
  });

  const loadFtpFolders = useCallback(async (path) => {
    setFtpLoading(true);
    try {
      const entries = await fetchFtpFolders(path);
      setFtpFolders(entries.filter((e) => e.isDirectory));
      setCurrentFtpPath(path);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setFtpLoading(false);
    }
  }, []);

  const loadData = useCallback(async () => {
    try {
      const [courseData, facs, depts] = await Promise.all([
        fetchCourse(slug),
        fetchFaculties(),
        fetchDepartments(),
      ]);
      setForm({
        title: courseData.title,
        slug: courseData.slug,
        description: courseData.description || "",
        thumbnail: courseData.thumbnail || "",
        professorName: courseData.professorName || "",
        departmentId: courseData.departmentId || "",
        ftpPath: courseData.ftpPath || "",
      });
      setSelectedFtpPath(courseData.ftpPath || "");
      setFaculties(facs);
      setDepartments(depts);
      if (courseData.department?.facultyId) {
        setSelectedFacultyId(courseData.department.facultyId);
        setFilteredDepartments(depts.filter((d) => d.facultyId === courseData.department.facultyId));
      }
      loadFtpFolders("/");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [slug, loadFtpFolders]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleFacultyChange = (facultyId) => {
    setSelectedFacultyId(facultyId);
    setFilteredDepartments(departments.filter((d) => d.facultyId === facultyId));
    setForm({ ...form, departmentId: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await updateCourse(slug, { ...form, ftpPath: selectedFtpPath });
      toast.success("درس بروزرسانی شد");
      router.push("/dashboard/courses/manage");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const navigateFtpFolder = (path) => {
    loadFtpFolders(path);
  };

  const goUpFtp = () => {
    const parent = currentFtpPath.split("/").filter(Boolean).slice(0, -1).join("/");
    loadFtpFolders(parent ? "/" + parent : "/");
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-40 rounded-xl" />
        <Skeleton className="h-[500px] w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" asChild className="flex-row-reverse gap-2">
        <Link href="/dashboard/courses/manage">
          <ArrowRight className="size-4" />
          بازگشت به مدیریت درس‌افزار
        </Link>
      </Button>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <Card className="rounded-2xl border-border/60">
          <CardHeader>
            <CardTitle>ویرایش درس — {form.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="general" className="w-full">
              <TabsList className="mb-6">
                <TabsTrigger value="general" className="flex items-center gap-2">
                  <Info className="size-4" />
                  اطلاعات عمومی
                </TabsTrigger>
                <TabsTrigger value="ftp" className="flex items-center gap-2">
                  <HardDrive className="size-4" />
                  محتوای FTP
                </TabsTrigger>
              </TabsList>

              <TabsContent value="general">
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
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">دانشکده</label>
                      <select
                        value={selectedFacultyId}
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
                        required
                      >
                        <option value="">انتخاب گروه...</option>
                        {filteredDepartments.map((d) => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <Button type="submit" disabled={submitting} className="rounded-xl">
                      {submitting ? "در حال ذخیره..." : "بروزرسانی"}
                    </Button>
                    <Button variant="outline" type="button" asChild className="rounded-xl">
                      <Link href="/dashboard/courses/manage">انصراف</Link>
                    </Button>
                  </div>
                </form>
              </TabsContent>

              <TabsContent value="ftp" className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-1">انتخاب پوشه محتوای درس از FTP</h3>
                  <p className="text-xs text-muted-foreground mb-4">
                    پوشه‌ای را که محتوای آموزشی این درس در آن قرار دارد انتخاب کنید.
                    فایل‌های درون این پوشه برای دانشجویان قابل مشاهده خواهد بود.
                  </p>
                </div>

                {selectedFtpPath && (
                  <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-600 dark:text-emerald-400">
                    <Check className="size-4 shrink-0" />
                    <span dir="ltr" className="font-mono text-xs">{selectedFtpPath}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-6 mr-auto rounded-lg text-muted-foreground hover:text-destructive"
                      onClick={() => setSelectedFtpPath("")}
                    >
                      ✕
                    </Button>
                  </div>
                )}

                <div className="rounded-xl border border-border/60 bg-muted/30">
                  <div className="flex items-center gap-2 border-b border-border/60 px-4 py-2 text-xs text-muted-foreground">
                    <HardDrive className="size-3.5" />
                    <span dir="ltr" className="font-mono">{currentFtpPath || "/"}</span>
                    {currentFtpPath && currentFtpPath !== "/" && (
                      <Button variant="ghost" size="icon" className="size-6 mr-auto rounded-lg" onClick={goUpFtp}>
                        <ExternalLink className="size-3" />
                      </Button>
                    )}
                  </div>
                  <div className="max-h-64 overflow-y-auto p-2">
                    {ftpLoading ? (
                      <div className="space-y-2 p-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                          <Skeleton key={i} className="h-8 rounded-lg" />
                        ))}
                      </div>
                    ) : ftpFolders.length === 0 ? (
                      <p className="py-8 text-center text-xs text-muted-foreground">
                        پوشه‌ای یافت نشد
                      </p>
                    ) : (
                      <div className="space-y-1">
                        {ftpFolders.map((folder) => {
                          const fullPath = folder.remotePath;
                          const isSelected = selectedFtpPath === fullPath;
                          return (
                            <div
                              key={fullPath}
                              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors cursor-pointer ${
                                isSelected
                                  ? "bg-primary/10 text-primary"
                                  : "hover:bg-accent/60 text-foreground"
                              }`}
                            >
                              <div
                                className="flex items-center gap-2 flex-1 min-w-0"
                                onDoubleClick={() => navigateFtpFolder(fullPath)}
                              >
                                <FolderOpen className="size-4 shrink-0 text-amber-500" />
                                <span className="truncate">{folder.name}</span>
                              </div>
                              <Button
                                variant={isSelected ? "default" : "ghost"}
                                size="icon"
                                className="size-7 shrink-0 rounded-lg"
                                onClick={() => setSelectedFtpPath(fullPath)}
                              >
                                {isSelected ? <Check className="size-3.5" /> : <File className="size-3.5" />}
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    disabled={submitting || !selectedFtpPath}
                    className="rounded-xl"
                    onClick={handleSubmit}
                  >
                    {submitting ? "در حال ذخیره..." : "ذخیره پوشه"}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
