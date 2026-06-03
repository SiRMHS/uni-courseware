import { Router } from "express";
import { authenticate, requireRole } from "../middleware/auth.js";
import { prisma } from "@uni/database";

const router = Router();

router.post("/", authenticate, async (req, res) => {
  try {
    const { action, target, targetUrl, metadata } = req.body;
    if (!action) return res.status(400).json({ error: "action required" });
    const activity = await prisma.userActivity.create({
      data: { userId: req.user.id, action, target, targetUrl, metadata },
    });
    res.status(201).json(activity);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/user/:userId", authenticate, requireRole("SUPER_ADMIN", "ADMIN"), async (req, res) => {
  try {
    const activities = await prisma.userActivity.findMany({
      where: { userId: req.params.userId },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    res.json(activities);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/me", authenticate, async (req, res) => {
  try {
    const activities = await prisma.userActivity.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    res.json(activities);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/all", authenticate, requireRole("SUPER_ADMIN"), async (req, res) => {
  try {
    const { search, action: actionFilter, startDate, endDate, page = "1", limit = "20" } = req.query;
    const skip = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);

    const where = {};
    if (search) {
      where.user = { OR: [{ name: { contains: search, mode: "insensitive" } }, { username: { contains: search, mode: "insensitive" } }] };
    }
    if (actionFilter) {
      where.action = actionFilter;
    }
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [total, activities] = await Promise.all([
      prisma.userActivity.count({ where }),
      prisma.userActivity.findMany({
        where,
        include: { user: { select: { id: true, name: true, username: true, avatar: true } } },
        orderBy: { createdAt: "desc" },
        skip,
        take: Math.min(parseInt(limit), 100),
      }),
    ]);

    const stats = await prisma.userActivity.groupBy({
      by: ["action"],
      _count: true,
      orderBy: { _count: { action: "desc" } },
    });

    const totalUsers = await prisma.userActivity.groupBy({
      by: ["userId"],
      _count: { userId: true },
    });

    res.json({
      activities,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) },
      stats: stats.map((s) => ({ action: s.action, count: s._count })),
      activeUsers: totalUsers.length,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
