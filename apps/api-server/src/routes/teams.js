import { Router } from "express";
import { authenticate, requireRole } from "../middleware/auth.js";
import { prisma } from "@uni/database";

const router = Router();

router.get("/", authenticate, async (req, res) => {
  try {
    const teams = await prisma.team.findMany({
      include: {
        createdBy: { select: { id: true, name: true } },
        members: {
          include: {
            user: { select: { id: true, name: true, username: true, avatar: true, role: true, studentId: true, faculty: true, department: true } },
          },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(teams);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/", authenticate, requireRole("SUPER_ADMIN"), async (req, res) => {
  try {
    const { name, description, story, image } = req.body;
    if (!name) return res.status(400).json({ error: "نام تیم الزامی است" });
    const team = await prisma.team.create({
      data: { name, description, story, image, createdById: req.user.id },
    });
    res.status(201).json(team);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put("/:id", authenticate, requireRole("SUPER_ADMIN"), async (req, res) => {
  try {
    const { name, description, story, image } = req.body;
    const team = await prisma.team.update({
      where: { id: req.params.id },
      data: { ...(name && { name }), ...(description !== undefined && { description }), ...(story !== undefined && { story }), ...(image !== undefined && { image }) },
    });
    res.json(team);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/:id", authenticate, requireRole("SUPER_ADMIN"), async (req, res) => {
  try {
    await prisma.team.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/:id/members", authenticate, requireRole("SUPER_ADMIN"), async (req, res) => {
  try {
    const { userId, role } = req.body;
    if (!userId) return res.status(400).json({ error: "شناسه کاربر الزامی است" });
    const existing = await prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId: req.params.id, userId } },
    });
    if (existing) return res.status(409).json({ error: "این کاربر قبلاً در تیم عضو است" });
    const member = await prisma.teamMember.create({
      data: { teamId: req.params.id, userId, role: role || "member" },
      include: {
        user: { select: { id: true, name: true, username: true, avatar: true, role: true, studentId: true, faculty: true, department: true } },
      },
    });
    res.status(201).json(member);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/:id/members/:memberId", authenticate, requireRole("SUPER_ADMIN"), async (req, res) => {
  try {
    await prisma.teamMember.delete({ where: { id: req.params.memberId } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put("/:id/members/:memberId", authenticate, requireRole("SUPER_ADMIN"), async (req, res) => {
  try {
    const { role } = req.body;
    const member = await prisma.teamMember.update({
      where: { id: req.params.memberId },
      data: { role },
    });
    res.json(member);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
