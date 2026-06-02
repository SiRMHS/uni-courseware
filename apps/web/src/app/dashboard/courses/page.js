"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CourseCard } from "@/components/CourseCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { fetchCourses, fetchFaculties } from "@/lib/api";

export default function CoursesPage() {
  const [courses, setCourses] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [facultyFilter, setFacultyFilter] = useState("all");

  const loadData = useCallback(async () => {
    try {
      const [coursesData, facultiesData] = await Promise.all([
        fetchCourses(),
        fetchFaculties(),
      ]);
      setCourses(coursesData);
      setFaculties(facultiesData);
    } catch {
      // error handled by api
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = courses.filter((course) => {
    const matchesSearch =
      !search ||
      course.title.includes(search) ||
      course.description?.includes(search) ||
      course.professorName?.includes(search);

    const matchesFaculty =
      facultyFilter === "all" ||
      course.department?.faculty?.slug === facultyFilter;

    return matchesSearch && matchesFaculty;
  });

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">درس‌افزار</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              مرور و دسترسی به تمام دروس دانشگاهی
            </p>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="جستجوی درس، استاد یا توضیحات..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 rounded-xl border-border/70 bg-muted/40 pr-9 shadow-none focus-visible:ring-1"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex-row-reverse gap-2 rounded-xl">
                <Filter className="size-4" />
                {facultyFilter === "all" ? "همه دانشکده‌ها" : faculties.find((f) => f.slug === facultyFilter)?.name}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuRadioGroup value={facultyFilter} onValueChange={setFacultyFilter}>
                <DropdownMenuRadioItem value="all">همه دانشکده‌ها</DropdownMenuRadioItem>
                {faculties.map((f) => (
                  <DropdownMenuRadioItem key={f.slug} value={f.slug}>
                    {f.name}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </motion.div>

      {loading ? (
        <div className="grid gap-5 grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-video w-full rounded-2xl" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center text-muted-foreground">
          <p className="text-lg font-medium">درسی یافت نشد</p>
          <p className="mt-1 text-sm">جستجوی خود را تغییر دهید یا فیلتر را بردارید</p>
        </div>
      ) : (
        <div className="grid gap-5 grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((course, i) => (
            <CourseCard key={course.id} course={course} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
