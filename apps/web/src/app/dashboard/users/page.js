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
import { Plus, Pencil, Trash2, Search, Shield, ShieldCheck, GraduationCap, User, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { RequirePermission } from "@/components/RequirePermission";

const ICON_MAP = { Shield, ShieldCheck, GraduationCap, User };

function getInitials(name) {
  return name?.split(" ").map((w) => w[0]).join("").slice(0, 2) || "?";
}

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState({ name: "", username: "", email: "", password: "", role: "STUDENT" });
  const [roleDefs, setRoleDefs] = useState([]);

  useEffect(() => {
    fetch("/api/proxy/permissions/role-definitions", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then((r) => r.json())
      .then(setRoleDefs)
      .catch(() => {});
  }, []);

  const getRoleDef = (slug) => roleDefs.find((r) => r.slug === slug);
  const getRoleIcon = (slug) => {
    const def = getRoleDef(slug);
    return ICON_MAP[def?.icon] || User;
  };

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
    setForm({ name: "", username: "", email: "", password: "", role: "STUDENT" });
    setDialogOpen(true);
  };

  const openEdit = (user) => {
    setEditingUser(user);
    setForm({ name: user.name, username: user.username || "", email: user.email || "", password: "", role: user.role });
    setDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        const data = { name: form.name, email: form.email || null, role: form.role };
        if (form.username) data.username = form.username;
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
      (u.username || "").includes(search) ||
      (u.email || "").includes(search)
  );

  return (
    <RequirePermission permissions={["users.view", "users.create", "users.edit"]}>
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
                className="flex cursor-pointer items-center gap-4 rounded-xl border border-border/60 bg-card/50 px-4 py-3 transition-colors hover:bg-card/80"
                onClick={() => router.push(`/dashboard/users/${user.id}`)}
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
                  <RoleIcon className={`size-4 ${getRoleDef(user.role)?.color || "text-muted-foreground"}`} />
                  <span>{getRoleDef(user.role)?.label || user.role}</span>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="size-8 rounded-xl" onClick={(e) => { e.stopPropagation(); openEdit(user); }}>
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 rounded-xl text-destructive hover:text-destructive"
                    onClick={(e) => { e.stopPropagation(); handleDelete(user); }}
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
              <label className="text-sm font-medium">نام کاربری</label>
              <Input
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="h-11 rounded-xl"
                dir="ltr"
                placeholder="اختیاری"
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
                placeholder="اختیاری"
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
              <div className="flex flex-wrap gap-2">
                {(roleDefs.length > 0 ? roleDefs : [
                  { slug: "SUPER_ADMIN", label: "مدیر ارشد", icon: "Shield", color: "text-rose-400" },
                  { slug: "ADMIN", label: "مدیر", icon: "ShieldCheck", color: "text-amber-400" },
                  { slug: "PROFESSOR", label: "استاد", icon: "GraduationCap", color: "text-emerald-400" },
                  { slug: "STUDENT", label: "دانشجو", icon: "User", color: "text-sky-400" },
                ]).map((r) => {
                  const Icon = ICON_MAP[r.icon] || User;
                  return (
                    <button
                      key={r.slug}
                      type="button"
                      onClick={() => setForm({ ...form, role: r.slug })}
                      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-all ${
                        form.role === r.slug ? "border-primary/50 bg-primary/10 text-primary" : "border-border/40 hover:bg-accent"
                      }`}
                    >
                      <Icon className={`size-4 ${r.color}`} />
                      {r.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setDialogOpen(false)}>انصراف</Button>
              <Button type="submit">{editingUser ? "بروزرسانی" : "ایجاد"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
    </RequirePermission>
  );
}
