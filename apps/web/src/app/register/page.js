"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, Eye, EyeOff, Check, X } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

const ROLES = [
  { value: "STUDENT", label: "دانشجو" },
  { value: "PROFESSOR", label: "استاد" },
];

function PasswordStrength({ password }) {
  const checks = [
    { label: "حداقل ۶ کاراکتر", pass: password.length >= 6 },
    { label: "حرف کوچک لاتین (a-z)", pass: /[a-z]/.test(password) },
    { label: "حرف بزرگ لاتین (A-Z)", pass: /[A-Z]/.test(password) },
    { label: "کاراکتر خاص (!@#$...)", pass: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(password) },
  ];
  return (
    <div className="space-y-1.5">
      {checks.map((c) => (
        <div key={c.label} className={`flex items-center gap-2 text-xs ${c.pass ? "text-emerald-600" : "text-muted-foreground"}`}>
          {c.pass ? <Check className="size-3" /> : <X className="size-3" />}
          {c.label}
        </div>
      ))}
    </div>
  );
}

export default function RegisterPage() {
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("STUDENT");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !username || !password) {
      toast.error("نام، نام کاربری و رمز عبور الزامی است");
      return;
    }
    if (username.length < 3 || username.length > 30) {
      toast.error("نام کاربری باید بین ۳ تا ۳۰ کاراکتر باشد");
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      toast.error("نام کاربری فقط حروف لاتین، اعداد و زیرخط");
      return;
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("فرمت ایمیل نامعتبر است");
      return;
    }
    if (studentId && !/^\d{4,20}$/.test(studentId)) {
      toast.error("شماره دانشجویی نامعتبر است");
      return;
    }
    setSubmitting(true);
    try {
      await register({ name, username, email: email || undefined, studentId: studentId || undefined, password, role });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-md border-border/60 bg-card/70 backdrop-blur">
        <CardHeader className="items-center text-center">
          <div className="mb-2 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <GraduationCap className="size-7" />
          </div>
          <CardTitle className="text-xl">ثبت نام در فایلامون</CardTitle>
          <CardDescription>اطلاعات خود را وارد کنید</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                نام و نام خانوادگی <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="مثال: علی محمدی"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                نام کاربری <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="my_username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="h-11 rounded-xl"
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">ایمیل (اختیاری)</label>
              <Input
                type="email"
                placeholder="example@university.ac.ir"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 rounded-xl"
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">شماره دانشجویی (اختیاری)</label>
              <Input
                placeholder="۴۰۱۱۲۳۴۵۶۷"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="h-11 rounded-xl"
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                رمز عبور <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="حداقل ۶ کاراکتر"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 rounded-xl pl-10"
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {password && <PasswordStrength password={password} />}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">نقش</label>
              <div className="flex gap-2">
                {ROLES.map((r) => (
                  <Button
                    key={r.value}
                    type="button"
                    variant={role === r.value ? "default" : "outline"}
                    className="flex-1 rounded-xl"
                    onClick={() => setRole(r.value)}
                  >
                    {r.label}
                  </Button>
                ))}
              </div>
            </div>
            <Button type="submit" className="w-full rounded-xl py-6" disabled={submitting}>
              {submitting ? "در حال ثبت نام..." : "ثبت نام"}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm text-muted-foreground">
            قبلاً ثبت نام کرده‌اید؟{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">
              ورود
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
