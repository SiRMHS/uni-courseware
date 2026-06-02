import { prisma } from "@uni/database";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { config } from "../config.js";

function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, tokenVersion: user.tokenVersion ?? 0 },
    config.jwtSecret,
    { expiresIn: "7d" }
  );
}

function sanitizeUser(user) {
  const { password, ...rest } = user;
  return rest;
}

function validatePassword(password) {
  const errors = [];
  if (!password || password.length < 6) errors.push("حداقل ۶ کاراکتر");
  if (!/[a-z]/.test(password)) errors.push("حداقل یک حرف کوچک لاتین");
  if (!/[A-Z]/.test(password)) errors.push("حداقل یک حرف بزرگ لاتین");
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(password)) errors.push("حداقل یک کاراکتر خاص");
  return errors;
}

function validateEmail(email) {
  if (!email) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function sanitize(str) {
  return str?.trim().replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "") ?? "";
}

export async function registerHandler(req, res, next) {
  try {
    let { name, username, email, studentId, password, role } = req.body;

    name = sanitize(name);
    username = sanitize(username)?.toLowerCase();
    email = sanitize(email);
    studentId = sanitize(studentId);

    if (!name || !username || !password) {
      return res.status(400).json({ error: "نام، نام کاربری و رمز عبور الزامی است" });
    }

    if (username.length < 3 || username.length > 30) {
      return res.status(400).json({ error: "نام کاربری باید بین ۳ تا ۳۰ کاراکتر باشد" });
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return res.status(400).json({ error: "نام کاربری فقط می‌تواند شامل حروف لاتین، اعداد و زیرخط باشد" });
    }

    if (email && !validateEmail(email)) {
      return res.status(400).json({ error: "فرمت ایمیل نامعتبر است" });
    }

    if (studentId && !/^\d{4,20}$/.test(studentId)) {
      return res.status(400).json({ error: "شماره دانشجویی نامعتبر است" });
    }

    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
      return res.status(400).json({ error: `رمز عبور باید شامل: ${passwordErrors.join("، ")} باشد` });
    }

    const existingUsername = await prisma.user.findUnique({ where: { username } });
    if (existingUsername) {
      return res.status(409).json({ error: "این نام کاربری قبلاً ثبت شده است" });
    }

    if (email) {
      const existingEmail = await prisma.user.findUnique({ where: { email } });
      if (existingEmail) {
        return res.status(409).json({ error: "این ایمیل قبلاً ثبت شده است" });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        username,
        ...(email && { email }),
        ...(studentId && { studentId }),
        password: hashedPassword,
        role: role ?? "STUDENT",
      },
    });

    const token = generateToken(user);

    res.status(201).json({ user: sanitizeUser(user), token });
  } catch (err) {
    next(err);
  }
}

export async function loginHandler(req, res, next) {
  try {
    let { email, username, password } = req.body;
    const identifier = sanitize(email || username);

    if (!identifier || !password) {
      return res.status(400).json({ error: "نام کاربری/ایمیل و رمز عبور الزامی است" });
    }

    let user = await prisma.user.findUnique({ where: { email: identifier } });
    if (!user) {
      user = await prisma.user.findUnique({ where: { username: identifier.toLowerCase() } });
    }
    if (!user) {
      return res.status(401).json({ error: "کاربری با این مشخصات یافت نشد. اگر با ایمیل ثبت نام کرده‌اید از ایمیل استفاده کنید" });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: "رمز عبور اشتباه است. دقت کنید رمز شامل حروف کوچک و بزرگ لاتین و کاراکتر خاص است" });
    }

    const token = generateToken(user);

    res.json({ user: sanitizeUser(user), token });
  } catch (err) {
    next(err);
  }
}

export async function meHandler(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { faculty: true, department: true },
    });

    if (!user) {
      return res.status(404).json({ error: "کاربر یافت نشد" });
    }

    res.json({ user: sanitizeUser(user) });
  } catch (err) {
    next(err);
  }
}

export async function updateProfileHandler(req, res, next) {
  try {
    let { name, username, email, studentId, avatar, theme, facultyId, departmentId } = req.body;

    const data = {};
    if (name !== undefined) data.name = sanitize(name);
    if (email !== undefined) {
      const cleaned = sanitize(email);
      if (cleaned && !validateEmail(cleaned)) {
        return res.status(400).json({ error: "فرمت ایمیل نامعتبر است" });
      }
      if (cleaned) {
        const existing = await prisma.user.findFirst({
          where: { email: cleaned, NOT: { id: req.user.id } },
        });
        if (existing) return res.status(409).json({ error: "این ایمیل قبلاً استفاده شده است" });
        data.email = cleaned;
      } else {
        data.email = null;
      }
    }
    if (username !== undefined) {
      const cleaned = sanitize(username).toLowerCase();
      if (cleaned.length < 3 || cleaned.length > 30) {
        return res.status(400).json({ error: "نام کاربری باید بین ۳ تا ۳۰ کاراکتر باشد" });
      }
      if (!/^[a-zA-Z0-9_]+$/.test(cleaned)) {
        return res.status(400).json({ error: "نام کاربری فقط می‌تواند شامل حروف لاتین، اعداد و زیرخط باشد" });
      }
      const existing = await prisma.user.findFirst({
        where: { username: cleaned, NOT: { id: req.user.id } },
      });
      if (existing) return res.status(409).json({ error: "این نام کاربری قبلاً استفاده شده است" });
      data.username = cleaned;
    }
    if (studentId !== undefined) data.studentId = sanitize(studentId);
    if (avatar !== undefined) data.avatar = avatar;
    if (theme !== undefined) data.theme = theme;
    if (facultyId !== undefined) data.facultyId = facultyId || null;
    if (departmentId !== undefined) data.departmentId = departmentId || null;

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data,
    });

    res.json({ user: sanitizeUser(user) });
  } catch (err) {
    next(err);
  }
}

export async function changePasswordHandler(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "رمز فعلی و رمز جدید الزامی است" });
    }

    const passwordErrors = validatePassword(newPassword);
    if (passwordErrors.length > 0) {
      return res.status(400).json({ error: `رمز عبور جدید باید شامل: ${passwordErrors.join("، ")} باشد` });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ error: "کاربر یافت نشد" });

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return res.status(401).json({ error: "رمز عبور فعلی اشتباه است" });

    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashed, tokenVersion: { increment: 1 } },
    });

    res.json({ message: "رمز عبور با موفقیت تغییر کرد" });
  } catch (err) {
    next(err);
  }
}
