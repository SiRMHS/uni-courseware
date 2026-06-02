"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  ArrowRight, Shield, ShieldCheck, GraduationCap, User, Mail, Calendar,
  Play, Download, History, Hash, Building2, FolderOpen, Award, Check, X, Lock,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { fetchUserActivities } from "@/lib/api";
import { toast } from "sonner";

const ROLE_MAP = {
  SUPER_ADMIN: { label: "مدیر ارشد", icon: Shield, color: "text-rose-400" },
  ADMIN: { label: "مدیر", icon: ShieldCheck, color: "text-amber-400" },
  PROFESSOR: { label: "استاد", icon: GraduationCap, color: "text-emerald-400" },
  STUDENT: { label: "دانشجو", icon: User, color: "text-sky-400" },
};

function getInitials(name) {
  return name?.split(" ").map((w) => w[0]).join("").slice(0, 2) || "?";
}

export default function UserDetailPage() {
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const [user, setUser] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [editingBadge, setEditingBadge] = useState(false);
  const [badgeValue, setBadgeValue] = useState("");
  const [passwordDialog, setPasswordDialog] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  const isAdmin = currentUser && ["SUPER_ADMIN", "ADMIN"].includes(currentUser.role);

  const loadUser = useCallback(async () => {
    try {
      const res = await fetch(`/api/proxy/users/${id}`, {
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (!res.ok) throw new Error("کاربر یافت نشد");
      const data = await res.json();
      setUser(data);
      setBadgeValue(data.badge || "");
    } catch {
    } finally {
      setLoading(false);
    }
    if (isAdmin) {
      try {
        const act = await fetchUserActivities(id);
        setActivities(act);
      } catch {}
      setActivitiesLoading(false);
    }
  }, [id, isAdmin]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const saveBadge = async () => {
    try {
      const res = await fetch(`/api/proxy/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({ badge: badgeValue || null }),
      });
      if (!res.ok) throw new Error("خطا در ذخیره");
      setUser((prev) => ({ ...prev, badge: badgeValue || null }));
      setEditingBadge(false);
      toast.success("بدج بروزرسانی شد");
    } catch (err) {
      toast.error(err.message);
    }
  };

  const changePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error("رمز عبور باید حداقل ۶ کاراکتر باشد");
      return;
    }
    setChangingPassword(true);
    try {
      const res = await fetch(`/api/proxy/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({ password: newPassword }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "خطا در تغییر رمز");
      }
      toast.success("رمز عبور تغییر کرد");
      setPasswordDialog(false);
      setNewPassword("");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-40 rounded-xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center text-muted-foreground">
        <p className="text-lg font-medium">کاربر یافت نشد</p>
        <Button variant="link" asChild className="mt-2">
          <Link href="/dashboard/users">بازگشت به مدیریت کاربران</Link>
        </Button>
      </div>
    );
  }

  const roleInfo = ROLE_MAP[user.role] || ROLE_MAP.STUDENT;
  const RoleIcon = roleInfo.icon;
  const initials = getInitials(user.name);
  const isSelf = user.id === currentUser?.id;

  return (
    <div className="space-y-6">
      <Button variant="ghost" asChild className="flex-row-reverse gap-2">
        <Link href={isAdmin ? "/dashboard/users" : "/dashboard/team"}>
          <ArrowRight className="size-4" />
          {isAdmin ? "بازگشت به مدیریت کاربران" : "بازگشت به تیم ما"}
        </Link>
      </Button>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <Card className="rounded-2xl border-border/60">
          <CardHeader className="flex flex-row items-center gap-4 pb-4">
            <Avatar className="size-16 rounded-2xl">
              {user.avatar ? <AvatarImage src={user.avatar} alt={user.name} /> : null}
              <AvatarFallback className="rounded-2xl bg-primary/10 text-xl font-medium text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-xl">{user.name}</CardTitle>
                {user.badge && (
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-medium text-primary">
                    {user.badge}
                  </span>
                )}
              </div>
              <div className="mt-1 flex items-center gap-2 text-sm">
                <RoleIcon className={`size-4 ${roleInfo.color}`} />
                <span className={roleInfo.color}>{roleInfo.label}</span>
                {isSelf && (
                  <span className="rounded-xl bg-primary/10 px-2 py-0.5 text-[11px] text-primary">شما</span>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {user.username && (
              <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/50 px-4 py-3">
                <User className="size-4 text-muted-foreground" />
                <span dir="ltr" className="text-sm">{user.username}</span>
              </div>
            )}
            {user.email && (
              <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/50 px-4 py-3">
                <Mail className="size-4 text-muted-foreground" />
                <span dir="ltr" className="text-sm">{user.email}</span>
              </div>
            )}
            {user.studentId && (
              <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/50 px-4 py-3">
                <Hash className="size-4 text-muted-foreground" />
                <span className="text-sm">{user.studentId}</span>
              </div>
            )}
            {user.department?.name && (
              <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/50 px-4 py-3">
                <FolderOpen className="size-4 text-muted-foreground" />
                <span className="text-sm">{user.department.name}</span>
              </div>
            )}
            {user.faculty?.name && (
              <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/50 px-4 py-3">
                <Building2 className="size-4 text-muted-foreground" />
                <span className="text-sm">{user.faculty.name}</span>
              </div>
            )}
            {user.createdAt && (
              <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/50 px-4 py-3">
                <Calendar className="size-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  تاریخ عضویت: {new Date(user.createdAt).toLocaleDateString("fa-IR")}
                </span>
              </div>
            )}
            {isAdmin && !isSelf && (
              <>
                <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/50 px-4 py-3">
                  <Award className="size-4 text-muted-foreground" />
                  <div className="flex flex-1 items-center gap-2">
                    {editingBadge ? (
                      <>
                        <Input
                          value={badgeValue}
                          onChange={(e) => setBadgeValue(e.target.value)}
                          className="h-8 rounded-lg text-sm"
                          placeholder="مثال: برترین استاد"
                        />
                        <button type="button" onClick={saveBadge} className="rounded-lg p-1 text-emerald-500 hover:bg-emerald-500/10">
                          <Check className="size-4" />
                        </button>
                        <button type="button" onClick={() => { setEditingBadge(false); setBadgeValue(user.badge || ""); }} className="rounded-lg p-1 text-muted-foreground hover:bg-accent">
                          <X className="size-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="text-sm text-muted-foreground flex-1">
                          {user.badge ? `بدج: ${user.badge}` : "بدجی تنظیم نشده"}
                        </span>
                        <button type="button" onClick={() => setEditingBadge(true)} className="text-xs text-primary hover:underline">
                          تنظیم بدج
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/50 px-4 py-3">
                  <Lock className="size-4 text-muted-foreground" />
                  <span className="flex-1 text-sm text-muted-foreground">تغییر رمز عبور</span>
                  <button type="button" onClick={() => setPasswordDialog(true)} className="text-xs text-primary hover:underline">
                    تغییر رمز
                  </button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {isAdmin && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="rounded-2xl border-border/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <History className="size-4" />
                فعالیت‌های اخیر
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activitiesLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)}
                </div>
              ) : activities.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">فعالیتی ثبت نشده</p>
              ) : (
                <div className="space-y-2">
                  {activities.map((a) => (
                    <div key={a.id} className="flex items-center gap-3 rounded-xl border border-border/40 bg-card/50 px-4 py-2.5 text-sm">
                      {a.action === "watch" ? (
                        <Play className="size-3.5 shrink-0 text-emerald-500" />
                      ) : (
                        <Download className="size-3.5 shrink-0 text-blue-500" />
                      )}
                      <span className="flex-1 truncate">{a.target || a.action}</span>
                      {a.targetUrl && (
                        <a href={a.targetUrl} className="text-xs text-primary hover:underline shrink-0" target="_blank">مشاهده</a>
                      )}
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {new Date(a.createdAt).toLocaleDateString("fa-IR")}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
      <Dialog open={passwordDialog} onOpenChange={(o) => { if (!o) { setPasswordDialog(false); setNewPassword(""); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>تغییر رمز عبور {user.name}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">رمز عبور جدید</label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="h-11 rounded-xl"
                dir="ltr"
                placeholder="حداقل ۶ کاراکتر"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => { setPasswordDialog(false); setNewPassword(""); }}>انصراف</Button>
              <Button onClick={changePassword} disabled={changingPassword || !newPassword}>
                {changingPassword ? "در حال تغییر..." : "تغییر رمز"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
