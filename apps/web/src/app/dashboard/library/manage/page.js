"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchBooks, deleteBook } from "@/lib/api";
import { Plus, Pencil, Trash2, Search, BookOpen, User as UserIcon, BookMarked, Tags } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function ManageLibraryPage() {
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

  const handleDelete = async (book) => {
    if (!confirm(`آیا از حذف "${book.title}" اطمینان دارید؟`)) return;
    try {
      await deleteBook(book.slug);
      toast.success("کتاب حذف شد");
      loadBooks();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const filtered = books.filter(
    (b) =>
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
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">مدیریت کتابخانه</h1>
          <p className="mt-1 text-sm text-muted-foreground">ایجاد، ویرایش و حذف کتاب‌ها</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" className="flex-row-reverse gap-2 rounded-xl">
            <Link href="/dashboard/categories">
              <Tags className="size-4" />
              دسته‌بندی‌ها
            </Link>
          </Button>
          <Button asChild className="flex-row-reverse gap-2 rounded-xl">
            <Link href="/dashboard/library/manage/create">
              <Plus className="size-4" />
              کتاب جدید
            </Link>
          </Button>
        </div>
      </motion.div>

      <div className="relative max-w-sm">
        <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="جستجوی کتاب..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-10 rounded-xl border-border/70 bg-muted/40 pr-9 shadow-none"
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((book) => (
            <motion.div
              key={book.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-4 rounded-xl border border-border/60 bg-card/50 px-4 py-3 transition-colors hover:bg-card/80"
            >
              <div className="size-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                {book.image ? (
                  <img src={book.image} alt="" className="size-full object-cover" />
                ) : (
                  <div className="flex size-full items-center justify-center text-muted-foreground">
                    <BookOpen className="size-5" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{book.title}</p>
                <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                  <UserIcon className="size-3" />
                  {book.author || "ناشناس"}
                </p>
                {book.category && (
                  <span className="mt-0.5 inline-block rounded-xl bg-primary/10 px-2 py-0.5 text-[11px] text-primary">
                    {book.category.name}
                  </span>
                )}
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="size-8 rounded-xl" asChild>
                  <Link href={`/dashboard/library/manage/${book.slug}`}>
                    <Pencil className="size-3.5" />
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 rounded-xl text-destructive hover:text-destructive"
                  onClick={() => handleDelete(book)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </motion.div>
          ))}
          {filtered.length === 0 && (
            <p className="py-12 text-center text-muted-foreground">کتابی یافت نشد</p>
          )}
        </div>
      )}
    </div>
  );
}
