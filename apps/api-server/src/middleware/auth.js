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
