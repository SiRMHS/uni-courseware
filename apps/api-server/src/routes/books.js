import { Readable } from "node:stream";
import path from "node:path";
import multer from "multer";
import { prisma } from "@uni/database";
import { createFtpClient, resolveFtpPath, FTP_ROOT, buildPublicFileUrl } from "../services/ftpOperations.js";

export const upload = multer({ storage: multer.memoryStorage() });

// ── Categories ──

export async function getCategoriesHandler(req, res, next) {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
      include: { children: { orderBy: { name: "asc" } } },
    });
    const flat = categories.filter((c) => !c.parentId).map((c) => ({
      ...c,
      children: c.children || [],
    }));
    res.json(flat);
  } catch (err) { next(err); }
}

export async function createCategoryHandler(req, res, next) {
  try {
    const { name, slug, parentId } = req.body;
    if (!name || !slug) return res.status(400).json({ error: "نام و اسلاگ الزامی است" });
    const existing = await prisma.category.findUnique({ where: { slug } });
    if (existing) return res.status(409).json({ error: "این اسلاگ قبلاً استفاده شده است" });
    const data = { name, slug };
    if (parentId) {
      const parent = await prisma.category.findUnique({ where: { id: parentId } });
      if (!parent) return res.status(400).json({ error: "دسته‌بندی والد یافت نشد" });
      data.parentId = parentId;
    }
    const category = await prisma.category.create({ data, include: { children: true } });
    res.status(201).json(category);
  } catch (err) { next(err); }
}

export async function updateCategoryHandler(req, res, next) {
  try {
    const { slug } = req.params;
    const { name, parentId } = req.body;
    const data = {};
    if (name !== undefined) data.name = name;
    if (parentId !== undefined) {
      if (parentId) {
        const parent = await prisma.category.findUnique({ where: { id: parentId } });
        if (!parent) return res.status(400).json({ error: "دسته‌بندی والد یافت نشد" });
      }
      data.parentId = parentId || null;
    }
    const category = await prisma.category.update({
      where: { slug },
      data,
      include: { children: true },
    });
    res.json(category);
  } catch (err) { next(err); }
}

export async function deleteCategoryHandler(req, res, next) {
  try {
    const { slug } = req.params;
    const cat = await prisma.category.findUnique({ where: { slug }, include: { children: true } });
    if (!cat) return res.status(404).json({ error: "دسته‌بندی یافت نشد" });
    if (cat.children?.length > 0) {
      return res.status(400).json({ error: "این دسته‌بندی دارای زیردسته است. ابتدا زیردسته‌ها را حذف کنید." });
    }
    await prisma.category.delete({ where: { slug } });
    res.json({ message: "دسته‌بندی با موفقیت حذف شد" });
  } catch (err) { next(err); }
}

// ── Books ──

export async function getBooksHandler(req, res, next) {
  try {
    const books = await prisma.book.findMany({
      include: {
        category: true,
        faculty: true,
        department: true,
        course: true,
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(books);
  } catch (err) { next(err); }
}

export async function getBookHandler(req, res, next) {
  try {
    const { slug } = req.params;
    const book = await prisma.book.findUnique({
      where: { slug },
      include: {
        category: true,
        faculty: true,
        department: true,
        course: true,
      },
    });
    if (!book) return res.status(404).json({ error: "کتاب یافت نشد" });
    res.json(book);
  } catch (err) { next(err); }
}

export async function createBookHandler(req, res, next) {
  try {
    const { title, slug, author, description, image, fileUrl, categoryId, facultyId, departmentId, ftpPath, courseId } = req.body;
    if (!title || !slug) return res.status(400).json({ error: "عنوان و اسلاگ الزامی است" });
    const existing = await prisma.book.findUnique({ where: { slug } });
    if (existing) return res.status(409).json({ error: "این اسلاگ قبلاً استفاده شده است" });

    let resolvedFileUrl = fileUrl;
    let resolvedFtpPath = ftpPath || null;

    if (req.file) {
      const client = await createFtpClient();
      try {
        const timestamp = Date.now();
        const safeFilename = `${timestamp}_${req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
        const remoteFilePath = path.posix.join(`/books/${slug}`, safeFilename);
        await client.ensureDir(`${FTP_ROOT}/books/${slug}`);
        await client.uploadFrom(Readable.from(req.file.buffer), resolveFtpPath(remoteFilePath));
        resolvedFileUrl = await buildPublicFileUrl(remoteFilePath);
        resolvedFtpPath = `/books/${slug}`;
      } finally {
        client.close();
      }
    }

    const book = await prisma.book.create({
      data: { title, slug, author, description, image, fileUrl: resolvedFileUrl, ftpPath: resolvedFtpPath, categoryId, facultyId, departmentId, courseId: courseId || null, createdById: req.user?.id },
      include: { category: true, faculty: true, department: true, course: true },
    });

    if (!req.file && !ftpPath) {
      try {
        const client = await createFtpClient();
        try {
          const bookFtpPath = `${FTP_ROOT}/books/${slug}`;
          await client.ensureDir(bookFtpPath);
          await prisma.book.update({
            where: { id: book.id },
            data: { ftpPath: `/books/${slug}` },
          });
          book.ftpPath = `/books/${slug}`;
        } finally {
          client.close();
        }
      } catch (err) {
        console.warn(`[books] Failed to create FTP folder: ${err.message}`);
      }
    }

    res.status(201).json(book);
  } catch (err) { next(err); }
}

export async function updateBookHandler(req, res, next) {
  try {
    const { slug } = req.params;
    const { title, author, description, image, fileUrl, categoryId, facultyId, departmentId, ftpPath, courseId } = req.body;
    const data = {};
    if (title) data.title = title;
    if (author !== undefined) data.author = author;
    if (description !== undefined) data.description = description;
    if (image !== undefined) data.image = image;
    if (fileUrl !== undefined) data.fileUrl = fileUrl;
    if (categoryId !== undefined) data.categoryId = categoryId;
    if (facultyId !== undefined) data.facultyId = facultyId;
    if (departmentId !== undefined) data.departmentId = departmentId;
    if (ftpPath !== undefined) data.ftpPath = ftpPath;
    if (courseId !== undefined) data.courseId = courseId;
    data.updatedById = req.user?.id;

    if (req.file) {
      const client = await createFtpClient();
      try {
        const timestamp = Date.now();
        const safeFilename = `${timestamp}_${req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
        const remoteFilePath = path.posix.join(`/books/${slug}`, safeFilename);
        await client.ensureDir(`${FTP_ROOT}/books/${slug}`);
        await client.uploadFrom(Readable.from(req.file.buffer), resolveFtpPath(remoteFilePath));
        data.fileUrl = await buildPublicFileUrl(remoteFilePath);
        data.ftpPath = `/books/${slug}`;
      } finally {
        client.close();
      }
    }

    const book = await prisma.book.update({
      where: { slug },
      data,
      include: { category: true, faculty: true, department: true, course: true },
    });

    if (book.ftpPath) {
      try {
        const client = await createFtpClient();
        try {
          await client.ensureDir(resolveFtpPath(book.ftpPath));
        } finally {
          client.close();
        }
      } catch (err) {
        console.warn(`[books] Failed to create FTP folder: ${err.message}`);
      }
    }

    res.json(book);
  } catch (err) { next(err); }
}

export async function deleteBookHandler(req, res, next) {
  try {
    const { slug } = req.params;
    await prisma.book.delete({ where: { slug } });
    res.json({ message: "کتاب با موفقیت حذف شد" });
  } catch (err) { next(err); }
}
