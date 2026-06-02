"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Settings } from "lucide-react";

export default function FtpSettingsPage() {
  return (
    <div className="space-y-6 text-right">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">تنظیمات FTP</h1>
        <p className="mt-1 text-sm text-muted-foreground">مشاهده تنظیمات اتصال به سرور FTP</p>
      </motion.div>

      <Separator className="bg-border/60" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
      >
        <Card className="border-border/60 bg-card/70 backdrop-blur">
          <CardHeader className="text-right">
            <CardTitle className="flex flex-row-reverse items-center gap-2">
              <Settings className="size-5" />
              اطلاعات اتصال FTP
            </CardTitle>
            <CardDescription>
              تنظیمات اتصال FTP در فایل <span dir="ltr" className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">.env</span> پیکربندی شده‌اند. این مقادیر فقط خواندنی هستند.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">FTP Host</label>
                <Input
                  value={process.env.NEXT_PUBLIC_FTP_HOST || "—"}
                  disabled
                  className="h-11 rounded-xl bg-muted/50"
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">FTP Port</label>
                <Input
                  value={process.env.NEXT_PUBLIC_FTP_PORT || "۲۱"}
                  disabled
                  className="h-11 rounded-xl bg-muted/50"
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">FTP User</label>
                <Input
                  value={process.env.NEXT_PUBLIC_FTP_USER || "—"}
                  disabled
                  className="h-11 rounded-xl bg-muted/50"
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">FTP Password</label>
                <Input
                  type="password"
                  value={process.env.NEXT_PUBLIC_FTP_PASS ? "••••••••" : "—"}
                  disabled
                  className="h-11 rounded-xl bg-muted/50"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-border/60 bg-background/40 p-4 text-sm text-muted-foreground">
              <p>
                این تنظیمات در سرور و از طریق متغیرهای محیطی (<span dir="ltr" className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">.env</span>) اعمال می‌شوند.
                برای تغییر آن‌ها لطفاً با مدیر سیستم تماس بگیرید.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
