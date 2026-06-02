import { Router } from "express";
import { authenticate, requireRole } from "../middleware/auth.js";
import { prisma } from "@uni/database";

const router = Router();

router.get("/", authenticate, async (req, res) => {
  try {
    const isAdmin = ["SUPER_ADMIN", "ADMIN"].includes(req.user.role);
    const where = isAdmin ? {} : { userId: req.user.id };
    if (isAdmin && req.query.departmentId) {
      where.departmentId = req.query.departmentId;
    }
    const tickets = await prisma.ticket.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true } },
        department: true,
        faculty: true,
        assignedTo: { select: { id: true, name: true } },
        _count: { select: { messages: true } },
      },
      orderBy: { updatedAt: "desc" },
    });
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/", authenticate, async (req, res) => {
  try {
    const { title, body, departmentId, facultyId } = req.body;
    if (!title || !body) return res.status(400).json({ error: "title and body required" });
    const ticket = await prisma.ticket.create({
      data: {
        title, body, departmentId, facultyId, userId: req.user.id,
        messages: { create: { body, userId: req.user.id } },
      },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
        messages: {
          include: { user: { select: { id: true, name: true, avatar: true, role: true } } },
        },
      },
    });
    res.status(201).json(ticket);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/:id", authenticate, async (req, res) => {
  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true } },
        department: true,
        faculty: true,
        assignedTo: { select: { id: true, name: true } },
        messages: {
          include: { user: { select: { id: true, name: true, avatar: true, role: true } } },
          orderBy: { createdAt: "asc" },
        },
      },
    });
    if (!ticket) return res.status(404).json({ error: "not found" });
    const isAdmin = ["SUPER_ADMIN", "ADMIN"].includes(req.user.role);
    if (ticket.userId !== req.user.id && !isAdmin) {
      return res.status(403).json({ error: "access denied" });
    }
    res.json(ticket);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/:id/messages", authenticate, async (req, res) => {
  try {
    const ticket = await prisma.ticket.findUnique({ where: { id: req.params.id } });
    if (!ticket) return res.status(404).json({ error: "not found" });
    const isAdmin = ["SUPER_ADMIN", "ADMIN"].includes(req.user.role);
    if (ticket.userId !== req.user.id && !isAdmin) {
      return res.status(403).json({ error: "access denied" });
    }
    const { body } = req.body;
    if (!body) return res.status(400).json({ error: "body required" });
    const message = await prisma.ticketMessage.create({
      data: { body, ticketId: req.params.id, userId: req.user.id },
      include: { user: { select: { id: true, name: true, avatar: true, role: true } } },
    });
    if (isAdmin && ticket.status === "open") {
      await prisma.ticket.update({ where: { id: req.params.id }, data: { status: "answered" } });
    }
    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch("/:id", authenticate, requireRole("SUPER_ADMIN", "ADMIN"), async (req, res) => {
  try {
    const { status, assignedToId } = req.body;
    const ticket = await prisma.ticket.update({
      where: { id: req.params.id },
      data: { ...(status && { status }), ...(assignedToId && { assignedToId }) },
    });
    res.json(ticket);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/:id", authenticate, requireRole("SUPER_ADMIN", "ADMIN"), async (req, res) => {
  try {
    await prisma.ticket.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
