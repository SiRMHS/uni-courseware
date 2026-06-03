"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Shield,
  ShieldCheck,
  GraduationCap,
  User,
  Save,
  Check,
  X,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { RequirePermission } from "@/components/RequirePermission";

const ICON_MAP = {
  Shield,
  ShieldCheck,
  GraduationCap,
  User,
};

async function fetchPermissions() {
  const res = await fetch("/api/proxy/permissions", {
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });
  if (!res.ok) throw new Error("خطا");
  return res.json();
}

async function fetchRolePermissions() {
  const res = await fetch("/api/proxy/permissions/roles", {
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });
  if (!res.ok) throw new Error("خطا");
  return res.json();
}

async function fetchRoleDefinitions() {
  const res = await fetch("/api/proxy/permissions/role-definitions", {
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });
  if (!res.ok) throw new Error("خطا");
  return res.json();
}

async function saveRolePermissions(role, permissions) {
  const res = await fetch(`/api/proxy/permissions/roles/${role}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
    body: JSON.stringify({ permissions }),
  });
  if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || "خطا"); }
  return res.json();
}

async function createRole(data) {
  const res = await fetch("/api/proxy/permissions/role-definitions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
    body: JSON.stringify(data),
  });
  if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || "خطا"); }
  return res.json();
}

async function deleteRole(slug) {
  const res = await fetch(`/api/proxy/permissions/role-definitions/${slug}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });
  if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || "خطا"); }
  return res.json();
}

export default function RolesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  useEffect(() => {
    if (user && !isSuperAdmin) router.push("/dashboard");
  }, [user, isSuperAdmin, router]);

  const [permissions, setPermissions] = useState([]);
  const [rolePerms, setRolePerms] = useState({});
  const [roleDefs, setRoleDefs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [newRole, setNewRole] = useState({ slug: "", name: "", label: "", icon: "Shield", color: "text-muted-foreground" });

  const load = useCallback(async () => {
    try {
      const [perms, rp, defs] = await Promise.all([
        fetchPermissions(),
        fetchRolePermissions(),
        fetchRoleDefinitions(),
      ]);
      setPermissions(perms);
      setRolePerms(rp);
      setRoleDefs(defs);
      if (defs.length > 0 && !selectedRole) {
        setSelectedRole(defs[0].slug);
      }
    } catch {} finally { setLoading(false); }
  }, [selectedRole]);

  useEffect(() => { load(); }, [load]);

  const grouped = permissions.reduce((acc, p) => {
    if (!acc[p.group]) acc[p.group] = [];
    acc[p.group].push(p);
    return acc;
  }, {});

  const togglePermission = (key) => {
    setRolePerms((prev) => {
      const current = prev[selectedRole] || [];
      const next = current.includes(key)
        ? current.filter((k) => k !== key)
        : [...current, key];
      return { ...prev, [selectedRole]: next };
    });
  };

  const handleSave = async () => {
    setSaving(selectedRole);
    try {
      await saveRolePermissions(selectedRole, rolePerms[selectedRole] || []);
      toast.success("دسترسی‌ها ذخیره شد");
    } catch (err) { toast.error(err.message); }
    finally { setSaving(null); }
  };

  const handleCreateRole = async () => {
    if (!newRole.slug.trim() || !newRole.label.trim()) {
      toast.error("slug و نام نقش الزامی است");
      return;
    }
    try {
      const role = await createRole(newRole);
      setRoleDefs((prev) => [...prev, role]);
      setSelectedRole(role.slug);
      setCreateOpen(false);
      setNewRole({ slug: "", name: "", label: "", icon: "Shield", color: "text-muted-foreground" });
      toast.success("نقش جدید ایجاد شد");
    } catch (err) { toast.error(err.message); }
  };

  const handleDeleteRole = async (slug) => {
    if (!confirm("آیا از حذف این نقش اطمینان دارید؟")) return;
    try {
      await deleteRole(slug);
      setRoleDefs((prev) => prev.filter((r) => r.slug !== slug));
      if (selectedRole === slug) {
        setSelectedRole(roleDefs.find((r) => r.slug !== slug)?.slug || null);
      }
      toast.success("نقش حذف شد");
    } catch (err) { toast.error(err.message); }
  };

  const currentRoleDef = roleDefs.find((r) => r.slug === selectedRole);
  const RoleIcon = ICON_MAP[currentRoleDef?.icon] || Shield;

  return (
    <RequirePermission permissions={["settings.roles"]}>
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">مدیریت رول‌ها و دسترسی‌ها</h1>
          <p className="mt-1 text-sm text-muted-foreground">تعیین دسترسی‌های دقیق برای هر نقش</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2 rounded-xl">
          <Plus className="size-4" />
          رول جدید
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">
            {roleDefs.map((def) => {
              const Icon = ICON_MAP[def.icon] || Shield;
              const isSelected = selectedRole === def.slug;
              return (
                <div
                  key={def.slug}
                  className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all cursor-pointer ${
                    isSelected
                      ? "border-primary/50 bg-primary/10 text-primary shadow-sm"
                      : "border-border/60 bg-card/50 text-muted-foreground hover:bg-accent"
                  }`}
                  onClick={() => setSelectedRole(def.slug)}
                  onKeyDown={(e) => e.key === "Enter" && setSelectedRole(def.slug)}
                  tabIndex={0}
                  role="button"
                >
                  <Icon className={`size-4 ${def.color}`} />
                  {def.label}
                  {!def.isSystem && (
                    <span
                      onClick={(e) => { e.stopPropagation(); handleDeleteRole(def.slug); }}
                      onKeyDown={(e) => e.key === "Enter" && handleDeleteRole(def.slug)}
                      tabIndex={0}
                      role="button"
                      className="mr-1 rounded p-0.5 text-muted-foreground/50 hover:text-destructive cursor-pointer"
                    >
                      <Trash2 className="size-3" />
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {currentRoleDef && (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <RoleIcon className={`size-5 ${currentRoleDef.color}`} />
                  <span className="text-lg font-semibold">{currentRoleDef.label}</span>
                  {currentRoleDef.isSystem && (
                    <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">سیستمی</span>
                  )}
                </div>
                <Button onClick={handleSave} disabled={saving === selectedRole} className="rounded-xl">
                  <Save className="size-4" />
                  {saving === selectedRole ? "در حال ذخیره..." : "ذخیره دسترسی‌ها"}
                </Button>
              </div>

              <div className="space-y-4">
                {Object.entries(grouped).map(([group, perms]) => (
                  <Card key={group} className="border-border/60">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">{group}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {perms.map((perm) => {
                          const enabled = (rolePerms[selectedRole] || []).includes(perm.key);
                          return (
                            <button
                              key={perm.id}
                              type="button"
                              onClick={() => togglePermission(perm.key)}
                              className={`flex items-center gap-3 rounded-xl border p-3 text-right transition-all ${
                                enabled
                                  ? "border-emerald-500/30 bg-emerald-500/5"
                                  : "border-border/40 bg-card/30 hover:bg-accent/40"
                              }`}
                            >
                              <div className={`flex size-6 shrink-0 items-center justify-center rounded-lg ${
                                enabled ? "bg-emerald-500/20 text-emerald-600" : "bg-muted text-muted-foreground"
                              }`}>
                                {enabled ? <Check className="size-3.5" /> : <X className="size-3.5" />}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium">{perm.name}</p>
                                {perm.description && (
                                  <p className="text-xs text-muted-foreground">{perm.description}</p>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>رول جدید</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">شناسه (slug)</label>
              <Input
                value={newRole.slug}
                onChange={(e) => setNewRole((p) => ({ ...p, slug: e.target.value, name: e.target.value }))}
                placeholder="مثال: EDITOR"
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">نام نمایشی</label>
              <Input
                value={newRole.label}
                onChange={(e) => setNewRole((p) => ({ ...p, label: e.target.value }))}
                placeholder="مثال: ویرایشگر"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>انصراف</Button>
            <Button onClick={handleCreateRole}>ایجاد رول</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </RequirePermission>
  );
}
