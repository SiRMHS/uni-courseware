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

export default router;
