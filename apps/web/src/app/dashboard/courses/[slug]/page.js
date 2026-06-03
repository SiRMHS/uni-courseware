"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  fetchCourse,
  fetchFtpFolders,
  fetchDisplayNames,
  upsertDisplayName,
  uploadToFtp,
  createFtpFolder,
  renameFtpItem,
  deleteFtpItem,
  logActivity,
} from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import Link from "next/link";
import {
  ArrowRight,
  ArrowLeft,
  Building2,
  GraduationCap,
  HardDrive,
  File,
  Folder,
  Download,
  FileText,
  Image as ImageIcon,
  Video,
  Music,
  MoreHorizontal,
  Pencil,
  Play,
  Trash2,
  Upload,
  Plus,
  X,
  Loader2,
  FolderPlus,
} from "lucide-react";
import { createPlayer, videoFeatures } from "@videojs/react";
import {
  VideoSkin,
  Video as VideojsVideo,
} from "@videojs/react/video";
import "@videojs/react/video/skin.css";

const Player = createPlayer({ features: videoFeatures });

const VIDEO_EXTS = ["mp4", "webm", "mov", "mkv", "avi", "m4v"];
const IMAGE_EXTS = ["jpg", "jpeg", "png", "gif", "webp", "svg"];
const DOC_EXTS = ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx"];
const ARCHIVE_EXTS = ["zip", "rar", "7z"];
const AUDIO_EXTS = ["mp3", "wav", "ogg"];

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return "—";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function formatDate(ts) {
  if (!ts) return "";
  return new Date(ts).toLocaleDateString("fa-IR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getFileIcon(name) {
  const ext = name?.split(".").pop()?.toLowerCase();
  if (IMAGE_EXTS.includes(ext)) return <ImageIcon className="size-4 text-sky-500" />;
  if (VIDEO_EXTS.includes(ext)) return <Video className="size-4 text-purple-500" />;
  if (AUDIO_EXTS.includes(ext)) return <Music className="size-4 text-pink-500" />;
  if (DOC_EXTS.includes(ext)) return <FileText className="size-4 text-red-500" />;
  return <File className="size-4 text-muted-foreground" />;
}

function isVideo(name) {
  const ext = name?.split(".").pop()?.toLowerCase();
  return VIDEO_EXTS.includes(ext);
}

export default function CourseDetailPage() {
  const { slug } = useParams();
  const { user } = useAuth();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ftpEntries, setFtpEntries] = useState([]);
  const [ftpLoading, setFtpLoading] = useState(false);
  const [displayNames, setDisplayNames] = useState({});
  const [displayNamesLoading, setDisplayNamesLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [playerReady, setPlayerReady] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [editDisplayName, setEditDisplayName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [ftpPath, setFtpPath] = useState("");
  const [folderPath, setFolderPath] = useState(null);
  const [folderEntries, setFolderEntries] = useState(null);
  const [folderLoading, setFolderLoading] = useState(false);
  const [contextMenu, setContextMenu] = useState(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [newFolderDialogOpen, setNewFolderDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [renameTarget, setRenameTarget] = useState(null);
  const uploadInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const uploadAbortRef = useRef(null);
  const contextMenuRef = useRef(null);
  const playerWrapperRef = useRef(null);

  const isAdmin = user && ["SUPER_ADMIN", "ADMIN"].includes(user.role);
  const lastWatchedKey = `lastWatched_${slug}`;

  const loadCourse = useCallback(async () => {
    try {
      const data = await fetchCourse(slug);
      setCourse(data);
      if (data.ftpPath) setFtpPath(data.ftpPath);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => { loadCourse(); }, [loadCourse]);

  useEffect(() => {
    if (!course?.ftpPath) return;
    setFtpLoading(true);
    setDisplayNamesLoading(true);
    Promise.all([
      fetchFtpFolders(course.ftpPath).catch(() => []),
      fetchDisplayNames().catch(() => []),
    ])
      .then(([entries, names]) => {
        setFtpEntries(entries);
        const map = {};
        if (Array.isArray(names)) {
          names.forEach((n) => { if (n.entryPath) map[n.entryPath] = n; });
        }
        setDisplayNames(map);
      })
      .catch(() => { setFtpEntries([]); setDisplayNames({}); })
      .finally(() => { setFtpLoading(false); setDisplayNamesLoading(false); });
  }, [course?.ftpPath]);

  useEffect(() => {
    const saved = localStorage.getItem(lastWatchedKey);
    if (saved && ftpEntries.length > 0) {
      try {
        const parsed = JSON.parse(saved);
        const entry = ftpEntries.find((e) => e.targetUrl === parsed.targetUrl);
        if (entry) { setSelectedVideo(entry); setPlayerReady(true); }
      } catch {}
    }
  }, [ftpEntries, lastWatchedKey]);

  useEffect(() => {
    function handleClick() { setContextMenu(null); }
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);

  const openFolder = async (name) => {
    const base = folderPath || ftpPath;
    const fullPath = `${base.replace(/\/$/, "")}/${name}`;
    setFolderPath(fullPath);
    setFolderLoading(true);
    try {
      const entries = await fetchFtpFolders(fullPath);
      setFolderEntries(entries);
    } catch { setFolderEntries([]); }
    finally { setFolderLoading(false); }
  };

  const goBackFolder = () => {
    if (!folderPath) return;
    const parent = folderPath.split("/").filter(Boolean).slice(0, -1).join("/");
    const parentPath = "/" + parent;
    if (parentPath === (ftpPath || course?.ftpPath)) {
      setFolderPath(null);
      setFolderEntries(null);
    } else {
      setFolderLoading(true);
      setFolderPath(parentPath);
      fetchFtpFolders(parentPath)
        .then((entries) => setFolderEntries(entries))
        .catch(() => setFolderEntries([]))
        .finally(() => setFolderLoading(false));
    }
  };

  const handleContextMenu = (e, entry, isDir) => {
    e.preventDefault();
    e.stopPropagation();
    const menuW = 192;
    const menuH = 200;
    const x = Math.min(e.clientX, window.innerWidth - menuW - 8);
    const y = Math.min(e.clientY, window.innerHeight - menuH - 8);
    setContextMenu({ x, y, entry, isDir });
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const controller = new AbortController();
    uploadAbortRef.current = controller;
    setUploading(true);
    setUploadProgress(0);
    try {
      const target = folderPath || ftpPath;
      await uploadToFtp(file, target, {
        onProgress: setUploadProgress,
        signal: controller.signal,
      });
      toast.success("فایل آپلود شد");
      await refreshAll();
    } catch (err) {
      if (err.name === "AbortError") {
        toast.info("آپلود لغو شد");
      } else {
        toast.error("خطا در آپلود");
      }
    } finally {
      setUploading(false);
      setUploadProgress(0);
      uploadAbortRef.current = null;
      if (uploadInputRef.current) uploadInputRef.current.value = "";
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      const target = folderPath || ftpPath;
      await createFtpFolder(target, newFolderName.trim());
      toast.success("پوشه ساخته شد");
      await refreshAll();
      setNewFolderDialogOpen(false);
      setNewFolderName("");
    } catch { toast.error("خطا در ساخت پوشه"); }
  };

  const handleRename = async () => {
    if (!renameTarget || !renameValue.trim()) return;
    try {
      await renameFtpItem(renameTarget.remotePath, renameValue.trim());
      toast.success("تغییر نام انجام شد");
      await refreshAll();
      setRenameDialogOpen(false);
      setRenameTarget(null);
    } catch { toast.error("خطا در تغییر نام"); }
  };

  const handleDelete = async (entry, isDir) => {
    if (!confirm(`آیا از حذف "${entry.name}" اطمینان دارید؟`)) return;
    try {
      await deleteFtpItem(entry.remotePath);
      toast.success("حذف شد");
      await refreshAll();
      if (selectedVideo?.name === entry.name) { setSelectedVideo(null); setPlayerReady(false); }
    } catch { toast.error("خطا در حذف"); }
  };

  const refreshAll = async () => {
    const root = ftpPath || course?.ftpPath;
    if (!root) return;
    const [entries, names] = await Promise.all([
      fetchFtpFolders(root).catch(() => []),
      fetchDisplayNames().catch(() => []),
    ]);
    setFtpEntries(entries);
    const map = {};
    if (Array.isArray(names)) {
      names.forEach((n) => { if (n.entryPath) map[n.entryPath] = n; });
    }
    setDisplayNames(map);
    if (folderPath) {
      const fEntries = await fetchFtpFolders(folderPath).catch(() => []);
      setFolderEntries(fEntries);
    }
  };

  const navigateFtp = async (subpath) => {
    setFtpLoading(true);
    const fullPath = `${ftpPath.replace(/\/$/, "")}/${subpath}`;
    setFtpPath(fullPath);
    try {
      const entries = await fetchFtpFolders(fullPath);
      setFtpEntries(entries);
    } catch { setFtpEntries([]); }
    finally { setFtpLoading(false); }
  };

  const goUpFtp = () => {
    if (!ftpPath || ftpPath === course?.ftpPath) return;
    const parts = ftpPath.split("/").filter(Boolean);
    parts.pop();
    const parent = "/" + parts.join("/");
    setFtpPath(parent);
    setFtpLoading(true);
    fetchFtpFolders(parent)
      .then((entries) => setFtpEntries(entries))
      .catch(() => setFtpEntries([]))
      .finally(() => setFtpLoading(false));
  };

  const handleEditSave = async () => {
    if (!editingEntry) return;
    try {
      await upsertDisplayName({
        entryPath: editingEntry.path,
        displayName: editDisplayName,
        description: editDescription,
      });
      setDisplayNames((prev) => ({
        ...prev,
        [editingEntry.path]: { ...prev[editingEntry.path], displayName: editDisplayName, description: editDescription },
      }));
      setEditDialogOpen(false);
      setEditingEntry(null);
      toast.success("اطلاعات با موفقیت ذخیره شد");
    } catch { toast.error("خطا در ذخیره اطلاعات"); }
  };

  const openEditDialog = (entry, path) => {
    const meta = displayNames[path];
    setEditingEntry({ ...entry, path });
    setEditDisplayName(meta?.displayName ?? entry.name);
    setEditDescription(meta?.description ?? "");
    setEditDialogOpen(true);
  };

  const selectVideo = (entry) => {
    setSelectedVideo(entry);
    setPlayerReady(true);
    localStorage.setItem(lastWatchedKey, JSON.stringify({ targetUrl: entry.targetUrl, name: entry.name }));
    logActivity({ action: "watch", target: entry.name, targetUrl: entry.targetUrl }).catch(() => {});
    setTimeout(() => {
      playerWrapperRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 200);
  };

  const closePlayer = () => {
    setSelectedVideo(null);
    setPlayerReady(false);
  };

  const currentPath = folderPath || ftpPath;
  const currentLoading = folderPath ? folderLoading : ftpLoading;
  const folders = [...ftpEntries.filter((e) => e.isDirectory)].sort((a, b) => a.name.localeCompare(b.name, "fa"));
  const videos = [...ftpEntries.filter((e) => !e.isDirectory && isVideo(e.name))].sort((a, b) => a.name.localeCompare(b.name, "fa"));
  const otherFiles = [...ftpEntries.filter((e) => !e.isDirectory && !isVideo(e.name))].sort((a, b) => a.name.localeCompare(b.name, "fa"));

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="aspect-video w-full rounded-2xl" />
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center text-muted-foreground">
        <p className="text-lg font-medium">درس یافت نشد</p>
        <Button variant="link" asChild className="mt-2">
          <Link href="/dashboard/courses">بازگشت به درس‌افزار</Link>
        </Button>
      </div>
    );
  }

  const initials = course.professorName
    ?.split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2);

  const rootPath = course.ftpPath;

  return (
    <div className="space-y-8">
      <Button variant="ghost" asChild className="flex-row-reverse gap-2">
        <Link href="/dashboard/courses">
          <ArrowRight className="size-4" />
          بازگشت به درس‌افزار
        </Link>
      </Button>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="space-y-6"
      >
        <AnimatePresence mode="wait">
          {selectedVideo && playerReady ? (
            <motion.div
              ref={playerWrapperRef}
              key="player"
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.97 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="relative overflow-hidden rounded-4xl bg-primary/80"
              dir="ltr"
            >
              <Player.Provider>
                <VideoSkin>
                  <VideojsVideo
                    src={selectedVideo.targetUrl}
                    poster={
                      displayNames[`${currentPath}/${selectedVideo.name}`]?.poster || undefined
                    }
                    playsInline
                    className="aspect-video w-full"
                  />
                </VideoSkin>
              </Player.Provider>
              <div className="flex items-center gap-2 bg-primary/80 px-4 py-2">
                <p className="flex-1 truncate text-sm font-medium text-white">
                  {displayNames[`${currentPath}/${selectedVideo.name}`]?.displayName ?? selectedVideo.name}
                </p>
                <Button
                  variant="ghost"
                  size="lg"
                  className="gap-2 text-background/80 hover:text-foreground"
                  onClick={() => {
                    const a = document.createElement("a");
                    a.href = selectedVideo.targetUrl;
                    a.download = selectedVideo.name;
                    a.click();
                  }}
                >
                  <Download className="size-4" />
                  دانلود
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white/80 hover:text-white"
                  onClick={closePlayer}
                >
                  <X className="size-4" />
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="thumbnail"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="relative aspect-video overflow-hidden rounded-2xl bg-muted"
            >
              {course.thumbnail ? (
                <img src={course.thumbnail} alt={course.title} className="size-full object-cover" />
              ) : (
                <div className="flex size-full items-center justify-center text-muted-foreground">
                  <GraduationCap className="size-16" />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{course.title}</h1>
          {course.description && (
            <p className="text-sm leading-relaxed text-muted-foreground">{course.description}</p>
          )}
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-card/50 px-3 py-2 text-sm">
              <Building2 className="size-4 text-muted-foreground" />
              <span>{course.department?.faculty?.name}</span>
              <span className="text-muted-foreground">—</span>
              <span>{course.department?.name}</span>
            </div>
            {course.professorName && (
              <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-card/50 px-3 py-2 text-sm">
                <Avatar className="size-6">
                  <AvatarFallback className="bg-primary/10 text-[10px] font-medium text-primary">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span>{course.professorName}</span>
              </div>
            )}
          </div>
        </div>

        <Tabs defaultValue="content" dir="rtl" className="w-full">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="content" className="flex items-center gap-2">
                <Video className="size-4" />
                محتوای درس
              </TabsTrigger>
              <TabsTrigger value="list" className="flex items-center gap-2">
                <HardDrive className="size-4" />
                فهرست
              </TabsTrigger>
            </TabsList>
            {isAdmin && (
              <div className="flex items-center gap-2">
                <input
                  ref={uploadInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleUpload}
                />
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
                      onClick={() => uploadAbortRef.current?.abort()}
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => uploadInputRef.current?.click()}
                  >
                    <Upload className="size-4" />
                    آپلود
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => setNewFolderDialogOpen(true)}
                >
                  <FolderPlus className="size-4" />
                  پوشه جدید
                </Button>
              </div>
            )}
          </div>

          <TabsContent value="content" className="pt-4">
            {!rootPath ? (
              <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
                <HardDrive className="mb-4 size-12 opacity-50" />
                <p className="text-sm font-medium">محتوایی برای این درس تعریف نشده</p>
                <p className="mt-1 text-xs">مدیر درس هنوز پوشه FTP را مشخص نکرده است</p>
              </div>
            ) : currentLoading || displayNamesLoading ? (
              <div className="space-y-6">
                <Skeleton className="h-8 w-24" />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="aspect-video rounded-xl" />
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {videos.length > 0 && (
                  <div className="space-y-4">
                    <h2 className="flex items-center gap-2 text-lg font-semibold">
                      <Video className="size-5 text-purple-500" />
                      ویدیوها
                    </h2>
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
                      {videos.map((entry) => {
                        const path = `${currentPath}/${entry.name}`;
                        const meta = displayNames[path];
                        const displayTitle = meta?.displayName ?? entry.name;
                        return (
                          <motion.div
                            key={entry.name}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            whileTap={{ scale: 0.96 }}
                            className="group relative cursor-pointer overflow-hidden rounded-xl border border-border/40 bg-card/50 transition-all hover:border-border hover:shadow-md"
                            onClick={() => selectVideo(entry)}
                            onContextMenu={(e) => isAdmin && handleContextMenu(e, entry, false)}
                          >
                            <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-primary/40 to-primary/20">
                              {meta?.poster ? (
                                <img src={meta.poster} alt={displayTitle} className="size-full object-cover" />
                              ) : (
                                <div className="flex size-full items-center justify-center">
                                  <Play className="size-10 text-white/60" />
                                </div>
                              )}
                              <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/20">
                                <div className="flex size-12 items-center justify-center rounded-full bg-white/90 opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                                  <Play className="ml-0.5 size-5 text-purple-700" />
                                </div>
                              </div>
                            </div>
                            <div className="space-y-1.5 p-3">
                              <div className="flex items-start justify-between gap-2">
                                <p className="line-clamp-2 text-sm font-medium leading-tight">{displayTitle}</p>
                                {isAdmin && (
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                      <Button variant="ghost" size="icon" className="size-7 shrink-0 rounded-lg">
                                        <MoreHorizontal className="size-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                      <DropdownMenuItem onClick={() => openEditDialog(entry, path)}>
                                        <Pencil className="size-4" />
                                        ویرایش
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => {
                                        setRenameTarget({ ...entry, remotePath: entry.remotePath });
                                        setRenameValue(entry.name);
                                        setRenameDialogOpen(true);
                                      }}>
                                        <Pencil className="size-4" />
                                        تغییر نام
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => {
                                          const a = document.createElement("a");
                                          a.href = entry.targetUrl;
                                          a.download = entry.name;
                                          a.click();
                                        }}
                                      >
                                        <Download className="size-4" />
                                        دانلود
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        className="text-destructive"
                                        onClick={() => handleDelete(entry, false)}
                                      >
                                        <Trash2 className="size-4" />
                                        حذف
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                )}
                              </div>
                              {meta?.description && (
                                <p className="line-clamp-2 text-xs text-muted-foreground">{meta.description}</p>
                              )}
                              <p className="text-xs text-muted-foreground">{formatBytes(entry.size)}</p>
                            </div>
                            <div className="absolute bottom-1 left-1">
                              <span className="flex size-5 items-center justify-center rounded-full bg-muted-foreground/20 text-[8px] font-medium text-muted-foreground" title="آپلود شده توسط جمعی از دوستان">G</span>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {folders.length > 0 && (
                  <div className="space-y-4">
                    <h2 className="flex items-center gap-2 text-lg font-semibold">
                      <Folder className="size-5 text-amber-500" />
                      پوشه‌ها
                    </h2>
                    <div className="flex flex-wrap gap-3">
                      {folders.map((entry) => (
                        <div key={entry.name} className="relative">
                          <button
                            type="button"
                            onClick={() => openFolder(entry.name)}
                            onContextMenu={(e) => isAdmin && handleContextMenu(e, entry, true)}
                            className="flex items-center gap-2 rounded-xl border border-border/40 bg-background/30 px-4 py-3 text-right transition-colors hover:bg-accent/40"
                          >
                            <Folder className="size-5 shrink-0 text-amber-500" />
                            <span className="text-sm font-medium">{entry.name}</span>
                            <ArrowLeft className="mr-2 size-4 text-muted-foreground" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {folderPath && (
                  <div className="space-y-4 rounded-xl border border-border/40 bg-background/50 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={goBackFolder}
                          className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                        >
                          <ArrowRight className="size-4" />
                          بازگشت
                        </button>
                        <span className="text-sm text-muted-foreground">/</span>
                        <span className="text-sm font-medium">{folderPath.split("/").pop()}</span>
                      </div>
                    </div>
                    {folderLoading ? (
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {Array.from({ length: 4 }).map((_, i) => (
                          <Skeleton key={i} className="aspect-video rounded-xl" />
                        ))}
                      </div>
                    ) : folderEntries && folderEntries.length > 0 ? (
                      <>
                        {folderEntries.filter((e) => isVideo(e.name)).length > 0 && (
                          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            {[...folderEntries.filter((e) => isVideo(e.name))]
                              .sort((a, b) => a.name.localeCompare(b.name, "fa"))
                              .map((entry) => {
                                const path = `${folderPath}/${entry.name}`;
                                const meta = displayNames[path];
                                const displayTitle = meta?.displayName ?? entry.name;
                                return (
                                  <motion.div
                                    key={entry.name}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    whileTap={{ scale: 0.96 }}
                                    className="group relative cursor-pointer overflow-hidden rounded-xl border border-border/40 bg-card/50 transition-all hover:border-border hover:shadow-md"
                                    onClick={() => selectVideo(entry)}
                                    onContextMenu={(e) => isAdmin && handleContextMenu(e, entry, false)}
                                  >
                                    <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-purple-900/40 to-indigo-900/40">
                                      {meta?.poster ? (
                                        <img src={meta.poster} alt={displayTitle} className="size-full object-cover" />
                                      ) : (
                                        <div className="flex size-full items-center justify-center">
                                          <Play className="size-10 text-white/60" />
                                        </div>
                                      )}
                                    </div>
                                    <div className="space-y-1.5 p-3">
                                      <p className="line-clamp-2 text-sm font-medium leading-tight">{displayTitle}</p>
                                      <p className="text-xs text-muted-foreground">{formatBytes(entry.size)}</p>
                                    </div>
                                    <div className="absolute bottom-1 right-1">
                                      <span className="flex size-5 items-center justify-center rounded-full bg-muted-foreground/20 text-[8px] font-medium text-muted-foreground" title="آپلود شده توسط جمعی از دوستان">G</span>
                                    </div>
                                  </motion.div>
                                );
                              })}
                          </div>
                        )}
                        {folderEntries.filter((e) => !e.isDirectory && !isVideo(e.name)).length > 0 && (
                          <div className="space-y-2">
                            <h3 className="text-sm font-medium text-muted-foreground">سایر فایل‌ها</h3>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                              {[...folderEntries.filter((e) => !e.isDirectory && !isVideo(e.name))]
                                .sort((a, b) => a.name.localeCompare(b.name, "fa"))
                                .map((entry) => {
                                  const path = `${folderPath}/${entry.name}`;
                                  const meta = displayNames[path];
                                  const displayTitle = meta?.displayName ?? entry.name;
                                  return (
                                    <div
                                      key={entry.name}
                                      className="group relative rounded-xl border border-border/40 bg-background/30 transition-colors hover:bg-accent/40"
                                      onContextMenu={(e) => isAdmin && handleContextMenu(e, entry, false)}
                                    >
                                      <div
                                        onClick={() => {
                                          const a = document.createElement("a");
                                          a.href = entry.targetUrl;
                                          a.download = entry.name;
                                          a.click();
                                        }}
                                        className="flex cursor-pointer items-center gap-3 px-4 py-3"
                                      >
                                        {getFileIcon(entry.name)}
                                        <span className="min-w-0 flex-1 truncate text-sm">{displayTitle}</span>
                                        <span className="text-xs text-muted-foreground">{formatBytes(entry.size)}</span>
                                        <Download className="size-4 shrink-0 text-muted-foreground" />
                                      </div>
                                      <div className="absolute bottom-1 right-1">
                                        <span className="flex size-5 items-center justify-center rounded-full bg-muted-foreground/20 text-[8px] font-medium text-muted-foreground" title="آپلود شده توسط جمعی از دوستان">G</span>
                                      </div>
                                    </div>
                                  );
                                })}
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="py-8 text-center text-muted-foreground">این پوشه خالی است</p>
                    )}
                  </div>
                )}

                {otherFiles.length > 0 && (
                  <div className="space-y-4">
                    <h2 className="flex items-center gap-2 text-lg font-semibold">
                      <File className="size-5 text-muted-foreground" />
                      سایر فایل‌ها
                    </h2>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {otherFiles.map((entry) => {
                        const path = `${currentPath}/${entry.name}`;
                        const meta = displayNames[path];
                        const displayTitle = meta?.displayName ?? entry.name;
                        return (
                          <div
                            key={entry.name}
                            className="group relative rounded-xl border border-border/40 bg-background/30 transition-colors hover:bg-accent/40"
                            onContextMenu={(e) => isAdmin && handleContextMenu(e, entry, false)}
                          >
                            <div
                              onClick={() => {
                                const a = document.createElement("a");
                                a.href = entry.targetUrl;
                                a.download = entry.name;
                                a.click();
                              }}
                              className="flex cursor-pointer items-center gap-3 px-4 py-3"
                            >
                              {getFileIcon(entry.name)}
                              <span className="min-w-0 flex-1 truncate text-sm">{displayTitle}</span>
                              <span className="text-xs text-muted-foreground">{formatBytes(entry.size)}</span>
                              <Download className="size-4 shrink-0 text-muted-foreground" />
                            </div>
                            <div className="absolute bottom-1 right-1">
                              <span className="flex size-5 items-center justify-center rounded-full bg-muted-foreground/20 text-[8px] font-medium text-muted-foreground" title="آپلود شده توسط جمعی از دوستان">G</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {videos.length === 0 && folders.length === 0 && otherFiles.length === 0 && (
                  <p className="py-12 text-center text-muted-foreground">این پوشه خالی است</p>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="list" className="pt-4">
            {!rootPath ? (
              <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
                <HardDrive className="mb-4 size-12 opacity-50" />
                <p className="text-sm font-medium">محتوایی برای این درس تعریف نشده</p>
                <p className="mt-1 text-xs">مدیر درس هنوز پوشه FTP را مشخص نکرده است</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-background/40 px-3 py-2">
                  <HardDrive className="size-4 shrink-0 text-muted-foreground" />
                  <span className="truncate font-mono text-xs text-muted-foreground" dir="ltr">
                    {currentPath}
                  </span>
                  {currentPath !== rootPath && (
                    <Button variant="ghost" size="icon" className="mr-auto size-7 rounded-lg" onClick={goBackFolder}>
                      <ArrowRight className="size-3.5" />
                    </Button>
                  )}
                </div>

                {currentLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-14 rounded-xl" />
                    ))}
                  </div>
                ) : (folderPath ? folderEntries || [] : ftpEntries).length === 0 ? (
                  <p className="py-12 text-center text-muted-foreground">این پوشه خالی است</p>
                ) : (
                  <div className="space-y-1">
                    {[...(folderPath ? folderEntries || [] : ftpEntries)].sort((a, b) => {
                      if (a.isDirectory && !b.isDirectory) return -1;
                      if (!a.isDirectory && b.isDirectory) return 1;
                      return a.name.localeCompare(b.name, "fa");
                    }).map((entry) => {
                      const isDir = entry.isDirectory;
                      if (isDir) {
                        return (
                          <button
                            key={entry.name}
                            type="button"
                            onClick={() => openFolder(entry.name)}
                            onContextMenu={(e) => isAdmin && handleContextMenu(e, entry, true)}
                            className="flex w-full items-center gap-3 rounded-xl border border-border/40 bg-background/30 px-4 py-3 text-right transition-colors hover:bg-accent/40"
                          >
                            <Folder className="size-5 shrink-0 text-amber-500" />
                            <span className="text-sm font-medium">{entry.name}</span>
                            <span className="mr-auto text-xs text-muted-foreground">
                              {entry.size ? formatBytes(entry.size) : "پوشه"}
                            </span>
                          </button>
                        );
                      }
                      return (
                        <div
                          key={entry.name}
                          className="group relative flex cursor-pointer items-center gap-3 rounded-xl border border-border/40 bg-background/30 px-4 py-3 transition-colors hover:bg-accent/40"
                          onClick={() => {
                            const a = document.createElement("a");
                            a.href = entry.targetUrl;
                            a.download = entry.name;
                            a.click();
                          }}
                          onContextMenu={(e) => isAdmin && handleContextMenu(e, entry, false)}
                        >
                          {getFileIcon(entry.name)}
                          <span className="min-w-0 flex-1 truncate text-sm">{entry.name}</span>
                          <span className="text-xs text-muted-foreground">{formatBytes(entry.size)}</span>
                          <span className="text-xs text-muted-foreground">{formatDate(entry.mtime)}</span>
                          <Download className="size-4 shrink-0 text-muted-foreground" />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Right-click context menu */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          className="fixed z-50 w-48 overflow-hidden rounded-xl border border-border/60 bg-popover p-1 shadow-xl"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={() => setContextMenu(null)}
        >
          <button
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-right text-sm transition-colors hover:bg-accent"
            onClick={() => {
              const entry = contextMenu.entry;
              const path = contextMenu.isDir ? entry.remotePath : `${currentPath}/${entry.name}`;
              openEditDialog(entry, path);
              setContextMenu(null);
              setPlayerReady(false);
            }}
          >
            <Pencil className="size-4" />
            ویرایش
          </button>
          <button
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-right text-sm transition-colors hover:bg-accent"
            onClick={() => {
              setRenameTarget(contextMenu.entry);
              setRenameValue(contextMenu.entry.name);
              setRenameDialogOpen(true);
              setContextMenu(null);
            }}
          >
            <Pencil className="size-4" />
            تغییر نام
          </button>
          <button
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-right text-sm transition-colors hover:bg-accent"
            onClick={() => {
              const a = document.createElement("a");
              a.href = contextMenu.entry.targetUrl;
              a.download = contextMenu.entry.name;
              a.click();
              setContextMenu(null);
              logActivity({ action: "download", target: contextMenu.entry.name, targetUrl: contextMenu.entry.targetUrl, metadata: { path: folderPath } }).catch(() => {});
            }}
          >
            <Download className="size-4" />
            دانلود
          </button>
          <hr className="my-1 border-border/40" />
          <button
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-right text-sm text-destructive transition-colors hover:bg-destructive/10"
            onClick={() => {
              handleDelete(contextMenu.entry, contextMenu.isDir);
              setContextMenu(null);
            }}
          >
            <Trash2 className="size-4" />
            حذف
          </button>
        </div>
      )}

      {/* Edit dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ویرایش اطلاعات</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">نام نمایشی</label>
              <Input value={editDisplayName} onChange={(e) => setEditDisplayName(e.target.value)} placeholder="نام نمایشی فایل" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">توضیحات</label>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="توضیحات (اختیاری)"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>انصراف</Button>
            <Button onClick={handleEditSave}>ذخیره</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New folder dialog */}
      <Dialog open={newFolderDialogOpen} onOpenChange={setNewFolderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>پوشه جدید</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <Input
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="نام پوشه"
              onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewFolderDialogOpen(false)}>انصراف</Button>
            <Button onClick={handleCreateFolder}>ساخت</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تغییر نام</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <Input
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              placeholder="نام جدید"
              onKeyDown={(e) => e.key === "Enter" && handleRename()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRenameDialogOpen(false); setRenameTarget(null); }}>انصراف</Button>
            <Button onClick={handleRename}>ذخیره</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
