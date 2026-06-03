"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isEmail = email.includes("@");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("ایمیل/نام کاربری و رمز عبور را وارد کنید");
      return;
    }
    setSubmitting(true);
    try {
      if (isEmail) {
        await login({ email, password });
      } else {
        await login({ username: email, password });
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="w-full max-w-md space-y-4">
        <Card className="border-border/60 bg-card/70 backdrop-blur">
          <CardHeader className="items-center text-center">
            <div className="mb-2 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <GraduationCap className="size-7" />
            </div>
            <CardTitle className="text-xl">ورود به سامانه</CardTitle>
            <CardDescription>ایمیل و رمز عبور خود را وارد کنید</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">ایمیل یا نام کاربری</label>
                <Input
                  type="text"
                  placeholder="example@filamoon.ir"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 rounded-xl"
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">رمز عبور</label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
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
              </div>
              <Button type="submit" className="w-full rounded-xl py-6" disabled={submitting}>
                {submitting ? "در حال ورود..." : "ورود"}
              </Button>
            </form>
            <div className="mt-4 text-center text-sm text-muted-foreground">
              حساب کاربری ندارید؟{" "}
              <Link href="/register" className="font-medium text-primary hover:underline">
                ثبت نام
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="rounded-xl border border-border/40 bg-card/40 p-4 text-center text-sm text-muted-foreground backdrop-blur">
          خوشحال میشم حسابتو تو سایت جدیدمونم بسازی
        </div>
      </div>
    </div>
  );
}
