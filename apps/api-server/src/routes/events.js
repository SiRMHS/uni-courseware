import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { prisma } from "@uni/database";

const router = Router();

router.get("/", authenticate, async (req, res) => {
  try {
    const events = await prisma.calendarEvent.findMany({
      where: { userId: req.user.id },
      orderBy: { date: "asc" },
    });
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/", authenticate, async (req, res) => {
  try {
    const { title, date } = req.body;
    if (!title || !date) return res.status(400).json({ error: "title and date required" });
    const event = await prisma.calendarEvent.create({
      data: { title, date, userId: req.user.id },
    });
    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put("/:id", authenticate, async (req, res) => {
  try {
    const { title, date } = req.body;
    const event = await prisma.calendarEvent.findUnique({ where: { id: req.params.id } });
    if (!event) return res.status(404).json({ error: "not found" });
    if (event.userId !== req.user.id) return res.status(403).json({ error: "access denied" });
    const updated = await prisma.calendarEvent.update({
      where: { id: req.params.id },
      data: { ...(title && { title }), ...(date && { date }) },
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/:id", authenticate, async (req, res) => {
  try {
    const event = await prisma.calendarEvent.findUnique({ where: { id: req.params.id } });
    if (!event) return res.status(404).json({ error: "not found" });
    if (event.userId !== req.user.id) return res.status(403).json({ error: "access denied" });
    await prisma.calendarEvent.delete({ where: { id: req.params.id } });
    res.json({ message: "deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
