"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { fetchCourse, fetchEvents, fetchPublishedAnnouncements, createEvent, updateEvent, deleteEvent as deleteEventApi } from "@/lib/api";
import { Calendar, ArrowLeft, Clock, GraduationCap, Plus, X, Play, History, Megaphone } from "lucide-react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import { faIR } from "date-fns-jalali/locale/fa-IR";
import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  differenceInCalendarDays,
  differenceInCalendarMonths,
  eachMonthOfInterval,
  eachYearOfInterval,
  endOfISOWeek,
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  getISOWeek,
  getMonth,
  getWeek,
  getYear,
  isAfter,
  isBefore,
  isDate,
  isSameDay,
  isSameMonth,
  isSameYear,
  max,
  min,
  setMonth,
  setYear,
  startOfDay,
  startOfISOWeek,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from "date-fns-jalali";

const jalaliDateLib = {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  differenceInCalendarDays,
  differenceInCalendarMonths,
  eachMonthOfInterval,
  eachYearOfInterval,
  endOfISOWeek,
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  getISOWeek,
  getMonth,
  getWeek,
  getYear,
  isAfter,
  isBefore,
  isDate,
  isSameDay,
  isSameMonth,
  isSameYear,
  max,
  min,
  setMonth,
  setYear,
  startOfDay,
  startOfISOWeek,
  startOfMonth,
  startOfWeek,
  startOfYear,
};

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [lastWatchedList, setLastWatchedList] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [eventTitle, setEventTitle] = useState("");
  const [editingIndex, setEditingIndex] = useState(null);
  const [editTitle, setEditTitle] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    fetchEvents().then(setEvents).catch(() => {});
    fetchPublishedAnnouncements().then(setAnnouncements).catch(() => {});
  }, [user]);

  useEffect(() => {
    if (!user || typeof window === "undefined") return;

    async function load() {
      try {
        const keys = Object.keys(localStorage).filter((k) => k.startsWith("lastWatched_"));
        if (keys.length === 0) {
          setDataLoading(false);
          return;
        }

        const entries = await Promise.all(
          keys.slice(-10).reverse().map(async (entryKey) => {
            const raw = localStorage.getItem(entryKey);
            let entry;
            try {
              entry = JSON.parse(raw);
            } catch {
              entry = { name: raw };
            }
            let slug = entryKey.replace("lastWatched_", "");
            if (!slug && entry.targetUrl) {
              const match = entry.targetUrl.match(/\/courses\/([^/]+)/);
              if (match) slug = match[1];
            }
            if (slug) {
              try {
                const course = await fetchCourse(slug);
                entry.course = course;
                entry.slug = slug;
              } catch {
                entry.slug = slug;
              }
            }
            return entry;
          })
        );
        setLastWatchedList(entries.filter(Boolean));
      } catch {
      } finally {
        setDataLoading(false);
      }
    }

    load();
  }, [user]);

  const loading = authLoading || dataLoading;

  const persianDate = new Date().toLocaleDateString("fa-IR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const handleDayClick = useCallback((date) => {
    setSelectedDate(date);
    setShowDialog(true);
  }, []);

  const addEvent = useCallback(async () => {
    if (!eventTitle.trim() || !selectedDate) return;
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    try {
      const newEvent = await createEvent({ title: eventTitle.trim(), date: dateStr });
      setEvents((prev) => [...prev, newEvent]);
      setEventTitle("");
      setShowDialog(false);
    } catch (err) {
      toast.error(err.message);
    }
  }, [eventTitle, selectedDate]);

  const startEditEvent = useCallback((i) => {
    const eventsForDate = events.filter((e) => e.date === format(selectedDate, "yyyy-MM-dd"));
    setEditTitle(eventsForDate[i]?.title || "");
    setEditingIndex(i);
  }, [events, selectedDate]);

  const saveEditEvent = useCallback(async (i) => {
    if (!editTitle.trim()) return;
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    const eventsForDate = events.filter((e) => e.date === dateStr);
    const target = eventsForDate[i];
    if (!target) return;
    try {
      const updated = await updateEvent(target.id, { title: editTitle.trim() });
      setEvents((prev) => prev.map((e) => (e.id === target.id ? updated : e)));
      setEditingIndex(null);
      setEditTitle("");
    } catch (err) {
      toast.error(err.message);
    }
  }, [editTitle, selectedDate, events]);

  const deleteEvent = useCallback(async (i) => {
    if (!window.confirm("آیا از حذف این رویداد مطمئن هستید؟")) return;
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    const eventsForDate = events.filter((e) => e.date === dateStr);
    const target = eventsForDate[i];
    if (!target) return;
    try {
      await deleteEventApi(target.id);
      setEvents((prev) => prev.filter((e) => e.id !== target.id));
    } catch (err) {
      toast.error(err.message);
    }
  }, [selectedDate, events]);

  const todaysEvents = events.filter((e) => {
    if (!selectedDate) return false;
    return e.date === format(selectedDate, "yyyy-MM-dd");
  });

  const hasEvent = (date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return events.some((e) => e.date === dateStr);
  };

  if (authLoading && !user) {
    return (
      <div dir="rtl">
        <div className="mx-auto flex max-w-6xl gap-8">
          <div className="flex-1 max-w-2xl space-y-6">
            <div className="h-10 w-60 animate-pulse rounded-xl bg-muted" />
            <div className="h-8 w-40 animate-pulse rounded-xl bg-muted" />
            <div className="h-32 w-full animate-pulse rounded-2xl bg-muted" />
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div dir="rtl">
        <div className="mx-auto flex max-w-6xl gap-8">
          <div className="flex-1 max-w-2xl space-y-6">
            <div className="h-10 w-60 animate-pulse rounded-xl bg-muted" />
            <div className="h-8 w-40 animate-pulse rounded-xl bg-muted" />
            <div className="h-32 w-full animate-pulse rounded-2xl bg-muted" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl">
      <div className="mx-auto flex min-w-0 flex-col gap-8 lg:flex-row">
        <div className="flex-1 max-w-5xl space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card/70 p-4 shadow-sm backdrop-blur"
          >
            <Calendar className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">{persianDate}</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              سلام 👋 {user.name}
            </h1>
          </motion.div>
        
          {announcements.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Megaphone className="size-4" />
                اعلامیه‌ها
              </div>
              {announcements.map((a) => (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border border-border/60 bg-card/70 p-4 shadow-sm"
                >
                  <p className="font-semibold text-sm">{a.title}</p>
                  {a.body && <div className="prose prose-sm dark:prose-invert mt-1 [&_img]:max-h-32 [&_img]:rounded-lg" dangerouslySetInnerHTML={{ __html: a.body }} />}
                  <p className="mt-2 text-[10px] text-muted-foreground/60">
                    {new Date(a.createdAt).toLocaleDateString("fa-IR")}
                  </p>
                </motion.div>
              ))}
            </div>
          )}

          {lastWatchedList.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <History className="size-4" />
                ویدیوهای تماشا شده
              </div>
              {lastWatchedList.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="overflow-hidden rounded-2xl border border-border/60 bg-card/70 shadow-sm"
                >
                  <div className="flex items-center gap-4 p-4">
                    {item.course?.thumbnail && (
                      <div className="size-14 shrink-0 overflow-hidden rounded-xl">
                        <img src={item.course.thumbnail} alt="" className="size-full object-cover" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground">{item.course?.title || "دوره"}</p>
                      <p className="mt-0.5 truncate text-sm font-medium">{item.name}</p>
                    </div>
                    {item.slug && (
                      <Link
                        href={`/dashboard/courses/${item.slug}`}
                        className="flex shrink-0 items-center gap-1 rounded-xl bg-primary/10 px-3 py-2 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
                      >
                        <Play className="size-3" />
                        ادامه
                      </Link>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-2xl border border-border/60 bg-card/70 p-5 shadow-sm backdrop-blur"
            >
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  هنوز هیچ ویدیویی تماشا نکرده‌اید
                </p>
              </div>
            </motion.div>
          )}

        </div> {/* end left column */}

        <div className="w-full shrink-0 lg:w-80">
          <div className="rounded-2xl border border-border/60 bg-card p-3 sm:p-4 hidden md:block">
            <DayPicker
              mode="single"
              selected={selectedDate}
              onSelect={handleDayClick}
              locale={faIR}
              dateLib={jalaliDateLib}
              dir="rtl"
              modifiers={{
                hasEvent: (date) => hasEvent(date),
              }}
              modifiersClassNames={{
                hasEvent: "rdp-day_has-event",
              }}
              formatters={{
                formatCaption: (date, options) => {
                  const month = getMonth(date);
                  const year = getYear(date);
                  const monthNames = [
                    "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
                    "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند",
                  ];
                  return `${monthNames[month]} ${year}`;
                },
                formatWeekdayName: (date) => {
                  const names = ["ش", "ی", "د", "س", "چ", "پ", "ج"];
                  return names[(date.getDay() + 1) % 7];
                },
              }}
            />
            <style>{`
              .rdp-root {
                --rdp-accent-color: var(--color-primary, var(--primary, #6366f1));
                margin: 0;
              }
              .rdp-root .rdp-months {
                padding: 0;
                margin: 0;
              }
              .rdp-day_has-event::after {
                content: "";
                display: block;
                width: 4px;
                height: 4px;
                border-radius: 50%;
                background: var(--color-primary, #3b82f6);
                margin: 1px auto 0;
              }
              .rdp-day {
                position: relative;
              }
            `}</style>
          </div>

          {selectedDate && !showDialog && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 rounded-2xl border border-border/60 bg-card p-4"
            >
              <h3 className="mb-2 text-sm font-semibold">
                رویدادهای {format(selectedDate, "yyyy/MM/dd")}
              </h3>
              {todaysEvents.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  {format(selectedDate, "yyyy/MM/dd")} — بدون رویداد
                </p>
              ) : (
                <ul className="space-y-1">
                  {todaysEvents.map((e, i) => (
                    <li key={i} className="flex items-center justify-between gap-2 rounded-lg px-2 py-1 text-sm text-muted-foreground hover:bg-accent/50">
                      {editingIndex === i ? (
                        <div className="flex w-full items-center gap-2">
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") saveEditEvent(i);
                              if (e.key === "Escape") { setEditingIndex(null); setEditTitle(""); }}
                            }
                            className="flex-1 rounded-md border border-border/60 bg-background px-2 py-1 text-xs outline-none focus:border-primary"
                            autoFocus
                          />
                          <button onClick={() => saveEditEvent(i)} className="rounded p-0.5 text-xs text-green-500 hover:text-green-700">✓</button>
                          <button onClick={() => { setEditingIndex(null); setEditTitle(""); }} className="rounded p-0.5 text-xs text-muted-foreground hover:text-foreground">✕</button>
                        </div>
                      ) : (
                        <>
                          <span>• {e.title}</span>
                          <div className="flex gap-1">
                            <button onClick={() => startEditEvent(i)} className="rounded p-0.5 text-xs text-muted-foreground hover:text-foreground">✏️</button>
                            <button onClick={() => deleteEvent(i)} className="rounded p-0.5 text-xs text-red-500 hover:text-red-700">🗑️</button>
                          </div>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </motion.div>
          )}

          <Link
            href="/dashboard/courses"
            className="mt-4 flex items-center justify-center gap-2 rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
          >
            <GraduationCap className="size-5" />
            بریم درس بخونیم 😑
          </Link>
        </div>
      </div> {/* end flex row */}

      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm rounded-2xl border border-border/60 bg-card p-6 shadow-xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                افزودن رویداد
              </h2>
              <button
                onClick={() => {
                  setShowDialog(false);
                  setEventTitle("");
                }}
                className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mb-3 text-sm text-muted-foreground">
              {selectedDate && format(selectedDate, "yyyy/MM/dd")}
            </p>
            <input
              type="text"
              value={eventTitle}
              onChange={(e) => setEventTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") addEvent();
              }}
              placeholder="عنوان رویداد..."
              className="w-full rounded-xl border border-border/60 bg-background px-4 py-2.5 text-sm outline-none transition-colors focus:border-primary"
              autoFocus
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowDialog(false);
                  setEventTitle("");
                }}
                className="rounded-xl px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
              >
                انصراف
              </button>
              <button
                onClick={addEvent}
                disabled={!eventTitle.trim()}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                افزودن
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
