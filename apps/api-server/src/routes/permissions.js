import { Router } from "express";
import { authenticate, requireRole } from "../middleware/auth.js";
import { prisma } from "@uni/database";

const router = Router();

router.get("/", authenticate, requireRole("SUPER_ADMIN", "ADMIN"), async (req, res) => {
  try {
    const permissions = await prisma.permission.findMany({ orderBy: [{ group: "asc" }, { name: "asc" }] });
    res.json(permissions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/roles", authenticate, async (req, res) => {
  try {
    const rolePermissions = await prisma.rolePermission.findMany({
      include: { permission: true },
    });
    const grouped = {};
    for (const rp of rolePermissions) {
      if (!grouped[rp.role]) grouped[rp.role] = [];
      grouped[rp.role].push(rp.permission.key);
    }
    res.json(grouped);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/role-definitions", authenticate, async (req, res) => {
  try {
    const roles = await prisma.roleDefinition.findMany({
      orderBy: { sortOrder: "asc" },
    });
    res.json(roles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/role-definitions", authenticate, requireRole("SUPER_ADMIN"), async (req, res) => {
  try {
    const { slug, name, label, icon, color } = req.body;
    if (!slug || !name || !label) {
      return res.status(400).json({ error: "slug, name, label required" });
    }
    const role = await prisma.roleDefinition.create({
      data: {
        slug,
        name,
        label,
        icon: icon || "Shield",
        color: color || "text-muted-foreground",
        isSystem: false,
        sortOrder: 999,
      },
    });
    res.status(201).json(role);
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({ error: "این slug قبلاً وجود دارد" });
    }
    res.status(500).json({ error: error.message });
  }
});

router.delete("/role-definitions/:slug", authenticate, requireRole("SUPER_ADMIN"), async (req, res) => {
  try {
    const { slug } = req.params;
    const role = await prisma.roleDefinition.findUnique({ where: { slug } });
    if (!role) return res.status(404).json({ error: "نقش یافت نشد" });
    if (role.isSystem) return res.status(403).json({ error: "نقش سیستمی قابل حذف نیست" });
    await prisma.rolePermission.deleteMany({ where: { role: slug } });
    await prisma.user.updateMany({ where: { role: slug }, data: { role: "STUDENT" } });
    await prisma.roleDefinition.delete({ where: { slug } });
    res.json({ message: "نقش حذف و کاربران به دانشجو تغییر یافتند" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put("/roles/:role", authenticate, requireRole("SUPER_ADMIN"), async (req, res) => {
  try {
    const { role } = req.params;
    const { permissions } = req.body;
    const roleDef = await prisma.roleDefinition.findUnique({ where: { slug: role } });
    if (!roleDef) {
      return res.status(400).json({ error: "نقش نامعتبر است" });
    }
    await prisma.rolePermission.deleteMany({ where: { role } });
    if (Array.isArray(permissions)) {
      for (const key of permissions) {
        const perm = await prisma.permission.findUnique({ where: { key } });
        if (perm) {
          await prisma.rolePermission.create({
            data: { role, permissionId: perm.id },
          });
        }
      }
    }
    res.json({ message: "دسترسی‌ها بروزرسانی شد" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
