"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { fetchTicket, sendTicketMessage, updateTicket } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import TipTapEditor from "@/components/TipTapEditor";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Send,
  CheckCircle2,
  UserCheck,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

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

function getInitials(name) {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2);
}

export default function TicketDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const isAdmin = user?.role === "SUPER_ADMIN" || user?.role === "ADMIN";

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchTicket(id);
        setTicket(data);
      } catch (err) {
        toast.error(err.message);
        router.push("/dashboard/tickets");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, router]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [ticket?.messages]);

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    setSending(true);
    try {
      const message = await sendTicketMessage(id, newMessage);
      setTicket((prev) => ({
        ...prev,
        messages: [...prev.messages, message],
        status: message.user.role !== "STUDENT" && prev.status === "open" ? "answered" : prev.status,
      }));
      setNewMessage("");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSending(false);
    }
  };

  const handleClose = async () => {
    try {
      await updateTicket(id, { status: "closed" });
      setTicket((prev) => ({ ...prev, status: "closed" }));
      toast.success("تیکت بسته شد");
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleAssign = async () => {
    try {
      await updateTicket(id, { assignedToId: user.id });
      setTicket((prev) => ({
        ...prev,
        assignedTo: { id: user.id, name: user.name },
      }));
      toast.success("تیکت به شما واگذار شد");
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  if (!ticket) return null;

  return (
    <div className="space-y-6 text-right max-w-3xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-wrap items-center justify-between gap-3"
      >
        <div className="flex items-center gap-3">
          <Link href="/dashboard/tickets">
            <Button variant="ghost" size="icon" className="size-9 rounded-xl">
              <ArrowRight className="size-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold sm:text-2xl">{ticket.title}</h1>
              <Badge variant="outline" className={`text-xs ${statusColors[ticket.status] || ""}`}>
                {statusLabels[ticket.status] || ticket.status}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {ticket.user?.name || "ناشناس"}
              {ticket.department && ` - ${ticket.department.name}`}
              {ticket.faculty && ` - ${ticket.faculty.name}`}
            </p>
          </div>
        </div>

        {isAdmin && ticket.status !== "closed" && (
          <div className="flex gap-2">
            {!ticket.assignedTo && (
              <Button variant="outline" size="sm" className="rounded-xl" onClick={handleAssign}>
                <UserCheck className="size-4 ml-1" />
                قبول تیکت
              </Button>
            )}
            <Button variant="outline" size="sm" className="rounded-xl text-red-500 border-red-200 hover:bg-red-50 dark:hover:bg-red-950" onClick={handleClose}>
              <CheckCircle2 className="size-4 ml-1" />
              بستن تیکت
            </Button>
          </div>
        )}
      </motion.div>

      <Card className="border-border/60 bg-card/70 backdrop-blur">
        <CardContent className="pt-6">
          {ticket.assignedTo && (
            <p className="text-xs text-muted-foreground mb-4">
              پاسخگو: {ticket.assignedTo.name}
            </p>
          )}
          <div className="text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: ticket.body }} />
        </CardContent>
      </Card>

      <div className="space-y-4">
        {ticket.messages.map((msg, i) => {
          const isMine = msg.userId === user.id;
          const isStaff = msg.user?.role === "SUPER_ADMIN" || msg.user?.role === "ADMIN";

          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.03 }}
              className={`flex gap-3 ${isMine ? "flex-row-reverse" : "flex-row"}`}
            >
              <Avatar className="size-9 shrink-0 mt-1">
                <AvatarFallback className={`text-xs ${isStaff ? "bg-emerald-500/20 text-emerald-600" : "bg-primary/10 text-primary"}`}>
                  {getInitials(msg.user?.name)}
                </AvatarFallback>
              </Avatar>
              <div className="max-w-[75%]">
                <div
                  className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    isStaff
                      ? "bg-emerald-500/10 text-emerald-900 dark:text-emerald-100"
                      : isMine
                      ? "bg-primary/10 text-foreground"
                      : "bg-accent/50 text-foreground"
                  }`}
                  dangerouslySetInnerHTML={{ __html: msg.body }}
                />
                <div className={`flex items-center gap-2 mt-1 ${isMine ? "justify-start" : "justify-end"}`}>
                  <span className="text-[10px] text-muted-foreground">{msg.user?.name}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(msg.createdAt).toLocaleString("fa-IR")}
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {ticket.status !== "closed" && (
        <Card className="border-border/60 bg-card/70 backdrop-blur sticky bottom-0">
          <CardContent className="pt-4">
            <div className="space-y-3">
              <TipTapEditor
                content={newMessage}
                onChange={setNewMessage}
                placeholder="پاسخ خود را بنویسید..."
              />
              <div className="flex justify-end">
                <Button
                  onClick={handleSend}
                  className="flex-row-reverse gap-2 rounded-xl"
                  disabled={sending || !newMessage.trim()}
                >
                  <Send className="size-4" />
                  {sending ? "در حال ارسال..." : "ارسال"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
