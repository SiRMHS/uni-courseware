import jwt from "jsonwebtoken";
import { prisma } from "@uni/database";
import { config } from "../config.js";

export async function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "توکن احراز هویت یافت نشد" });
  }

  try {
    const token = header.slice(7);
    const payload = jwt.verify(token, config.jwtSecret);

    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: { id: true, tokenVersion: true },
    });

    const dbVersion = user?.tokenVersion ?? 0;
    const tokenVersion = payload.tokenVersion ?? 0;

    if (!user || dbVersion !== tokenVersion) {
      return res.status(401).json({ error: "نشست نامعتبر است. لطفاً مجدداً وارد شوید" });
    }

    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: "توکن نامعتبر است" });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "دسترسی غیرمجاز" });
    }
    next();
  };
}

export function requirePermission(permissionKey) {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "احراز هویت نشده" });
    }
    try {
      const rolePerm = await prisma.rolePermission.findFirst({
        where: {
          role: req.user.role,
          permission: { key: permissionKey },
        },
      });
      if (!rolePerm) {
        return res.status(403).json({ error: "دسترسی غیرمجاز" });
      }
      next();
    } catch {
      return res.status(500).json({ error: "خطا در بررسی دسترسی" });
    }
  };
}

export function requireAnyPermission(...permissionKeys) {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "احراز هویت نشده" });
    }
    try {
      const rolePerm = await prisma.rolePermission.findFirst({
        where: {
          role: req.user.role,
          permission: { key: { in: permissionKeys } },
        },
      });
      if (!rolePerm) {
        return res.status(403).json({ error: "دسترسی غیرمجاز" });
      }
      next();
    } catch {
      return res.status(500).json({ error: "خطا در بررسی دسترسی" });
    }
  };
}
