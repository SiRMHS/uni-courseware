import { prisma } from "@uni/database";
import bcrypt from "bcryptjs";

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

function sanitize(str) {
  return str?.trim().replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "") ?? "";
}

function validateEmail(email) {
  if (!email) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function getUserHandler(req, res, next) {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id },
      include: { faculty: true, department: true },
    });
    if (!user) return res.status(404).json({ error: "کاربر یافت نشد" });
    res.json(sanitizeUser(user));
  } catch (err) {
    next(err);
  }
}

export async function listUsersHandler(req, res, next) {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      include: { faculty: true, department: true },
    });
    res.json(users.map(sanitizeUser));
  } catch (err) {
    next(err);
  }
}

export async function createUserHandler(req, res, next) {
  try {
    let { name, username, email, studentId, password, role, facultyId, departmentId } = req.body;

    name = sanitize(name);
    username = sanitize(username)?.toLowerCase();
    email = sanitize(email);
    studentId = sanitize(studentId);

    if (!name || !password) {
      return res.status(400).json({ error: "نام و رمز عبور الزامی است" });
    }

    if (username) {
      if (username.length < 3 || username.length > 30) {
        return res.status(400).json({ error: "نام کاربری باید بین ۳ تا ۳۰ کاراکتر باشد" });
      }
      if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        return res.status(400).json({ error: "نام کاربری فقط حروف لاتین، اعداد و زیرخط" });
      }
      const existing = await prisma.user.findUnique({ where: { username } });
      if (existing) return res.status(409).json({ error: "این نام کاربری قبلاً ثبت شده است" });
    }

    if (email) {
      if (!validateEmail(email)) {
        return res.status(400).json({ error: "فرمت ایمیل نامعتبر است" });
      }
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) return res.status(409).json({ error: "این ایمیل قبلاً ثبت شده است" });
    }

    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
      return res.status(400).json({ error: `رمز عبور باید شامل: ${passwordErrors.join("، ")} باشد` });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        ...(username && { username }),
        ...(email && { email }),
        ...(studentId && { studentId }),
        password: hashedPassword,
        role: role ?? "STUDENT",
        ...(facultyId && { facultyId }),
        ...(departmentId && { departmentId }),
      },
    });

    res.status(201).json(sanitizeUser(user));
  } catch (err) {
    next(err);
  }
}

export async function updateUserHandler(req, res, next) {
  try {
    const { id } = req.params;
    let { name, username, email, studentId, badge, password, role, facultyId, departmentId } = req.body;

    const data = {};
    if (name !== undefined) data.name = sanitize(name);

    if (username !== undefined) {
      const cleaned = sanitize(username).toLowerCase();
      if (cleaned && (cleaned.length < 3 || cleaned.length > 30)) {
        return res.status(400).json({ error: "نام کاربری باید بین ۳ تا ۳۰ کاراکتر باشد" });
      }
      if (cleaned && !/^[a-zA-Z0-9_]+$/.test(cleaned)) {
        return res.status(400).json({ error: "نام کاربری فقط حروف لاتین، اعداد و زیرخط" });
      }
      if (cleaned) {
        const existing = await prisma.user.findFirst({
          where: { username: cleaned, NOT: { id } },
        });
        if (existing) return res.status(409).json({ error: "این نام کاربری قبلاً استفاده شده است" });
        data.username = cleaned;
      } else {
        data.username = null;
      }
    }

    if (email !== undefined) {
      if (email && !validateEmail(email)) {
        return res.status(400).json({ error: "فرمت ایمیل نامعتبر است" });
      }
      if (email) {
        const existing = await prisma.user.findFirst({
          where: { email, NOT: { id } },
        });
        if (existing) return res.status(409).json({ error: "این ایمیل قبلاً استفاده شده است" });
        data.email = email;
      } else {
        data.email = null;
      }
    }

    if (password) {
      const passwordErrors = validatePassword(password);
      if (passwordErrors.length > 0) {
        return res.status(400).json({ error: `رمز عبور باید شامل: ${passwordErrors.join("، ")} باشد` });
      }
      data.password = await bcrypt.hash(password, 12);
      data.tokenVersion = { increment: 1 };
    }

    if (studentId !== undefined) data.studentId = sanitize(studentId);
    if (badge !== undefined) data.badge = badge || null;
    if (role) data.role = role;
    if (facultyId !== undefined) data.facultyId = facultyId || null;
    if (departmentId !== undefined) data.departmentId = departmentId || null;

    const user = await prisma.user.update({
      where: { id },
      data,
    });

    res.json(sanitizeUser(user));
  } catch (err) {
    next(err);
  }
}

export async function deleteUserHandler(req, res, next) {
  try {
    const { id } = req.params;
    await prisma.user.delete({ where: { id } });
    res.json({ message: "کاربر با موفقیت حذف شد" });
  } catch (err) {
    next(err);
  }
}
