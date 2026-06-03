"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Bold,
  Code,
  Italic,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  ImageIcon,
  Loader2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { uploadToFtp } from "@/lib/api";

export default function TipTapEditor({ content, onChange, placeholder = "متن خود را وارد کنید...", uploadPath = "" }) {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const abortRef = useRef(null);
  const [showSource, setShowSource] = useState(false);
  const [htmlSource, setHtmlSource] = useState(content || "");

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Image.configure({ inline: false }),
      Placeholder.configure({ placeholder }),
    ],
    content: content || "",
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
    editorProps: {
      attributes: {
        dir: "rtl",
        class: "prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[200px] px-3 py-2 rounded-xl border border-input bg-transparent text-right",
      },
    },
  });

  const handleImageFile = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    const allowedTypes = ["image/png", "image/jpeg", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("فقط تصاویر PNG، JPEG، WebP و GIF مجاز هستند");
      return;
    }
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("حجم تصویر نباید بیشتر از ۱۰ مگابایت باشد");
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    setUploading(true);
    setUploadProgress(0);

    try {
      const result = await uploadToFtp(file, uploadPath, {
        onProgress: setUploadProgress,
        signal: controller.signal,
      });
      if (result.publicUrl) {
        editor.chain().focus().setImage({ src: result.publicUrl }).run();
      } else {
        toast.error("آدرس تصویر دریافت نشد");
      }
    } catch (err) {
      if (err.name === "AbortError") {
        toast.info("آپلود لغو شد");
      } else {
        toast.error("خطا در آپلود تصویر");
      }
    } finally {
      setUploading(false);
      setUploadProgress(0);
      abortRef.current = null;
    }
  }, [editor, uploadPath]);

  const cancelUpload = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  if (!editor) return null;

  const toggle = (fn) => fn().run();

  const toggleSource = () => {
    if (showSource) {
      editor.commands.setContent(htmlSource || "");
      onChange?.(htmlSource || "");
    } else {
      setHtmlSource(editor.getHTML());
    }
    setShowSource(!showSource);
  };

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={handleImageFile}
      />
      <div className="flex flex-wrap gap-1" dir="rtl">
        <Button
          type="button"
          variant={editor.isActive("bold") ? "secondary" : "ghost"}
          size="icon"
          className="size-8 rounded-lg"
          onClick={() => toggle(() => editor.chain().focus().toggleBold())}
        >
          <Bold className="size-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive("italic") ? "secondary" : "ghost"}
          size="icon"
          className="size-8 rounded-lg"
          onClick={() => toggle(() => editor.chain().focus().toggleItalic())}
        >
          <Italic className="size-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive("heading", { level: 2 }) ? "secondary" : "ghost"}
          size="icon"
          className="size-8 rounded-lg"
          onClick={() => toggle(() => editor.chain().focus().toggleHeading({ level: 2 }))}
        >
          <Heading2 className="size-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive("heading", { level: 3 }) ? "secondary" : "ghost"}
          size="icon"
          className="size-8 rounded-lg"
          onClick={() => toggle(() => editor.chain().focus().toggleHeading({ level: 3 }))}
        >
          <Heading1 className="size-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive("bulletList") ? "secondary" : "ghost"}
          size="icon"
          className="size-8 rounded-lg"
          onClick={() => toggle(() => editor.chain().focus().toggleBulletList())}
        >
          <List className="size-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive("orderedList") ? "secondary" : "ghost"}
          size="icon"
          className="size-8 rounded-lg"
          onClick={() => toggle(() => editor.chain().focus().toggleOrderedList())}
        >
          <ListOrdered className="size-4" />
        </Button>
        {uploading ? (
          <div className="flex items-center gap-2 rounded-lg bg-muted px-2 py-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Loader2 className="size-3 animate-spin" />
              {uploadProgress}%
            </div>
            <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted-foreground/20">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${uploadProgress}%` }} />
            </div>
            <Button type="button" variant="ghost" size="icon" className="size-6 rounded-lg text-destructive hover:text-destructive" onClick={cancelUpload}>
              <X className="size-3" />
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 rounded-lg"
            onClick={() => fileInputRef.current?.click()}
          >
            <ImageIcon className="size-4" />
          </Button>
        )}
        <div className="mr-auto" />
        <Button
          type="button"
          variant={showSource ? "secondary" : "ghost"}
          size="icon"
          className="size-8 rounded-lg"
          onClick={toggleSource}
        >
          <Code className="size-4" />
        </Button>
      </div>
      {showSource ? (
        <textarea
          value={htmlSource}
          onChange={(e) => {
            setHtmlSource(e.target.value);
            onChange?.(e.target.value);
          }}
          className="w-full min-h-[200px] rounded-xl border border-input bg-transparent p-3 text-right font-mono text-sm outline-none focus:border-primary"
          dir="rtl"
        />
      ) : (
        <EditorContent editor={editor} className="[&_.ProseMirror_p.is-editor-empty:first-child::before]:text-muted-foreground [&_.ProseMirror_p.is-editor-empty:first-child::before]:float-right [&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none [&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0 [&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.ProseMirror_img]:max-w-full [&_.ProseMirror_img]:rounded-xl [&_.ProseMirror_img]:h-auto" />
      )}
    </div>
  );
}
