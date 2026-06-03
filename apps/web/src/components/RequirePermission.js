"use client";

import { usePermissions } from "@/lib/usePermissions";
import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

export function RequirePermission({ permissions = [], children, fallback }) {
  const { perms, loading } = usePermissions();

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
      </div>
    );
  }

  const hasAccess = permissions.length === 0 || permissions.some((p) => perms.includes(p));

  if (!hasAccess) {
    if (fallback) return fallback;
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-4">
        <Card className="max-w-md border-destructive/20">
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10">
              <Shield className="size-8 text-destructive" />
            </div>
            <h2 className="text-xl font-bold">دسترسی غیرمجاز</h2>
            <p className="text-sm text-muted-foreground">شما مجوز دسترسی به این صفحه را ندارید. لطفاً با مدیر سامانه تماس بگیرید.</p>
            <Button asChild variant="outline" className="rounded-xl mt-2">
              <Link href="/dashboard">بازگشت به داشبورد</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return children;
}
