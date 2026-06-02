"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { fetchTickets, fetchDepartments } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion } from "framer-motion";
import Link from "next/link";
import { Plus, MessageSquare, Calendar } from "lucide-react";

const statusLabels = {
  open: "باز",
  answered: "پاسخ داده شده",
  closed: "بسته",
};

const statusColors = {
  open: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  answered: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  closed: "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20",
};

export default function TicketsPage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [departmentFilter, setDepartmentFilter] = useState("");
  const isAdmin = user?.role === "SUPER_ADMIN" || user?.role === "ADMIN";

  useEffect(() => {
    async function load() {
      try {
        const [ticketsData, departmentsData] = await Promise.all([
          fetchTickets(),
          fetchDepartments(),
        ]);
        setTickets(ticketsData);
        setDepartments(departmentsData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = isAdmin && departmentFilter
    ? tickets.filter((t) => t.departmentId === departmentFilter)
    : tickets;

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 text-right">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-wrap items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">تیکت‌ها</h1>
          <p className="mt-1 text-sm text-muted-foreground">پیگیری درخواست‌ها و مشکلات</p>
        </div>
        <Link href="/dashboard/tickets/create">
          <Button className="flex-row-reverse gap-2 rounded-xl">
            <Plus className="size-4" />
            ایجاد تیکت جدید
          </Button>
        </Link>
      </motion.div>

      {isAdmin && (
        <div className="flex items-center gap-2">
          <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
            <SelectTrigger className="w-56 rounded-xl">
              <SelectValue placeholder="همه گروه‌ها" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">همه گروه‌ها</SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {filtered.length === 0 ? (
        <Card className="border-border/60 bg-card/70 backdrop-blur">
          <CardContent className="flex flex-col items-center gap-4 py-16">
            <MessageSquare className="size-12 text-muted-foreground/40" />
            <p className="text-muted-foreground">تیکتی وجود ندارد</p>
            <Link href="/dashboard/tickets/create">
              <Button variant="outline" className="rounded-xl">
                ایجاد تیکت جدید
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((ticket, i) => (
            <motion.div
              key={ticket.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
            >
              <Link href={`/dashboard/tickets/${ticket.id}`}>
                <Card className="border-border/60 bg-card/70 backdrop-blur transition-colors hover:bg-accent/50 cursor-pointer">
                  <CardContent className="flex flex-wrap items-center gap-4 p-5">
                    <div className="flex-1 space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold truncate">{ticket.title}</p>
                        <Badge variant="outline" className={`text-xs ${statusColors[ticket.status] || ""}`}>
                          {statusLabels[ticket.status] || ticket.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                        <span>{ticket.user?.name || "ناشناس"}</span>
                        {ticket.department && <span>{ticket.department.name}</span>}
                        {ticket.faculty && <span>{ticket.faculty.name}</span>}
                        <span className="flex items-center gap-1">
                          <MessageSquare className="size-3" />
                          {ticket._count?.messages || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="size-3" />
                          {new Date(ticket.createdAt).toLocaleDateString("fa-IR")}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
