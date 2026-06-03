"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Search, BookOpen, User as UserIcon, Building2 } from "lucide-react";
import { fetchBooks } from "@/lib/api";
import Link from "next/link";

export default function LibraryPage() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadBooks = useCallback(async () => {
    try {
      const data = await fetchBooks();
      setBooks(data);
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBooks();
  }, [loadBooks]);

  const filtered = books.filter((b) =>
    !search ||
    b.title.includes(search) ||
    b.author?.includes(search) ||
    b.category?.name?.includes(search)
  );

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">کتابخانه</h1>
            <p className="mt-1 text-sm text-muted-foreground">مرور و دسترسی به کتاب‌های دانشگاهی</p>
          </div>
        </div>
        <div className="mt-4 relative max-w-sm">
          <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="جستجوی کتاب..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 rounded-xl border-border/70 bg-muted/40 pr-9 shadow-none"
          />
        </div>
      </motion.div>

      {loading ? (
        <div className="grid gap-5 grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-[3/4] w-full rounded-2xl" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-full" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center text-muted-foreground">
          <BookOpen className="size-12 mb-4" />
          <p className="text-lg font-medium">کتابی یافت نشد</p>
          <p className="mt-1 text-sm">جستجوی خود را تغییر دهید</p>
        </div>
      ) : (
        <div className="grid gap-5 grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {filtered.map((book) => (
            <Link key={book.id} href={`/dashboard/library/${book.slug}`}>
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="group rounded-2xl border border-border/60 bg-card/50 transition-colors hover:bg-card/80 overflow-hidden"
              >
                <div className="aspect-[3/4] overflow-hidden bg-muted">
                  {book.image ? (
                    <img src={book.image} alt={book.title} className="size-full object-cover transition-transform group-hover:scale-105" />
                  ) : (
                    <div className="flex size-full items-center justify-center text-muted-foreground">
                      <BookOpen className="size-12" />
                    </div>
                  )}
                </div>
                <div className="p-4 space-y-2">
                  <h3 className="truncate text-sm font-medium">{book.title}</h3>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <UserIcon className="size-3" />
                    <span className="truncate">{book.author || "ناشناس"}</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {book.category && (
                      <span className="rounded-xl bg-primary/10 px-2 py-0.5 text-[11px] text-primary">{book.category.name}</span>
                    )}
                    {book.department?.faculty?.name && (
                      <span className="flex items-center gap-1 rounded-xl bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                        <Building2 className="size-2.5" />
                        {book.department.faculty.name}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
