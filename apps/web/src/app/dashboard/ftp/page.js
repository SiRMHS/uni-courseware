"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch, uploadToFtp } from "@/lib/api";
import { toast } from "sonner";
import { File, Folder, Upload, Plus, Trash2, ChevronLeft, ArrowUp, Loader2, X } from "lucide-react";
import { RequirePermission } from "@/components/RequirePermission";

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return "—";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function formatDate(ts) {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString("fa-IR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function FtpPage() {
  const [path, setPath] = useState("/");
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const abortRef = useRef(null);
  const [newFolderName, setNewFolderName] = useState("");

  const loadEntries = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch(`/api/proxy/ftp/list?path=${encodeURIComponent(path)}`);
      setEntries(data.entries || data);
    } catch (err) {
      toast.error(err.message);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [path]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const controller = new AbortController();
    abortRef.current = controller;
    setUploading(true);
    setUploadProgress(0);
    try {
      await uploadToFtp(file, path, {
        onProgress: setUploadProgress,
        signal: controller.signal,
      });
      toast.success("فایل بارگذاری شد");
      loadEntries();
    } catch (err) {
      if (err.name === "AbortError") {
        toast.info("آپلود لغو شد");
      } else {
        toast.error(err.message);
      }
    } finally {
      setUploading(false);
      setUploadProgress(0);
      abortRef.current = null;
      e.target.value = "";
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      const fullPath = `${path.replace(/\/$/, "")}/${newFolderName.trim()}`;
      await apiFetch("/api/proxy/ftp/mkdir", {
        method: "POST",
        body: JSON.stringify({ path: fullPath }),
      });
      toast.success("پوشه ایجاد شد");
      setNewFolderName("");
      loadEntries();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (name, isDir) => {
    if (!confirm(`آیا از حذف "${name}" اطمینان دارید؟`)) return;
    try {
      const fullPath = `${path.replace(/\/$/, "")}/${name}`;
      await deleteFtpItem(fullPath);
      toast.success(`${isDir ? "پوشه" : "فایل"} حذف شد`);
      loadEntries();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const navigateToDir = (name) => {
    setPath((prev) => `${prev.replace(/\/$/, "")}/${name}`);
  };

  const goUp = () => {
    const parts = path.replace(/\/$/, "").split("/").filter(Boolean);
    if (parts.length <= 1) {
      setPath("/");
    } else {
      parts.pop();
      setPath("/" + parts.join("/"));
    }
  };

  return (
    <RequirePermission permissions={["ftp.view"]}>
    <div className="space-y-6 text-right">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">FTP File Manager</h1>
          <p className="mt-1 text-sm text-muted-foreground">مدیریت فایل‌های سرور از طریق FTP</p>
        </div>
      </motion.div>

      <Card className="border-border/60 bg-card/70 backdrop-blur">
        <CardHeader className="text-right">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-lg">مرور فایل‌ها</CardTitle>
            <div className="flex items-center gap-2">
              {uploading ? (
                <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-1.5">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Loader2 className="size-3 animate-spin" />
                    {uploadProgress}%
                  </div>
                  <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted-foreground/20">
                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${uploadProgress}%` }} />
                  </div>
                  <button
                    type="button"
                    className="flex items-center justify-center rounded p-0.5 text-destructive transition-colors hover:bg-destructive/10"
                    onClick={() => abortRef.current?.abort()}
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer">
                  <Button variant="outline" size="sm" className="flex-row-reverse gap-2 rounded-xl" asChild>
                    <span>
                      <Upload className="size-4" />
                      بارگذاری
                    </span>
                  </Button>
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleUpload}
                  />
                </label>
              )}
              <div className="flex items-center gap-1">
                <Input
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="نام پوشه جدید"
                  className="h-9 w-36 rounded-xl text-sm"
                  onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
                />
                <Button variant="outline" size="icon" className="size-9 shrink-0 rounded-xl" onClick={handleCreateFolder}>
                  <Plus className="size-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-background/40 px-3 py-2">
            <Button variant="ghost" size="icon" className="size-8 shrink-0 rounded-xl" onClick={goUp} disabled={path === "/"}>
              <ArrowUp className="size-4" />
            </Button>
            <ChevronLeft className="size-4 shrink-0 text-muted-foreground" />
            <span className="truncate text-sm font-medium text-muted-foreground" dir="ltr">
              {path}
            </span>
          </div>

          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 rounded-xl" />
              ))}
            </div>
          ) : entries.length === 0 ? (
            <p className="py-12 text-center text-muted-foreground">این پوشه خالی است</p>
          ) : (
            <div className="space-y-1">
              {entries.map((entry) => {
                const isDir = entry.isDirectory ?? entry.type === "directory";
                return (
                  <motion.div
                    key={entry.name}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 rounded-xl border border-border/40 bg-background/30 px-3 py-2.5 transition-colors hover:bg-accent/30"
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 shrink-0 rounded-xl text-destructive hover:text-destructive"
                      onClick={() => handleDelete(entry.name, isDir)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>

                    <button
                      type="button"
                      onClick={() => isDir && navigateToDir(entry.name)}
                      className={`flex min-w-0 flex-1 items-center gap-3 text-right ${isDir ? "cursor-pointer" : "cursor-default"}`}
                    >
                      <div className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${isDir ? "bg-amber-500/10 text-amber-500" : "bg-sky-500/10 text-sky-500"}`}>
                        {isDir ? <Folder className="size-4" /> : <File className="size-4" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{entry.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {isDir ? "پوشه" : formatBytes(entry.size)}
                          {entry.modifiedAt && ` • ${formatDate(entry.modifiedAt)}`}
                        </p>
                      </div>
                    </button>
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
    </RequirePermission>
  );
}
