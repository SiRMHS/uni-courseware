import { Router } from "express";
import path from "node:path";
import { Readable } from "node:stream";
import multer from "multer";
import { authenticate, requireRole } from "../middleware/auth.js";
import { createFtpClient, buildPublicFileUrl, resolveFtpPath } from "../services/ftpOperations.js";
import { prisma } from "@uni/database";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// GET /api/ftp/list?path=/absolute/remote/path - For file manager
router.get("/list", authenticate, async (req, res) => {
  try {
    const remotePath = resolveFtpPath(req.query.path || "/");
    const client = await createFtpClient();
    try {
      const entries = await client.list(remotePath);
      const mapped = await Promise.all(
        entries.map(async (item) => ({
          name: item.name,
          isDirectory: item.isDirectory === true || item.type === 2,
          size: item.size || 0,
          modifiedAt: item.modifiedAt || item.rawModifiedAt || null,
          remotePath: path.posix.join(remotePath, item.name),
          targetUrl: await buildPublicFileUrl(path.posix.join(remotePath, item.name)),
        }))
      );
      res.json({ entries: mapped });
    } finally {
      client.close();
    }
  } catch (error) {
    console.error("list error:", error);
    res.status(500).json({ message: error.message || "خطا در خواندن محتویات FTP" });
  }
});

// GET /api/ftp/media - List media files with permissions
router.get("/media", authenticate, async (req, res) => {
  try {
    const { folder = "/filamoon_uploads", search, type } = req.query;
    const isAdmin = ["SUPER_ADMIN", "ADMIN"].includes(req.user.role);

    const where = {
      folder: folder,
      ...(search && {
        OR: [
          { filename: { contains: search, mode: "insensitive" } },
          { originalName: { contains: search, mode: "insensitive" } },
        ],
      }),
      ...(type && { mimeType: { startsWith: type } }),
      ...(!isAdmin && { userId: req.user.id }),
    };

    const files = await prisma.fileMedia.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    res.json(files);
  } catch (error) {
    console.error("media list error:", error);
    res.status(500).json({ message: error.message || "خطا در دریافت لیست فایل‌ها" });
  }
});

// GET /api/ftp/media/all - List all media (admin only)
router.get("/media/all", authenticate, requireRole("SUPER_ADMIN", "ADMIN"), async (req, res) => {
  try {
    const { folder, search, type, userId } = req.query;

    const where = {
      ...(folder && { folder }),
      ...(search && {
        OR: [
          { filename: { contains: search, mode: "insensitive" } },
          { originalName: { contains: search, mode: "insensitive" } },
        ],
      }),
      ...(type && { mimeType: { startsWith: type } }),
      ...(userId && { userId }),
    };

    const files = await prisma.fileMedia.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    res.json(files);
  } catch (error) {
    console.error("media all error:", error);
    res.status(500).json({ message: error.message || "خطا در دریافت لیست فایل‌ها" });
  }
});

// GET /api/ftp/list-remote?path=/absolute/remote/path
router.get("/list-remote", authenticate, async (req, res) => {
  try {
    const remotePath = resolveFtpPath(req.query.path || "");
    if (!remotePath) return res.status(400).json({ message: "مسیر FTP معتبر نیست" });

    const client = await createFtpClient();
    try {
      const entries = await client.list(remotePath);
      const mapped = await Promise.all(
        entries.map(async (item) => ({
          name: item.name,
          isDirectory: item.isDirectory === true || item.type === 2,
          size: item.size || 0,
          mtime: item.modifiedAt || item.rawModifiedAt || null,
          remotePath: path.posix.join(remotePath, item.name),
          targetUrl: await buildPublicFileUrl(path.posix.join(remotePath, item.name)),
        }))
      );
      res.json(mapped);
    } finally {
      client.close();
    }
  } catch (error) {
    console.error("list-remote error:", error);
    res.status(500).json({ message: error.message || "خطا در خواندن محتویات FTP" });
  }
});

// POST /api/ftp/upload?path=/remote/path&folder=/filamoon_uploads
router.post("/upload", authenticate, upload.single("file"), async (req, res) => {
  try {
    const rawPath = req.query.path || "";
    const targetPath = rawPath ? resolveFtpPath(rawPath) : resolveFtpPath("/filamoon_uploads");
    const folder = req.query.folder || "/filamoon_uploads/general";
    if (!req.file) return res.status(400).json({ message: "فایل ارسال نشده است" });

    const client = await createFtpClient();
    const timestamp = Date.now();
    const safeFilename = `${timestamp}_${req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const remoteFilePath = path.posix.join(targetPath, safeFilename);

    try {
      await client.ensureDir(targetPath);
      await client.uploadFrom(Readable.from(req.file.buffer), remoteFilePath);
    } finally {
      client.close();
    }

    // Save file metadata to database
    const fileMedia = await prisma.fileMedia.create({
      data: {
        filename: safeFilename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        ftpPath: remoteFilePath,
        publicUrl: await buildPublicFileUrl(remoteFilePath),
        userId: req.user.id,
        folder: folder,
        isPublic: ["SUPER_ADMIN", "ADMIN"].includes(req.user.role),
      },
    });

    res.json({
      message: "فایل با موفقیت آپلود شد",
      remotePath: remoteFilePath,
      publicUrl: await buildPublicFileUrl(remoteFilePath),
      file: fileMedia,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ message: error.message || "خطا در آپلود فایل" });
  }
});

// POST /api/ftp/mkdir
router.post("/mkdir", authenticate, async (req, res) => {
  try {
    const targetPath = resolveFtpPath(req.body.path || "/");
    const folderName = String(req.body.name || "").trim();
    if (!folderName) return res.status(400).json({ message: "نام پوشه الزامی است" });

    const remoteFolderPath = path.posix.join(targetPath, folderName);
    const client = await createFtpClient();
    try {
      await client.ensureDir(remoteFolderPath);
    } finally {
      client.close();
    }

    res.json({ message: "پوشه ساخته شد", remotePath: remoteFolderPath });
  } catch (error) {
    console.error("Mkdir error:", error);
    res.status(500).json({ message: error.message || "خطا در ساخت پوشه" });
  }
});

// POST /api/ftp/delete (also handles DELETE for REST compliance)
router.post("/delete", authenticate, async (req, res) => {
  try {
    const remotePath = resolveFtpPath(req.body.path || req.query.path || "");
    const fileId = req.body.fileId || req.query.fileId;
    if (!remotePath) return res.status(400).json({ message: "مسیر آیتم لازم است" });

    const isAdmin = ["SUPER_ADMIN", "ADMIN"].includes(req.user.role);

    // Check permissions if file is tracked in database
    if (fileId) {
      const fileRecord = await prisma.fileMedia.findUnique({
        where: { id: fileId },
      });
      if (fileRecord && !isAdmin && fileRecord.userId !== req.user.id) {
        return res.status(403).json({ message: "شما دسترسی حذف این فایل را ندارید" });
      }
    }

    const client = await createFtpClient();
    try {
      let isDirectory = false;
      try {
        const parentPath = path.posix.dirname(remotePath);
        const itemName = path.posix.basename(remotePath);
        const siblings = await client.list(parentPath);
        isDirectory = siblings.some((s) => s.name === itemName && (s.isDirectory || s.type === 2));
      } catch {
        // assume file
      }

      if (isDirectory) {
        await client.removeDir(remotePath);
      } else {
        await client.remove(remotePath);
      }
    } finally {
      client.close();
    }

    // Delete from database if tracked
    if (fileId) {
      await prisma.fileMedia.delete({ where: { id: fileId } }).catch(() => {
        // Ignore if not found
      });
    } else {
      // Try to delete by ftpPath
      await prisma.fileMedia.deleteMany({ where: { ftpPath: remotePath } }).catch(() => {
        // Ignore errors
      });
    }

    res.json({ message: "آیتم از FTP حذف شد" });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ message: error.message || "خطا در حذف آیتم" });
  }
});

// DELETE /api/ftp/delete — same logic, read path from query
router.delete("/delete", authenticate, async (req, res) => {
  try {
    const remotePath = resolveFtpPath(req.query.path || req.body?.path || "");
    const fileId = req.query.fileId || req.body?.fileId;
    if (!remotePath) return res.status(400).json({ message: "مسیر آیتم لازم است" });

    const isAdmin = ["SUPER_ADMIN", "ADMIN"].includes(req.user.role);

    if (fileId) {
      const fileRecord = await prisma.fileMedia.findUnique({ where: { id: fileId } });
      if (fileRecord && !isAdmin && fileRecord.userId !== req.user.id) {
        return res.status(403).json({ message: "شما دسترسی حذف این فایل را ندارید" });
      }
    }

    const client = await createFtpClient();
    try {
      let isDirectory = false;
      try {
        const parentPath = path.posix.dirname(remotePath);
        const itemName = path.posix.basename(remotePath);
        const siblings = await client.list(parentPath);
        isDirectory = siblings.some((s) => s.name === itemName && (s.isDirectory || s.type === 2));
      } catch {
        // assume file
      }

      if (isDirectory) {
        await client.removeDir(remotePath);
      } else {
        await client.remove(remotePath);
      }
    } finally {
      client.close();
    }

    if (fileId) {
      await prisma.fileMedia.delete({ where: { id: fileId } }).catch(() => {});
    } else {
      await prisma.fileMedia.deleteMany({ where: { ftpPath: remotePath } }).catch(() => {});
    }

    res.json({ message: "آیتم از FTP حذف شد" });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ message: error.message || "خطا در حذف آیتم" });
  }
});

// GET /api/ftp/file?path=/remote/file/path
router.get("/file", async (req, res) => {
  try {
    const remoteFilePath = resolveFtpPath(req.query.path || "");
    if (!remoteFilePath) return res.status(400).json({ message: "مسیر فایل معتبر نیست" });

    const client = await createFtpClient();
    try {
      res.setHeader("Content-Disposition", `inline; filename="${path.posix.basename(remoteFilePath)}"`);
      await client.downloadTo(res, remoteFilePath);
    } finally {
      client.close();
    }
  } catch (error) {
    console.error("FTP proxy error:", error);
    if (!res.headersSent) {
      res.status(500).json({ message: "خطا در دریافت فایل از FTP" });
    }
  }
});

// POST /api/ftp/rename
router.post("/rename", authenticate, requireRole("SUPER_ADMIN", "ADMIN"), async (req, res) => {
  try {
    const { path: itemPath, newName } = req.body;
    if (!itemPath || !newName) return res.status(400).json({ message: "path و newName الزامی است" });
    const remotePath = resolveFtpPath(itemPath);
    const parentDir = path.posix.dirname(remotePath);
    const newRemotePath = path.posix.join(parentDir, String(newName).trim());
    const client = await createFtpClient();
    try {
      await client.rename(remotePath, newRemotePath);
    } finally {
      client.close();
    }
    res.json({ message: "تغییر نام انجام شد", newPath: newRemotePath });
  } catch (error) {
    console.error("Rename error:", error);
    res.status(500).json({ message: error.message || "خطا در تغییر نام" });
  }
});

// ── Published Folders CRUD ──

router.get("/published-folders", authenticate, async (req, res) => {
  try {
    const folders = await prisma.publishedFolder.findMany({ orderBy: { createdAt: "desc" } });
    res.json(folders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/published-folders", authenticate, requireRole("SUPER_ADMIN", "ADMIN"), async (req, res) => {
  try {
    const { sitePath, remotePath } = req.body;
    if (!sitePath || !remotePath) return res.status(400).json({ message: "sitePath و remotePath الزامی است" });
    const folder = await prisma.publishedFolder.create({ data: { sitePath, remotePath } });
    res.status(201).json(folder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete("/published-folders/:id", authenticate, requireRole("SUPER_ADMIN", "ADMIN"), async (req, res) => {
  try {
    await prisma.publishedFolder.delete({ where: { id: req.params.id } });
    res.json({ message: "حذف شد" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ── Folder Settings ──

router.get("/folder-settings", authenticate, async (req, res) => {
  try {
    const folderPath = String(req.query.path || "").trim();
    if (!folderPath) {
      const all = await prisma.folderSetting.findMany();
      return res.json(all);
    }
    const setting = await prisma.folderSetting.findUnique({ where: { folderPath } });
    res.json(setting || { folderPath, lmsMode: false });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/folder-settings", authenticate, requireRole("SUPER_ADMIN", "ADMIN"), async (req, res) => {
  try {
    const { folderPath, lmsMode } = req.body;
    if (!folderPath) return res.status(400).json({ message: "folderPath الزامی است" });
    const setting = await prisma.folderSetting.upsert({
      where: { folderPath },
      update: { lmsMode: Boolean(lmsMode) },
      create: { folderPath, lmsMode: Boolean(lmsMode) },
    });
    res.json(setting);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ── Display Names ──

router.get("/display-names", authenticate, async (req, res) => {
  try {
    const entryPath = String(req.query.path || "").trim();
    if (!entryPath) {
      const all = await prisma.displayName.findMany();
      return res.json(all);
    }
    const dn = await prisma.displayName.findUnique({ where: { entryPath } });
    res.json(dn || null);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/display-names", authenticate, requireRole("SUPER_ADMIN", "ADMIN"), async (req, res) => {
  try {
    const { entryPath, displayName, description, poster } = req.body;
    if (!entryPath) return res.status(400).json({ message: "entryPath الزامی است" });
    const updateData = { displayName: String(displayName || "").trim() };
    if (description !== undefined) updateData.description = description;
    if (poster !== undefined) updateData.poster = poster;
    const dn = await prisma.displayName.upsert({
      where: { entryPath },
      update: updateData,
      create: { entryPath, displayName: String(displayName || "").trim(), description: description || null, poster: poster || null },
    });
    res.json(dn);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
