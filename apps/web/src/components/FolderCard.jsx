"use client";

import { motion } from "framer-motion";
import { Folder, ArrowLeft } from "lucide-react";

export function FolderCard({ entry, onClick, onContextMenu }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.96 }}
      className="group relative cursor-pointer overflow-hidden rounded-xl border border-border/40 bg-card/50 transition-all hover:border-border hover:shadow-md"
      onClick={onClick}
      onContextMenu={onContextMenu}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-amber-500/30 to-amber-600/10">
        <div className="flex size-full items-center justify-center">
          <Folder className="size-16 text-amber-500/60 transition-all group-hover:scale-110 group-hover:text-amber-500" />
        </div>
      </div>
      <div className="flex items-center gap-2 border-t border-border/40 p-3">
        <span className="flex-1 truncate text-sm font-medium">{entry.name}</span>
        <ArrowLeft className="size-4 shrink-0 text-muted-foreground" />
      </div>
    </motion.div>
  );
}
