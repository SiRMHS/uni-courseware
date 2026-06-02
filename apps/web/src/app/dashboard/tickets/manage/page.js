"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { fetchTickets, updateTicket, fetchFaculties, fetchDepartments, sendTicketMessage, deleteTicket } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  MessageSquare,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  ChevronDown,
  Send,
  UserCheck,
  ArrowLeft,
  Trash2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const statusColors = {
  open: "text-amber-600 bg-amber-50 border-amber-200",
  answered: "text-blue-600 bg-blue-50 border-blue-200",
  closed: "text-gray-500 bg-gray-50 border-gray-200",
};

const statusLabels = {
  open: "باز",
  answered: "پاسخ داده شده",
  closed: "بسته شده",
};

export default function TicketManagePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketDetail, setTicketDetail] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [faculties, setFaculties] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [deptFilter, setDeptFilter] = useState("");

  const isAdmin = user && ["SUPER_ADMIN", "ADMIN"].includes(user.role);

  useEffect(() => {
    if (!isAdmin) { router.push("/dashboard"); return; }
    loadTickets();
    fetchFaculties().then(setFaculties).catch(() => {});
    fetchDepartments().then(setDepartments).catch(() => {});
  }, []);

  const loadTickets = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchTickets();
      setTickets(data);
    } catch { toast.error("خطا در دریافت تیکت‌ها"); }
    finally { setLoading(false); }
  }, []);

  const openTicket = async (ticket) => {
    setSelectedTicket(ticket);
    try {
      const res = await fetch(`/api/proxy/tickets/${ticket.id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const data = await res.json();
      setTicketDetail(data);
    } catch { toast.error("خطا در دریافت جزئیات تیکت"); }
  };

  const handleReply = async () => {
    if (!replyText.trim() || !selectedTicket) return;
    setSubmitting(true);
    try {
      await sendTicketMessage(selectedTicket.id, replyText.trim());
      setReplyText("");
      toast.success("پاسخ ارسال شد");
      await openTicket(selectedTicket);
      loadTickets();
    } catch { toast.error("خطا در ارسال پاسخ"); }
    finally { setSubmitting(false); }
  };

  const handleStatusChange = async (ticketId, status) => {
    try {
      await updateTicket(ticketId, { status });
      toast.success("وضعیت بروزرسانی شد");
      loadTickets();
      if (ticketDetail?.id === ticketId) setTicketDetail((prev) => ({ ...prev, status }));
    } catch { toast.error("خطا در بروزرسانی"); }
  };

  const handleAssign = async (ticketId) => {
    try {
      await updateTicket(ticketId, { assignedToId: user.id });
      toast.success("تیکت به شما واگذار شد");
      loadTickets();
    } catch { toast.error("خطا در واگذاری"); }
  };

  const handleDelete = async (ticketId) => {
    setDeleting(true);
    try {
      await deleteTicket(ticketId);
      toast.success("تیکت حذف شد");
      setDeleteConfirm(null);
      setSelectedTicket(null);
      setTicketDetail(null);
      loadTickets();
    } catch { toast.error("خطا در حذف تیکت"); }
    finally { setDeleting(false); }
  };

  const filtered = tickets.filter((t) => {
    if (filter !== "all" && t.status !== filter) return false;
    if (deptFilter && t.departmentId !== deptFilter) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">مدیریت تیکت‌ها</h1>
        <div className="flex items-center gap-3">
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="h-9 rounded-xl border border-input bg-background px-3 text-xs"
          >
            <option value="">همه دانشکده‌ها</option>
            {faculties.map((f) => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
          <div className="flex gap-1 rounded-xl border border-border/60 bg-background p-1">
            {["all", "open", "answered", "closed"].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setFilter(s)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  filter === s ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {s === "all" ? "همه" : statusLabels[s]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">تیکتی یافت نشد</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((ticket) => (
            <div
              key={ticket.id}
              role="button"
              tabIndex={0}
              onClick={() => openTicket(ticket)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") openTicket(ticket); }}
              className="flex w-full items-center gap-4 rounded-xl border border-border/40 bg-card/50 p-4 text-right transition-colors hover:bg-accent/40 cursor-pointer"
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <MessageSquare className="size-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3">
                  <span className="truncate text-sm font-medium">{ticket.title}</span>
                  <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-medium ${statusColors[ticket.status] || ""}`}>
                    {statusLabels[ticket.status] || ticket.status}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{ticket.user?.name || "کاربر ناشناس"}</span>
                  {ticket.department?.name && <span>— {ticket.department.name}</span>}
                  {ticket.faculty?.name && <span>— {ticket.faculty.name}</span>}
                  <span>— {ticket._count?.messages || 0} پیام</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {ticket.status !== "closed" && (
                  <>
                    {!ticket.assignedToId && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleAssign(ticket.id); }}
                        className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                        title="واگذاری به من"
                      >
                        <UserCheck className="size-4" />
                      </button>
                    )}
                    {ticket.status === "open" && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleStatusChange(ticket.id, "closed"); }}
                        className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                        title="بستن تیکت"
                      >
                        <XCircle className="size-4" />
                      </button>
                    )}
                    {ticket.status === "answered" && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleStatusChange(ticket.id, "closed"); }}
                        className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                        title="بستن تیکت"
                      >
                        <CheckCircle2 className="size-4" />
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!selectedTicket} onOpenChange={(o) => { if (!o) { setSelectedTicket(null); setTicketDetail(null); } }}>
        <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{ticketDetail?.title || selectedTicket?.title}</DialogTitle>
          </DialogHeader>
          {ticketDetail && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="rounded-full border border-border/60 px-2.5 py-0.5">
                  {statusLabels[ticketDetail.status] || ticketDetail.status}
                </span>
                {ticketDetail.user?.name && <span>از: {ticketDetail.user.name}</span>}
                {ticketDetail.department?.name && <span>گروه: {ticketDetail.department.name}</span>}
                {ticketDetail.faculty?.name && <span>دانشکده: {ticketDetail.faculty.name}</span>}
                {ticketDetail.assignedTo?.name && <span>مسئول: {ticketDetail.assignedTo.name}</span>}
                <button
                  type="button"
                  onClick={() => setDeleteConfirm(ticketDetail.id)}
                  className="mr-auto rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  title="حذف تیکت"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>

              <div className="space-y-3">
                {ticketDetail.messages.map((msg) => {
                  const isStaff = ["SUPER_ADMIN", "ADMIN"].includes(msg.user?.role);
                  return (
                    <div key={msg.id} className={`flex gap-3 ${isStaff ? "flex-row-reverse" : ""}`}>
                      <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                        isStaff ? "bg-primary text-primary-foreground" : "bg-accent"
                      }`}>
                        <p className="text-sm">{msg.body}</p>
                        <p className={`mt-1 text-[10px] ${isStaff ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                          {new Date(msg.createdAt).toLocaleString("fa-IR")}
                          {" — "}
                          {msg.user?.name || "ناشناس"}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {ticketDetail.status !== "closed" && (
                <div className="flex gap-2 border-t border-border/40 pt-4">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="پاسخ خود را بنویسید..."
                    rows={2}
                    className="min-h-[60px] flex-1 rounded-xl border border-input bg-transparent px-3 py-2 text-sm outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  />
                  <Button size="icon" className="size-10 shrink-0 rounded-xl" onClick={handleReply} disabled={submitting || !replyText.trim()}>
                    <Send className="size-4" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteConfirm} onOpenChange={(o) => { if (!o) setDeleteConfirm(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>حذف تیکت</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">آیا از حذف این تیکت اطمینان دارید؟ این عملیات قابل بازگشت نیست.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>انصراف</Button>
            <Button variant="destructive" onClick={() => handleDelete(deleteConfirm)} disabled={deleting}>
              {deleting ? "در حال حذف..." : "حذف تیکت"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
