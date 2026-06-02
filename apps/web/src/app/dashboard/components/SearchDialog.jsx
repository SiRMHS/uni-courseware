"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { fetchCourses, fetchBooks } from "@/lib/api";
import { Search, GraduationCap, BookOpen, Loader2, X } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function SearchDialog({ open, onClose }) {
  const [query, setQuery] = useState("");
  const [courses, setCourses] = useState([]);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
    if (!open) {
      setQuery("");
      setCourses([]);
      setBooks([]);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  const search = useCallback(async (q) => {
    if (!q.trim()) { setCourses([]); setBooks([]); return; }
    setLoading(true);
    try {
      const [allCourses, allBooks] = await Promise.all([
        fetchCourses().catch(() => []),
        fetchBooks().catch(() => []),
      ]);
      const lower = q.toLowerCase();
      setCourses(
        Array.isArray(allCourses)
          ? allCourses.filter((c) => c.title?.toLowerCase().includes(lower))
          : []
      );
      setBooks(
        Array.isArray(allBooks)
          ? allBooks.filter((b) => b.title?.toLowerCase().includes(lower))
          : []
      );
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => search(query), 300);
    return () => clearTimeout(timer);
  }, [query, search]);

  const navigate = (path) => {
    onClose();
    router.push(path);
  };

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-xl" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg rounded-2xl border border-border/60 bg-background p-4 shadow-2xl" onMouseDown={(e) => e.stopPropagation()}>
        <div className="relative">
          <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="جستجوی درس‌ها و کتاب‌ها..."
            className="h-11 rounded-xl pr-10"
          />
          <button
            type="button"
            onClick={onClose}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {!loading && query.trim() && courses.length === 0 && books.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">نتیجه‌ای یافت نشد</p>
        )}

        {!loading && courses.length > 0 && (
          <div className="mt-4">
            <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold text-muted-foreground">
              <GraduationCap className="size-3.5" />
              درس‌ها
            </h3>
            <div className="space-y-1">
              {courses.slice(0, 5).map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => navigate(`/dashboard/courses/${c.slug}`)}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-right text-sm transition-colors hover:bg-accent"
                >
                  <GraduationCap className="size-4 shrink-0 text-primary" />
                  <span className="truncate">{c.title}</span>
                  {c.professorName && (
                    <span className="shrink-0 text-xs text-muted-foreground">{c.professorName}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {!loading && books.length > 0 && (
          <div className="mt-4">
            <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold text-muted-foreground">
              <BookOpen className="size-3.5" />
              کتاب‌ها
            </h3>
            <div className="space-y-1">
              {books.slice(0, 5).map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => navigate(`/dashboard/library/${b.slug}`)}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-right text-sm transition-colors hover:bg-accent"
                >
                  <BookOpen className="size-4 shrink-0 text-amber-500" />
                  <span className="truncate">{b.title}</span>
                  {b.author && (
                    <span className="shrink-0 text-xs text-muted-foreground">{b.author}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
