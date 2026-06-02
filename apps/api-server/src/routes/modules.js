import { pipeline } from "node:stream/promises";
import mime from "mime-types";
import {
  resolveVirtualToRemote,
  getModuleLayout,
} from "../utils/resolveVirtualToRemote.js";
import {
  listRemoteDirectory,
  createRemoteReadStream,
  getRemoteFileSize,
  uploadRemoteFile,
  deleteRemotePath,
  createRemoteDirectory,
} from "../services/ftpOperations.js";

function parseRangeHeader(rangeHeader, fileSize) {
  if (!rangeHeader || !rangeHeader.startsWith("bytes=")) return null;

  const [startStr, endStr] = rangeHeader.replace("bytes=", "").split("-");
  const start = parseInt(startStr, 10);
  const end = endStr ? parseInt(endStr, 10) : fileSize - 1;

  if (Number.isNaN(start) || start >= fileSize) return null;

  return {
    start,
    end: Math.min(end, fileSize - 1),
    length: Math.min(end, fileSize - 1) - start + 1,
  };
}

function buildContentDisposition(title, filename) {
  const safeAscii = filename.replace(/[^\x20-\x7E]/g, "_");
  const encoded = encodeURIComponent(title || filename);
  return `attachment; filename="${safeAscii}"; filename*=UTF-8''${encoded}`;
}

export async function getLayoutHandler(req, res, next) {
  try {
    const { moduleKey } = req.params;
    const layout = await getModuleLayout(moduleKey);
    res.json(layout);
  } catch (err) {
    next(err);
  }
}

export async function browseHandler(req, res, next) {
  try {
    const { moduleKey, itemSlug } = req.params;
    const subpath = req.query.subpath ?? "";

    const { remotePath, item } = await resolveVirtualToRemote(
      moduleKey,
      itemSlug,
      subpath
    );

    const entries = await listRemoteDirectory(remotePath);

    res.json({
      remotePath,
      item: item
        ? { title: item.title, slug: item.slug, metaAttributes: item.metaAttributes }
        : null,
      entries: entries.map((e) => ({
        name: e.name,
        type: e.isDirectory ? "directory" : "file",
        size: e.size,
        modifiedAt: e.modifiedAt,
      })),
    });
  } catch (err) {
    next(err);
  }
}

export async function streamHandler(req, res, next) {
  let stream = null;

  try {
    const { moduleKey, itemSlug } = req.params;
    const subpath = req.params.filePath ?? req.query.subpath ?? "";

    const { remotePath, item } = await resolveVirtualToRemote(
      moduleKey,
      itemSlug,
      subpath
    );

    const filename = subpath.split("/").pop() || item?.title || "download";
    const displayTitle = item?.title ?? filename;
    const contentType = mime.lookup(filename) || "application/octet-stream";

    let fileSize;
    try {
      fileSize = await getRemoteFileSize(remotePath);
    } catch {
      fileSize = null;
    }

    const range = fileSize ? parseRangeHeader(req.headers.range, fileSize) : null;

    res.setHeader("Content-Type", contentType);
    res.setHeader(
      "Content-Disposition",
      buildContentDisposition(displayTitle, filename)
    );
    res.setHeader("Accept-Ranges", "bytes");
    res.setHeader("X-Content-Type-Options", "nosniff");

    if (range && fileSize) {
      res.status(206);
      res.setHeader("Content-Range", `bytes ${range.start}-${range.end}/${fileSize}`);
      res.setHeader("Content-Length", range.length);
    } else if (fileSize) {
      res.setHeader("Content-Length", fileSize);
    }

    stream = await createRemoteReadStream(remotePath, {
      startAt: range?.start ?? 0,
    });

    if (range && fileSize) {
      let sent = 0;
      const maxBytes = range.length;

      stream.on("data", (chunk) => {
        if (sent >= maxBytes) return;
        const slice =
          sent + chunk.length > maxBytes
            ? chunk.subarray(0, maxBytes - sent)
            : chunk;
        sent += slice.length;
        res.write(slice);
        if (sent >= maxBytes) {
          stream.destroy();
          res.end();
        }
      });
      stream.on("end", () => {
        if (!res.writableEnded) res.end();
      });
      stream.on("error", next);
    } else {
      await pipeline(stream, res);
    }
  } catch (err) {
    if (stream) {
      stream.destroy();
    }
    next(err);
  }
}

export async function uploadHandler(req, res, next) {
  try {
    const { moduleKey, itemSlug } = req.params;
    const filename = req.query.filename;
    const subpath = req.query.subpath ?? "";

    if (!filename) {
      return res.status(400).json({ error: "پارامتر filename الزامی است" });
    }

    const layout = await getModuleLayout(moduleKey);
    if (!layout.permissions.canUpload) {
      return res.status(403).json({ error: "مجوز بارگذاری وجود ندارد" });
    }

    const runtimePath = subpath ? `${subpath}/${filename}` : filename;
    const { remotePath } = await resolveVirtualToRemote(
      moduleKey,
      itemSlug,
      runtimePath
    );

    await uploadRemoteFile(remotePath, req);

    res.status(201).json({ message: "فایل با موفقیت بارگذاری شد", remotePath });
  } catch (err) {
    next(err);
  }
}

export async function deleteHandler(req, res, next) {
  try {
    const { moduleKey, itemSlug } = req.params;
    const subpath = req.query.subpath ?? "";

    if (!subpath) {
      return res.status(400).json({ error: "پارامتر subpath الزامی است" });
    }

    const layout = await getModuleLayout(moduleKey);
    if (!layout.permissions.canDelete) {
      return res.status(403).json({ error: "مجوز حذف وجود ندارد" });
    }

    const { remotePath } = await resolveVirtualToRemote(moduleKey, itemSlug, subpath);
    await deleteRemotePath(remotePath);

    res.json({ message: "با موفقیت حذف شد" });
  } catch (err) {
    next(err);
  }
}

export async function mkdirHandler(req, res, next) {
  try {
    const { moduleKey, itemSlug } = req.params;
    const { folderName, subpath = "" } = req.body ?? {};

    if (!folderName) {
      return res.status(400).json({ error: "نام پوشه الزامی است" });
    }

    const layout = await getModuleLayout(moduleKey);
    if (!layout.permissions.canCreateFolder) {
      return res.status(403).json({ error: "مجوز ایجاد پوشه وجود ندارد" });
    }

    const runtimePath = subpath ? `${subpath}/${folderName}` : folderName;
    const { remotePath } = await resolveVirtualToRemote(
      moduleKey,
      itemSlug,
      runtimePath
    );

    await createRemoteDirectory(remotePath);

    res.status(201).json({ message: "پوشه ایجاد شد", remotePath });
  } catch (err) {
    next(err);
  }
}
