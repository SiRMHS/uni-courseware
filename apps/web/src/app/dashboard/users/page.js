"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { fetchUsers, createUser, updateUser, deleteUser } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Search, Shield, ShieldCheck, GraduationCap, User } from "lucide-react";
import { toast } from "sonner";

const ROLE_OPTIONS = [
  { value: "SUPER_ADMIN", label: "مدیر ارشد" },
  { value: "ADMIN", label: "مدیر" },
  { value: "PROFESSOR", label: "استاد" },
  { value: "STUDENT", label: "دانشجو" },
];

function getRoleIcon(role) {
  switch (role) {
    case "SUPER_ADMIN": return Shield;
    case "ADMIN": return ShieldCheck;
    case "PROFESSOR": return GraduationCap;
    default: return User;
  }
}

function getInitials(name) {
  return name?.split(" ").map((w) => w[0]).join("").slice(0, 2) || "?";
}

const roleColors = {
  SUPER_ADMIN: "text-rose-400",
  ADMIN: "text-amber-400",
  PROFESSOR: "text-emerald-400",
  STUDENT: "text-sky-400",
};

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const router = useRouter();
  const isAdmin = currentUser && ["SUPER_ADMIN", "ADMIN"].includes(currentUser.role);
  useEffect(() => {
    if (currentUser && !isAdmin) router.push("/dashboard");
  }, [currentUser, isAdmin, router]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "STUDENT" });

  const loadUsers = useCallback(async () => {
    try {
      const data = await fetchUsers();
      setUsers(data);
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const openCreate = () => {
    setEditingUser(null);
    setForm({ name: "", email: "", password: "", role: "STUDENT" });
    setDialogOpen(true);
  };

  const openEdit = (user) => {
    setEditingUser(user);
    setForm({ name: user.name, email: user.email, password: "", role: user.role });
    setDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        const data = { name: form.name, email: form.email, role: form.role };
        if (form.password) data.password = form.password;
        await updateUser(editingUser.id, data);
        toast.success("کاربر بروزرسانی شد");
      } else {
        await createUser(form);
        toast.success("کاربر ایجاد شد");
      }
      setDialogOpen(false);
      loadUsers();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (user) => {
    if (!confirm(`آیا از حذف "${user.name}" اطمینان دارید؟`)) return;
    try {
      await deleteUser(user.id);
      toast.success("کاربر حذف شد");
      loadUsers();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const filtered = users.filter(
    (u) =>
      u.name.includes(search) ||
      u.email.includes(search)
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
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">مدیریت کاربران</h1>
          <p className="mt-1 text-sm text-muted-foreground">مدیریت حساب‌های کاربری سامانه</p>
        </div>
        <Button onClick={openCreate} className="flex-row-reverse gap-2 rounded-xl">
          <Plus className="size-4" />
          کاربر جدید
        </Button>
      </motion.div>

      <div className="relative max-w-sm">
        <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="جستجوی کاربر..."
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
          {filtered.map((user) => {
            const RoleIcon = getRoleIcon(user.role);
            return (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-4 rounded-xl border border-border/60 bg-card/50 px-4 py-3 transition-colors hover:bg-card/80"
              >
                <Avatar className="size-10">
                  {user.image ? <AvatarImage src={user.image} alt={user.name} /> : null}
                  <AvatarFallback className="bg-primary/10 text-sm font-medium text-primary">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{user.name}</p>
                  <p className="truncate text-xs text-muted-foreground" dir="ltr">{user.email}</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <RoleIcon className={`size-4 ${roleColors[user.role]}`} />
                  <span>{ROLE_OPTIONS.find((r) => r.value === user.role)?.label}</span>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="size-8 rounded-xl" onClick={() => openEdit(user)}>
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 rounded-xl text-destructive hover:text-destructive"
                    onClick={() => handleDelete(user)}
                    disabled={user.id === currentUser?.id}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </motion.div>
            );
          })}
          {filtered.length === 0 && (
            <p className="py-12 text-center text-muted-foreground">کاربری یافت نشد</p>
          )}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingUser ? "ویرایش کاربر" : "کاربر جدید"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">نام</label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="h-11 rounded-xl"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">ایمیل</label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="h-11 rounded-xl"
                dir="ltr"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{editingUser ? "رمز عبور جدید (اختیاری)" : "رمز عبور"}</label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="h-11 rounded-xl"
                required={!editingUser}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">نقش</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setDialogOpen(false)}>انصراف</Button>
              <Button type="submit">{editingUser ? "بروزرسانی" : "ایجاد"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
