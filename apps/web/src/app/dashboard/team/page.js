"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  fetchTeams, createTeam, updateTeam, deleteTeam,
  addTeamMember, removeTeamMember, fetchUsers,
} from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Users, X, Search, BookOpen } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import ReactMarkdown from "react-markdown";

const teamRoleLabels = {
  leader: "سرپرست",
  member: "عضو",
};

function getInitials(name) {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2);
}

export default function TeamPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", description: "", story: "" });
  const [addMemberDialog, setAddMemberDialog] = useState(null);
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState("");
  const [roleDefs, setRoleDefs] = useState([]);

  useEffect(() => {
    fetch("/api/proxy/permissions/role-definitions", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then((r) => r.json())
      .then(setRoleDefs)
      .catch(() => {});
  }, []);

  const getRoleLabel = (slug) => roleDefs.find((r) => r.slug === slug)?.label || slug;

  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  const load = useCallback(async () => {
    try {
      const data = await fetchTeams();
      setTeams(data);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", description: "", story: "" });
    setDialogOpen(true);
  };

  const openEdit = (t) => {
    setEditing(t);
    setForm({ name: t.name, description: t.description || "", story: t.story || "" });
    setDialogOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await updateTeam(editing.id, form);
        toast.success("تیم بروزرسانی شد");
      } else {
        await createTeam(form);
        toast.success("تیم ایجاد شد");
      }
      setDialogOpen(false);
      load();
    } catch (err) { toast.error(err.message); }
  };

  const handleDelete = async (t) => {
    if (!confirm(`حذف تیم "${t.name}"؟`)) return;
    try {
      await deleteTeam(t.id);
      toast.success("تیم حذف شد");
      load();
    } catch (err) { toast.error(err.message); }
  };

  const openAddMember = async (team) => {
    setAddMemberDialog(team);
    setUserSearch("");
    try {
      const allUsers = await fetchUsers();
      const memberIds = new Set(team.members.map((m) => m.userId));
      setUsers(allUsers.filter((u) => !memberIds.has(u.id)));
    } catch { toast.error("خطا در دریافت کاربران"); }
  };

  const handleAddMember = async (userId) => {
    try {
      await addTeamMember(addMemberDialog.id, userId, "member");
      toast.success("عضو اضافه شد");
      load();
      openAddMember(addMemberDialog);
    } catch (err) { toast.error(err.message); }
  };

  const handleRemoveMember = async (teamId, memberId) => {
    try {
      await removeTeamMember(teamId, memberId);
      toast.success("عضو حذف شد");
      load();
    } catch (err) { toast.error(err.message); }
  };

  const filteredUsers = users.filter(
    (u) => u.name?.toLowerCase().includes(userSearch.toLowerCase()) || u.username?.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">تیم ما</h1>
          <p className="mt-1 text-sm text-muted-foreground">آشنایی با اعضای تیم فایلامون</p>
        </div>
        {isSuperAdmin && (
          <Button onClick={openCreate} className="flex-row-reverse gap-2 rounded-xl">
            <Plus className="size-4" />
            تیم جدید
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="space-y-4 rounded-xl border border-border/60 p-6">
              <Skeleton className="h-6 w-48" />
              <div className="flex gap-4">
                {Array.from({ length: 4 }).map((_, j) => <Skeleton key={j} className="size-24 rounded-xl" />)}
              </div>
            </div>
          ))}
        </div>
      ) : teams.length === 0 ? (
        <Card className="border-border/60">
          <CardContent className="flex flex-col items-center gap-4 py-16">
            <Users className="size-12 text-muted-foreground/40" />
            <p className="text-muted-foreground">تیمی وجود ندارد</p>
            <Button variant="outline" className="rounded-xl" onClick={openCreate}>ایجاد تیم</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {teams[0]?.story && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-border/60 bg-gradient-to-br from-primary/5 via-background to-background p-6"
            >
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="size-4 text-primary" />
                <h2 className="text-sm font-semibold">داستان ما</h2>
              </div>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown>{teams[0].story}</ReactMarkdown>
              </div>
            </motion.div>
          )}
          {teams.map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-xl border border-border/60 bg-card/50 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold">{t.name}</h2>
                  {t.description && <p className="mt-1 text-sm text-muted-foreground">{t.description}</p>}
                </div>
                <div className="flex gap-1">
                  {isSuperAdmin && (
                    <>
                      <Button variant="ghost" size="icon" className="size-8 rounded-xl" onClick={() => openAddMember(t)} title="افزودن عضو">
                        <Plus className="size-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="size-8 rounded-xl" onClick={() => openEdit(t)}>
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="size-8 rounded-xl text-destructive" onClick={() => handleDelete(t)}>
                        <Trash2 className="size-3.5" />
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {t.members.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">هیچ عضوی در این تیم وجود ندارد</p>
              ) : (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {t.members.map((m) => (
                    <Link
                      key={m.id}
                      href={`/dashboard/users/${m.user.id}`}
                      className="group relative flex flex-col items-center overflow-hidden rounded-xl border border-border/40 bg-card transition-all hover:border-primary/30 hover:shadow-sm"
                    >
                      <div className="relative w-full overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5">
                        <Avatar className="mx-auto size-45 md:size-61 rounded-none">
                          {m.user.avatar ? <AvatarImage src={m.user.avatar} className="size-full object-cover" /> : null}
                          <AvatarFallback className="size-full rounded-none bg-gradient-to-br from-primary/30 to-primary/10 text-2xl font-bold text-primary">
                            {getInitials(m.user.name)}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      <div className="w-full space-y-1 p-3 text-center">
                        <p className="truncate text-sm font-medium">{m.user.name}</p>
                        <p className="truncate text-xs text-muted-foreground" dir="ltr">{m.user.username}</p>
                        <span className="inline-block rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                          {getRoleLabel(m.user.role)}
                        </span>
                      </div>
                      {isSuperAdmin && (
                        <button
                          type="button"
                          onClick={(e) => { e.preventDefault(); handleRemoveMember(t.id, m.id); }}
                          className="absolute left-1 top-1 z-10 rounded-lg bg-background/80 p-1 text-muted-foreground opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100 backdrop-blur-sm"
                        >
                          <X className="size-3.5" />
                        </button>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "ویرایش تیم" : "تیم جدید"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">نام تیم</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-11 rounded-xl" required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">توضیحات (اختیاری)</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">داستان ما (اختیاری)</label>
              <textarea
                value={form.story}
                onChange={(e) => setForm({ ...form, story: e.target.value })}
                rows={5}
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setDialogOpen(false)}>انصراف</Button>
              <Button type="submit">{editing ? "بروزرسانی" : "ایجاد"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!addMemberDialog} onOpenChange={(o) => { if (!o) setAddMemberDialog(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>افزودن عضو به {addMemberDialog?.name}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="جستجوی کاربران..."
                className="h-11 rounded-xl pr-10"
              />
            </div>
            <div className="max-h-60 space-y-1 overflow-y-auto">
              {filteredUsers.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">کاربری یافت نشد</p>
              ) : (
                filteredUsers.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleAddMember(u.id)}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-right transition-colors hover:bg-accent"
                  >
                    <Avatar className="size-9 shrink-0 rounded-lg">
                      {u.avatar ? <AvatarImage src={u.avatar} /> : null}
                      <AvatarFallback className="rounded-lg bg-primary/10 text-primary text-xs">
                        {getInitials(u.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{u.name}</p>
                      <p className="truncate text-xs text-muted-foreground" dir="ltr">{u.username || u.email}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                      {getRoleLabel(u.role)}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
