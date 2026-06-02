"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  Download,
  File,
  Folder,
  FolderPlus,
  RefreshCw,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  browseDirectory,
  createFolder,
  deleteEntry,
  fetchModuleLayout,
  getStreamUrl,
  uploadFile,
} from "@/lib/api";
import { cn, formatBytes, formatDate } from "@/lib/utils";

const ACTION_ICONS = {
  download: Download,
  upload: Upload,
  refresh: RefreshCw,
  "folder-plus": FolderPlus,
};

function TreeNode({ node, depth, selectedSlug, onSelect }) {
  const isSelected = selectedSlug === node.slug;
  return (
    <div>
      <button
        type="button"
        onClick={() => onSelect(node.slug, node.title)}
        className={cn(
          "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent",
          isSelected && "bg-accent font-medium"
        )}
        style={{ paddingRight: `${depth * 12 + 8}px` }}
      >
        <Folder className="size-4 shrink-0 text-amber-500" />
        <span className="truncate">{node.title}</span>
      </button>
      {node.children?.map((child) => (
        <TreeNode
          key={child.id}
          node={child}
          depth={depth + 1}
          selectedSlug={selectedSlug}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

export function DynamicAssetExplorer({ moduleKey }) {
  const [layout, setLayout] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSlug, setSelectedSlug] = useState(null);
  const [selectedTitle, setSelectedTitle] = useState("");
  const [currentSubpath, setCurrentSubpath] = useState("");
  const [entries, setEntries] = useState([]);
  const [browseLoading, setBrowseLoading] = useState(false);
  const [mkdirOpen, setMkdirOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const fileInputRef = useRef(null);

  const loadLayout = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchModuleLayout(moduleKey);
      setLayout(data);
      if (data.tree?.length && !selectedSlug) {
        const first = data.tree[0];
        setSelectedSlug(first.slug);
        setSelectedTitle(first.title);
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [moduleKey, selectedSlug]);

  const loadDirectory = useCallback(async () => {
    if (!selectedSlug) return;
    setBrowseLoading(true);
    try {
      const data = await browseDirectory(moduleKey, selectedSlug, currentSubpath);
      setEntries(data.entries ?? []);
    } catch (err) {
      toast.error(err.message);
      setEntries([]);
    } finally {
      setBrowseLoading(false);
    }
  }, [moduleKey, selectedSlug, currentSubpath]);

  useEffect(() => {
    loadLayout();
  }, [loadLayout]);

  useEffect(() => {
    loadDirectory();
  }, [loadDirectory]);

  const handleSelectItem = (slug, title) => {
    setSelectedSlug(slug);
    setSelectedTitle(title);
    setCurrentSubpath("");
  };

  const navigateInto = (name) => {
    setCurrentSubpath((prev) => (prev ? `${prev}/${name}` : name));
  };

  const navigateUp = () => {
    setCurrentSubpath((prev) => {
      const parts = prev.split("/").filter(Boolean);
      parts.pop();
      return parts.join("/");
    });
  };

  const handleAction = async (actionId, entry = null) => {
    switch (actionId) {
      case "refresh":
        await loadDirectory();
        toast.success("فهرست بروزرسانی شد");
        break;
      case "download": {
        if (!entry || entry.type !== "file") return;
        const filePath = currentSubpath
          ? `${currentSubpath}/${entry.name}`
          : entry.name;
        window.open(getStreamUrl(moduleKey, selectedSlug, filePath), "_blank");
        break;
      }
      case "upload":
        fileInputRef.current?.click();
        break;
      case "mkdir":
        setMkdirOpen(true);
        break;
      case "delete": {
        if (!entry) return;
        const sub = currentSubpath
          ? `${currentSubpath}/${entry.name}`
          : entry.name;
        try {
          await deleteEntry(moduleKey, selectedSlug, sub);
          toast.success("با موفقیت حذف شد");
          loadDirectory();
        } catch (err) {
          toast.error(err.message);
        }
        break;
      }
      default:
        break;
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await uploadFile(moduleKey, selectedSlug, file, currentSubpath);
      toast.success("فایل با موفقیت بارگذاری شد");
      loadDirectory();
    } catch (err) {
      toast.error(err.message);
    } finally {
      e.target.value = "";
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      toast.error("نام پوشه را وارد کنید");
      return;
    }
    try {
      await createFolder(moduleKey, selectedSlug, newFolderName.trim(), currentSubpath);
      toast.success("پوشه ایجاد شد");
      setMkdirOpen(false);
      setNewFolderName("");
      loadDirectory();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const isActionAllowed = (actionId) => {
    if (!layout?.permissions) return false;
    const map = {
      download: layout.permissions.canDownload,
      upload: layout.permissions.canUpload,
      delete: layout.permissions.canDelete,
      mkdir: layout.permissions.canCreateFolder,
      refresh: true,
    };
    return map[actionId] ?? false;
  };

  const filteredActions = layout?.actions?.filter((a) => isActionAllowed(a.id)) ?? [];

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-[280px_1fr]">
        <Skeleton className="h-96" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!layout) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          ماژول یافت نشد
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-[280px_1fr]">
      <Card className="py-4">
        <CardHeader className="px-4 pb-2">
          <CardTitle className="text-base">{layout.module.name}</CardTitle>
          <CardDescription>انتخاب بخش</CardDescription>
        </CardHeader>
        <CardContent className="px-2">
          <ScrollArea className="h-[420px]">
            {layout.tree.map((node) => (
              <TreeNode
                key={node.id}
                node={node}
                depth={0}
                selectedSlug={selectedSlug}
                onSelect={handleSelectItem}
              />
            ))}
          </ScrollArea>
        </CardContent>
      </Card>

      <Card className="py-4">
        <CardHeader className="flex-row items-center justify-between px-4 pb-2">
          <div>
            <CardTitle className="text-base">{selectedTitle || "—"}</CardTitle>
            <CardDescription className="font-mono text-xs" dir="ltr">
              {currentSubpath || "/"}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {filteredActions.map((action) => {
              const Icon = ACTION_ICONS[action.icon] ?? RefreshCw;
              return (
                <Button
                  key={action.id}
                  variant="outline"
                  size="sm"
                  onClick={() => handleAction(action.id)}
                >
                  <Icon className="size-4" />
                  {action.label}
                </Button>
              );
            })}
          </div>
        </CardHeader>

        <CardContent className="px-4">
          {currentSubpath && (
            <Button variant="ghost" size="sm" className="mb-3" onClick={navigateUp}>
              <ChevronLeft className="size-4" />
              بازگشت
            </Button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileUpload}
          />

          {browseLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10" />
              ))}
            </div>
          ) : entries.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">پوشه خالی است</p>
          ) : (
            <ScrollArea className="h-[360px]">
              <div className="space-y-1">
                {entries.map((entry) => (
                  <ContextMenu key={entry.name}>
                    <ContextMenuTrigger asChild>
                      <button
                        type="button"
                        className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-accent"
                        onClick={() =>
                          entry.type === "directory" && navigateInto(entry.name)
                        }
                      >
                        {entry.type === "directory" ? (
                          <Folder className="size-5 text-amber-500" />
                        ) : (
                          <File className="size-5 text-blue-500" />
                        )}
                        <span className="flex-1 truncate text-right">{entry.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {entry.type === "file" ? formatBytes(entry.size) : "پوشه"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(entry.modifiedAt)}
                        </span>
                      </button>
                    </ContextMenuTrigger>
                    <ContextMenuContent className="w-48">
                      <ContextMenuLabel>{entry.name}</ContextMenuLabel>
                      <ContextMenuSeparator />
                      {filteredActions.map((action) => {
                        if (action.id === "download" && entry.type !== "file") return null;
                        if (action.id === "delete" && !layout.permissions.canDelete) return null;
                        const Icon = ACTION_ICONS[action.icon] ?? RefreshCw;
                        return (
                          <ContextMenuItem
                            key={action.id}
                            onClick={() => handleAction(action.id, entry)}
                          >
                            <Icon className="size-4" />
                            {action.label}
                          </ContextMenuItem>
                        );
                      })}
                    </ContextMenuContent>
                  </ContextMenu>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <Dialog open={mkdirOpen} onOpenChange={setMkdirOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ایجاد پوشه جدید</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="نام پوشه"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setMkdirOpen(false)}>
              انصراف
            </Button>
            <Button onClick={handleCreateFolder}>ایجاد</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
