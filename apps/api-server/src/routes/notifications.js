import { Router } from "express";
import { authenticate, requireRole, requirePermission } from "../middleware/auth.js";
import { prisma } from "@uni/database";

const router = Router();

router.get("/", authenticate, async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/", authenticate, requirePermission("notifications.create"), async (req, res) => {
  try {
    const { title, body, link } = req.body;
    if (!title) return res.status(400).json({ error: "title is required" });
    const notification = await prisma.notification.create({
      data: { title, body, link },
    });
    res.status(201).json(notification);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/:id", authenticate, requirePermission("notifications.delete"), async (req, res) => {
  try {
    await prisma.notification.delete({ where: { id: req.params.id } });
    res.json({ message: "deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
