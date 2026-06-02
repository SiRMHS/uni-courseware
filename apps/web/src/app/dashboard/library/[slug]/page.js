"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { fetchBook } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, BookOpen, User as UserIcon, Building2, Download, FolderOpen } from "lucide-react";
import Link from "next/link";

export default function BookDetailPage() {
  const { slug } = useParams();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadBook = useCallback(async () => {
    try {
      const data = await fetchBook(slug);
      setBook(data);
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    loadBook();
  }, [loadBook]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-40 rounded-xl" />
        <div className="flex gap-8">
          <Skeleton className="w-72 aspect-[3/4] rounded-2xl" />
          <div className="flex-1 space-y-4">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center text-muted-foreground">
        <p className="text-lg font-medium">کتاب یافت نشد</p>
        <Button variant="link" asChild className="mt-2">
          <Link href="/dashboard/library">بازگشت به کتابخانه</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" asChild className="flex-row-reverse gap-2">
        <Link href="/dashboard/library">
          <ArrowRight className="size-4" />
          بازگشت به کتابخانه
        </Link>
      </Button>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col gap-8 lg:flex-row"
      >
        <div className="w-full max-w-xs shrink-0">
          <div className="aspect-[3/4] overflow-hidden rounded-2xl bg-muted">
            {book.image ? (
              <img src={book.image} alt={book.title} className="size-full object-cover" />
            ) : (
              <div className="flex size-full items-center justify-center text-muted-foreground">
                <BookOpen className="size-20" />
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 space-y-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{book.title}</h1>
            <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <UserIcon className="size-4" />
              <span>{book.author || "ناشناس"}</span>
            </div>
          </div>

          {book.description && (
            <p className="text-sm leading-relaxed text-muted-foreground">{book.description}</p>
          )}

          <div className="flex flex-wrap gap-3">
            {book.category && (
              <span className="rounded-xl bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
                {book.category.name}
              </span>
            )}
            {book.department?.faculty?.name && (
              <span className="flex items-center gap-1.5 rounded-xl bg-muted px-3 py-1.5 text-xs text-muted-foreground">
                <Building2 className="size-3.5" />
                {book.department.faculty.name}
              </span>
            )}
            {book.department?.name && (
              <span className="flex items-center gap-1.5 rounded-xl bg-muted px-3 py-1.5 text-xs text-muted-foreground">
                <FolderOpen className="size-3.5" />
                {book.department.name}
              </span>
            )}
            {book.course && (
              <span className="flex items-center gap-1.5 rounded-xl bg-muted px-3 py-1.5 text-xs text-muted-foreground">
                <BookOpen className="size-3.5" />
                {book.course.title}
              </span>
            )}
          </div>

          {book.fileUrl && (
            <a
              href={book.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Download className="size-4" />
              دانلود کتاب
            </a>
          )}
        </div>
      </motion.div>
    </div>
  );
}
