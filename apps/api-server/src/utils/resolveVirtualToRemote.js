import { prisma } from "@uni/database";

/**
 * Composes the final remote FTP path at runtime from database metadata.
 *
 * Final Remote Path = DynamicModule.ftpBaseRoot + ModuleItem.relativeFtpPath + Runtime Subpath
 */
export async function resolveVirtualToRemote(moduleKey, itemSlug, runtimeSubpath = "") {
  const module = await prisma.dynamicModule.findUnique({
    where: { systemKey: moduleKey },
  });

  if (!module) {
    const err = new Error(`ماژول با کلید «${moduleKey}» یافت نشد`);
    err.status = 404;
    throw err;
  }

  let itemRelative = "";
  let itemMeta = null;

  if (itemSlug) {
    const item = await prisma.moduleItem.findFirst({
      where: { moduleId: module.id, slug: itemSlug },
    });

    if (!item) {
      const err = new Error(`آیتم با شناسه «${itemSlug}» یافت نشد`);
      err.status = 404;
      throw err;
    }

    itemRelative = item.relativeFtpPath;
    itemMeta = item;
  }

  const segments = [
    module.ftpBaseRoot.replace(/\/+$/, ""),
    itemRelative.replace(/^\/+|\/+$/g, ""),
    String(runtimeSubpath ?? "").replace(/^\/+|\/+$/g, ""),
  ].filter(Boolean);

  const remotePath = segments.join("/");

  return {
    remotePath,
    module,
    item: itemMeta,
  };
}

export async function getModuleLayout(moduleKey) {
  const module = await prisma.dynamicModule.findUnique({
    where: { systemKey: moduleKey },
    include: {
      items: {
        orderBy: { title: "asc" },
      },
    },
  });

  if (!module) {
    const err = new Error(`ماژول با کلید «${moduleKey}» یافت نشد`);
    err.status = 404;
    throw err;
  }

  const folderConfig = await prisma.folderConfig.findFirst({
    where: { targetPath: moduleKey },
  });

  const permissions = derivePermissions(module.type, folderConfig);

  const itemMap = new Map(module.items.map((i) => [i.id, { ...i, children: [] }]));
  const roots = [];

  for (const item of itemMap.values()) {
    if (item.parentId && itemMap.has(item.parentId)) {
      itemMap.get(item.parentId).children.push(item);
    } else {
      roots.push(item);
    }
  }

  const sortTree = (nodes) => {
    nodes.sort((a, b) => a.title.localeCompare(b.title, "fa"));
    for (const node of nodes) {
      if (node.children.length) sortTree(node.children);
    }
  };
  sortTree(roots);

  return {
    module: {
      id: module.id,
      type: module.type,
      name: module.name,
      systemKey: module.systemKey,
    },
    permissions,
    actions: buildActionMetadata(permissions),
    tree: serializeTree(roots),
  };
}

function derivePermissions(moduleType, folderConfig) {
  const base = {
    canBrowse: true,
    canDownload: true,
    canUpload: false,
    canDelete: false,
    canCreateFolder: false,
  };

  if (folderConfig?.lmsMode) {
    return { ...base, canUpload: true, canCreateFolder: true };
  }

  if (moduleType === "TECHNICAL_DATASET") {
    return { ...base, canUpload: true };
  }

  return base;
}

function buildActionMetadata(permissions) {
  const actions = [];

  if (permissions.canDownload) {
    actions.push({ id: "download", label: "دانلود", icon: "download" });
  }
  if (permissions.canUpload) {
    actions.push({ id: "upload", label: "بارگذاری", icon: "upload" });
  }
  if (permissions.canDelete) {
    actions.push({ id: "delete", label: "حذف", icon: "trash" });
  }
  if (permissions.canCreateFolder) {
    actions.push({ id: "mkdir", label: "پوشه جدید", icon: "folder-plus" });
  }
  actions.push({ id: "refresh", label: "بروزرسانی", icon: "refresh" });

  return actions;
}

function serializeTree(nodes) {
  return nodes.map((node) => ({
    id: node.id,
    title: node.title,
    slug: node.slug,
    relativeFtpPath: node.relativeFtpPath,
    metaAttributes: node.metaAttributes,
    children: serializeTree(node.children),
  }));
}
