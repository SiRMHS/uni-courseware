"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchMediaFiles, fetchAllMediaFiles, uploadMediaFile } from "@/lib/api";
import { toast } from "sonner";
import {
  ImageIcon,
  FileText,
  File,
  Upload,
  Search,
  X,
  Check,
  Trash2,
  Folder,
  User,
  Calendar,
  Loader2,
} from "lucide-react";

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return "—";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function formatDate(date) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("fa-IR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getFileIcon(mimeType) {
  if (!mimeType) return <File className="size-5" />;
  if (mimeType.startsWith("image/")) return <ImageIcon className="size-5" />;
  if (mimeType.startsWith("text/")) return <FileText className="size-5" />;
  return <File className="size-5" />;
}

function getFileTypeLabel(mimeType) {
  if (!mimeType) return "فایل";
  if (mimeType.startsWith("image/")) return "تصویر";
  if (mimeType.startsWith("video/")) return "ویدیو";
  if (mimeType.startsWith("audio/")) return "صدا";
  if (mimeType.startsWith("text/")) return "متن";
  if (mimeType.includes("pdf")) return "PDF";
  return "فایل";
}

export function MediaManager({
  trigger,
  onSelect,
  onUpload,
  accept = "image/*",
  folder = "/filamoon_uploads",
  showLibrary = true,
  showUpload = true,
  title = "انتخاب فایل",
}) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("library");
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [viewMode, setViewMode] = useState("grid");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setIsAdmin(["SUPER_ADMIN", "ADMIN"].includes(payload.role));
      } catch {
        setIsAdmin(false);
      }
    }
  }, []);

  const loadFiles = useCallback(async () => {
    if (!open) return;
    setLoading(true);
    try {
      const type = accept === "image/*" ? "image/" : accept === "video/*" ? "video/" : undefined;
      const data = isAdmin
        ? await fetchAllMediaFiles({ folder, search: search || undefined, type })
        : await fetchMediaFiles({ folder, search: search || undefined, type });
      setFiles(data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [open, folder, search, accept, isAdmin]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (accept !== "*" && !file.type.match(accept.replace("*", ".*"))) {
      toast.error("فرمت فایل انتخابی نامعتبر است");
      return;
    }

    setUploading(true);
    try {
      const result = await uploadMediaFile(file, folder);
      toast.success("فایل با موفقیت آپلود شد");
      if (onUpload) {
        onUpload(result.file || result);
      }
      if (onSelect) {
        onSelect(result.file || result);
        setOpen(false);
      } else {
        setActiveTab("library");
        loadFiles();
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleSelect = (file) => {
    setSelectedFile(file);
    if (onSelect) {
      onSelect(file);
      setOpen(false);
    }
  };

  const isImage = (mimeType) => mimeType?.startsWith("image/");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            {showLibrary && <TabsTrigger value="library">کتابخانه فایل‌ها</TabsTrigger>}
            {showUpload && <TabsTrigger value="upload">آپلود جدید</TabsTrigger>}
          </TabsList>

          {showLibrary && (
            <TabsContent value="library" className="flex-1 flex flex-col">
              <div className="flex items-center gap-2 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    placeholder="جستجو در فایل‌ها..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex items-center gap-1 border rounded-lg p-1">
                  <Button
                    variant={viewMode === "grid" ? "secondary" : "ghost"}
                    size="icon"
                    className="size-8"
                    onClick={() => setViewMode("grid")}
                  >
                    <div className="grid grid-cols-2 gap-0.5">
                      <div className="size-2 bg-current rounded-sm" />
                      <div className="size-2 bg-current rounded-sm" />
                      <div className="size-2 bg-current rounded-sm" />
                      <div className="size-2 bg-current rounded-sm" />
                    </div>
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "secondary" : "ghost"}
                    size="icon"
                    className="size-8"
                    onClick={() => setViewMode("list")}
                  >
                    <div className="flex flex-col gap-0.5">
                      <div className="w-4 h-1 bg-current rounded-sm" />
                      <div className="w-4 h-1 bg-current rounded-sm" />
                      <div className="w-4 h-1 bg-current rounded-sm" />
                    </div>
                  </Button>
                </div>
              </div>

              <ScrollArea className="flex-1 -mx-6 px-6">
                {loading ? (
                  viewMode === "grid" ? (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                      {Array.from({ length: 10 }).map((_, i) => (
                        <Skeleton key={i} className="aspect-square rounded-lg" />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-16 rounded-lg" />
                      ))}
                    </div>
                  )
                ) : files.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Folder className="size-12 mb-4 opacity-50" />
                    <p>فایلی یافت نشد</p>
                    {search && <p className="text-sm">نتیجه‌ای برای "{search}" پیدا نشد</p>}
                  </div>
                ) : viewMode === "grid" ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                    <AnimatePresence>
                      {files.map((file) => (
                        <motion.div
                          key={file.id}
                          layout
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          onClick={() => handleSelect(file)}
                          className={`group relative aspect-square rounded-lg border cursor-pointer overflow-hidden transition-all ${
                            selectedFile?.id === file.id
                              ? "ring-2 ring-primary border-primary"
                              : "hover:border-primary/50"
                          }`}
                        >
                          {isImage(file.mimeType) ? (
                            <img
                              src={file.publicUrl || `/api/proxy/ftp/file?path=${encodeURIComponent(file.ftpPath)}`}
                              alt={file.originalName}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.style.display = "none";
                                e.target.nextSibling.style.display = "flex";
                              }}
                            />
                          ) : null}
                          <div
                            className={`absolute inset-0 flex flex-col items-center justify-center bg-muted ${
                              isImage(file.mimeType) ? "hidden" : ""
                            }`}
                          >
                            <div className="text-muted-foreground mb-2">
                              {getFileIcon(file.mimeType)}
                            </div>
                            <span className="text-xs text-muted-foreground text-center px-2 line-clamp-2">
                              {file.originalName}
                            </span>
                          </div>

                          {selectedFile?.id === file.id && (
                            <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                              <Check className="size-3" />
                            </div>
                          )}

                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <p className="text-white text-xs truncate">{file.originalName}</p>
                            <p className="text-white/70 text-xs">{formatBytes(file.size)}</p>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {files.map((file) => (
                      <motion.div
                        key={file.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={() => handleSelect(file)}
                        className={`flex items-center gap-4 p-3 rounded-lg border cursor-pointer transition-all ${
                          selectedFile?.id === file.id
                            ? "ring-2 ring-primary border-primary bg-primary/5"
                            : "hover:bg-muted"
                        }`}
                      >
                        <div className="size-12 rounded-lg bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                          {isImage(file.mimeType) ? (
                            <img
                              src={file.publicUrl || `/api/proxy/ftp/file?path=${encodeURIComponent(file.ftpPath)}`}
                              alt={file.originalName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="text-muted-foreground">{getFileIcon(file.mimeType)}</div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{file.originalName}</p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {getFileTypeLabel(file.mimeType)}
                            </Badge>
                            <span>{formatBytes(file.size)}</span>
                            <span className="flex items-center gap-1">
                              <Calendar className="size-3" />
                              {formatDate(file.createdAt)}
                            </span>
                            {file.user && (
                              <span className="flex items-center gap-1">
                                <User className="size-3" />
                                {file.user.name}
                              </span>
                            )}
                          </div>
                        </div>

                        {selectedFile?.id === file.id && (
                          <div className="bg-primary text-primary-foreground rounded-full p-1.5">
                            <Check className="size-4" />
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </ScrollArea>

              {selectedFile && (
                <div className="mt-4 flex items-center justify-between border-t pt-4">
                  <div className="flex items-center gap-3">
                    {isImage(selectedFile.mimeType) ? (
                      <img
                        src={selectedFile.publicUrl || `/api/proxy/ftp/file?path=${encodeURIComponent(selectedFile.ftpPath)}`}
                        alt={selectedFile.originalName}
                        className="size-10 rounded object-cover"
                      />
                    ) : (
                      <div className="size-10 rounded bg-muted flex items-center justify-center">
                        {getFileIcon(selectedFile.mimeType)}
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-sm">{selectedFile.originalName}</p>
                      <p className="text-xs text-muted-foreground">{formatBytes(selectedFile.size)}</p>
                    </div>
                  </div>
                  <Button onClick={() => setOpen(false)}>انتخاب</Button>
                </div>
              )}
            </TabsContent>
          )}

          {showUpload && (
            <TabsContent value="upload" className="flex-1 flex flex-col items-center justify-center">
              <div className="w-full max-w-md">
                <div className="border-2 border-dashed border-border/60 rounded-xl p-8 text-center hover:border-primary/50 transition-colors">
                  <input
                    type="file"
                    accept={accept}
                    onChange={handleUpload}
                    disabled={uploading}
                    className="hidden"
                    id="media-upload"
                  />
                  <label htmlFor="media-upload" className="cursor-pointer block">
                    {uploading ? (
                      <div className="flex flex-col items-center">
                        <Loader2 className="size-12 text-primary animate-spin mb-4" />
                        <p className="text-muted-foreground">در حال آپلود...</p>
                      </div>
                    ) : (
                      <>
                        <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Upload className="size-8 text-primary" />
                        </div>
                        <h3 className="font-medium mb-2">آپلود فایل جدید</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          فایل مورد نظر خود را اینجا رها کنید یا کلیک کنید
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {accept === "image/*" && "فرمت‌های مجاز: JPG, PNG, GIF, WebP"}
                          {accept === "video/*" && "فرمت‌های مجاز: MP4, WebM, MOV"}
                          {accept === "*" && "همه فرمت‌ها مجاز هستند"}
                        </p>
                      </>
                    )}
                  </label>
                </div>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

export function ImageSelector({ value, onChange, label = "تصویر", folder = "/filamoon_uploads/profiles", className }) {
  const [preview, setPreview] = useState(value);

  useEffect(() => {
    setPreview(value);
  }, [value]);

  const handleSelect = (file) => {
    const url = file.publicUrl || `/api/proxy/ftp/file?path=${encodeURIComponent(file.ftpPath)}`;
    setPreview(url);
    onChange?.(url, file);
  };

  return (
    <div className={className}>
      <label className="text-sm font-medium mb-2 block">{label}</label>
      <div className="flex items-center gap-4">
        <div className="relative size-24 rounded-lg border overflow-hidden bg-muted">
          {preview ? (
            <img
              src={preview}
              alt="Preview"
              className="w-full h-full object-cover"
              onError={() => setPreview(null)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <ImageIcon className="size-8" />
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <MediaManager
            accept="image/*"
            folder={folder}
            title={`انتخاب ${label}`}
            onSelect={handleSelect}
            trigger={
              <Button variant="outline" size="sm" className="gap-2">
                <ImageIcon className="size-4" />
                {preview ? "تغییر تصویر" : "انتخاب تصویر"}
              </Button>
            }
          />
          {preview && (
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => {
                setPreview(null);
                onChange?.(null, null);
              }}
            >
              <X className="size-4 mr-1" />
              حذف
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default MediaManager;
