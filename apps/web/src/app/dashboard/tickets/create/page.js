"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createTicket, fetchFaculties, fetchDepartments } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import TipTapEditor from "@/components/TipTapEditor";
import { motion } from "framer-motion";
import { ArrowRight, Send } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function CreateTicketPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [facultyId, setFacultyId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [faculties, setFaculties] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [facs, depts] = await Promise.all([
          fetchFaculties(),
          fetchDepartments(),
        ]);
        setFaculties(facs);
        setDepartments(depts);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filteredDepts = departments.filter(
    (d) => !facultyId || d.facultyId === facultyId
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !body) {
      toast.error("عنوان و متن تیکت الزامی است");
      return;
    }
    setSubmitting(true);
    try {
      const ticket = await createTicket({ title, body, facultyId, departmentId });
      toast.success("تیکت با موفقیت ایجاد شد");
      router.push(`/dashboard/tickets/${ticket.id}`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
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

  return (
    <div className="space-y-6 text-right max-w-7xl">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="flex items-center gap-3"
      >
        <Link href="/dashboard/tickets">
          <Button variant="ghost" size="icon" className="size-9 rounded-xl">
            <ArrowRight className="size-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">تیکت جدید</h1>
          <p className="mt-1 text-sm text-muted-foreground">ایجاد درخواست جدید</p>
        </div>
      </motion.div>

      <Card className="border-border/60 bg-card/70 backdrop-blur">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium">عنوان</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="عنوان تیکت"
                className="h-11 rounded-xl"
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">دانشکده</label>
                <Select value={facultyId} onValueChange={setFacultyId}>
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue placeholder="انتخاب دانشکده" />
                  </SelectTrigger>
                  <SelectContent>
                    {faculties.map((f) => (
                      <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">گروه</label>
                <Select value={departmentId} onValueChange={setDepartmentId}>
                  <SelectTrigger className="h-11 rounded-xl">
                    <SelectValue placeholder="انتخاب گروه" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredDepts.map((d) => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">متن تیکت</label>
              <TipTapEditor
                content={body}
                onChange={setBody}
                placeholder="مشکل یا درخواست خود را توضیح دهید..."
              />
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" className="flex-row-reverse gap-2 rounded-xl" disabled={submitting}>
                <Send className="size-4" />
                {submitting ? "در حال ارسال..." : "ارسال تیکت"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
