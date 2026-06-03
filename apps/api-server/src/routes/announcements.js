import { Router } from "express";
import { authenticate, requireRole, requirePermission } from "../middleware/auth.js";
import { prisma } from "@uni/database";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const announcements = await prisma.announcement.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(announcements);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/published", async (req, res) => {
  try {
    const announcements = await prisma.announcement.findMany({
      where: { published: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(announcements);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/", authenticate, requirePermission("announcements.create"), async (req, res) => {
  try {
    const { title, body, published } = req.body;
    if (!title) return res.status(400).json({ error: "title required" });
    const announcement = await prisma.announcement.create({
      data: { title, body, published: published ?? false },
    });
    res.status(201).json(announcement);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put("/:id", authenticate, requirePermission("announcements.edit"), async (req, res) => {
  try {
    const { title, body, published } = req.body;
    const data = {};
    if (title !== undefined) data.title = title;
    if (body !== undefined) data.body = body;
    if (published !== undefined) data.published = published;
    const announcement = await prisma.announcement.update({
      where: { id: req.params.id },
      data,
    });
    res.json(announcement);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/:id", authenticate, requirePermission("announcements.delete"), async (req, res) => {
  try {
    await prisma.announcement.delete({ where: { id: req.params.id } });
    res.json({ message: "deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
