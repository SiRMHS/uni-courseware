"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiFetch, fetchFaculties, fetchDepartments } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import { toast } from "sonner";
import { User, Camera, Key, Save, Palette } from "lucide-react";
import { ImageSelector } from "@/components/MediaManager";

function getInitials(name) {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2);
}

export default function ProfilePage() {
  const { loading: authLoading } = useAuth();
  const { theme: currentTheme, themes: allThemes, setTheme } = useTheme();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [form, setForm] = useState({ name: "", username: "", studentId: "", avatar: "", theme: "default-light", facultyId: "", departmentId: "" });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [faculties, setFaculties] = useState([]);
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    async function load() {
      try {
        const [data, facs, depts] = await Promise.all([
          apiFetch("/api/proxy/auth/me"),
          fetchFaculties(),
          fetchDepartments(),
        ]);
        const u = data.user || data;
        setUser(u);
        setForm({
          name: u.name || "",
          username: u.username || "",
          studentId: u.studentId || "",
          avatar: u.avatar || "",
          theme: u.theme || "default-light",
          facultyId: u.facultyId || "",
          departmentId: u.departmentId || "",
        });
        setFaculties(facs);
        setDepartments(depts);
      } catch (err) {
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiFetch("/api/proxy/auth/profile", {
        method: "PUT",
        body: JSON.stringify(form),
      });
      toast.success("پروفایل بروزرسانی شد");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("رمز عبور جدید و تکرار آن مطابقت ندارند");
      return;
    }
    setSavingPassword(true);
    try {
      await apiFetch("/api/proxy/auth/change-password", {
        method: "POST",
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });
      toast.success("رمز عبور با موفقیت تغییر کرد");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSavingPassword(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="space-y-6">
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
      >
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">پروفایل کاربری</h1>
        <p className="mt-1 text-sm text-muted-foreground">مشاهده و ویرایش اطلاعات حساب کاربری</p>
      </motion.div>

      <Separator className="bg-border/60" />

      <div className="grid gap-6 xl:grid-cols-[auto_1fr]">
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        >
          <Card className="w-full border-border/60 bg-card/70 backdrop-blur xl:w-72">
            <CardContent className="flex flex-col items-center gap-4 pt-6">
              <div className="relative">
                <Avatar className="size-28">
                  {form.avatar ? (
                    <AvatarImage src={form.avatar} alt={user?.name} />
                  ) : null}
                  <AvatarFallback className="bg-linear-to-br from-emerald-400 to-cyan-500 text-3xl font-bold text-slate-950">
                    {getInitials(user?.name)}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="text-center w-full">
                <p className="text-lg font-semibold">{user?.name}</p>
                <p className="text-sm text-muted-foreground" dir="ltr">{user?.email}</p>
              </div>
              <div className="w-full pt-2">
                <ImageSelector
                  label="تصویر پروفایل"
                  value={form.avatar}
                  onChange={(url) => setForm({ ...form, avatar: url })}
                  folder="/filamoon_uploads/profiles"
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="flex-1 space-y-6"
        >
          <Card className="border-border/60 bg-card/70 backdrop-blur">
            <CardHeader className="text-right">
              <CardTitle className="flex flex-row-reverse items-center gap-2">
                <User className="size-5" />
                اطلاعات شخصی
              </CardTitle>
              <CardDescription>ویرایش اطلاعات حساب کاربری خود</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
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
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">شماره دانشجویی</label>
                    <Input
                      value={form.studentId}
                      onChange={(e) => setForm({ ...form, studentId: e.target.value })}
                      className="h-11 rounded-xl"
                      dir="ltr"
                    />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">دانشکده</label>
                    <Select
                      value={form.facultyId}
                      onValueChange={(v) => setForm({ ...form, facultyId: v })}
                    >
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
                    <Select
                      value={form.departmentId}
                      onValueChange={(v) => setForm({ ...form, departmentId: v })}
                    >
                      <SelectTrigger className="h-11 rounded-xl">
                        <SelectValue placeholder="انتخاب گروه" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((d) => (
                          <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <Button type="submit" className="flex-row-reverse gap-2 rounded-xl" disabled={saving}>
                    <Save className="size-4" />
                    {saving ? "در حال ذخیره..." : "ذخیره تغییرات"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/70 backdrop-blur">
            <CardHeader className="text-right">
              <CardTitle className="flex flex-row-reverse items-center gap-2">
                <Palette className="size-5" />
                تم
              </CardTitle>
              <CardDescription>انتخاب تم مورد نظر</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
                {Object.entries(allThemes).map(([key, t]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setTheme(key)}
                    className={`flex flex-col items-center gap-2 rounded-xl border-2 p-3 transition-all hover:opacity-80 ${
                      currentTheme === key ? "border-primary" : "border-border/60"
                    }`}
                  >
                    <div
                      className="size-8 rounded-full"
                      style={{ backgroundColor: `rgb(${t.vars["--primary"]})` }}
                    />
                    <span className="text-xs font-medium">{t.name}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/70 backdrop-blur">
            <CardHeader className="text-right">
              <CardTitle className="flex flex-row-reverse items-center gap-2">
                <Key className="size-5" />
                تغییر رمز عبور
              </CardTitle>
              <CardDescription>رمز عبور خود را تغییر دهید</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">رمز عبور فعلی</label>
                  <Input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    className="h-11 rounded-xl"
                    required
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">رمز عبور جدید</label>
                    <Input
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      className="h-11 rounded-xl"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">تکرار رمز عبور جدید</label>
                    <Input
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      className="h-11 rounded-xl"
                      required
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <Button type="submit" className="flex-row-reverse gap-2 rounded-xl" disabled={savingPassword}>
                    <Save className="size-4" />
                    {savingPassword ? "در حال تغییر..." : "تغییر رمز عبور"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
