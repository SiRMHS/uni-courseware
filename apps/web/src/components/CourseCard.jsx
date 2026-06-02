"use client";

import { motion } from "framer-motion";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Building2, GraduationCap, Play } from "lucide-react";
import Link from "next/link";

export function CourseCard({ course, index = 0 }) {
  const initials = course.professorName
    ?.split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link href={`/dashboard/courses/${course.slug}`} className="group block">
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card/70 backdrop-blur transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
          <div className="relative aspect-video overflow-hidden bg-muted">
            {course.thumbnail ? (
              <img
                src={course.thumbnail}
                alt={course.title}
                className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
            ) : (
              <div className="flex size-full items-center justify-center text-muted-foreground">
                <GraduationCap className="size-12" />
              </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors duration-300 group-hover:bg-black/30">
              <div className="flex size-12 items-center justify-center rounded-xl bg-white/90 text-background opacity-0 shadow-lg transition-all duration-300 group-hover:opacity-100">
                <Play className="size-5 fill-current" />
              </div>
            </div>
          </div>

          <div className="space-y-3 p-4">
            <h3 className="line-clamp-2 font-semibold leading-snug transition-colors group-hover:text-primary">
              {course.title}
            </h3>

            {course.description && (
              <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                {course.description}
              </p>
            )}

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Building2 className="size-3.5 shrink-0" />
              <span className="truncate">
                {course.department?.faculty?.name} — {course.department?.name}
              </span>
            </div>

            {course.professorName && (
              <div className="flex items-center gap-2 border-t border-border/40 pt-3">
                <Avatar className="size-7">
                  <AvatarFallback className="bg-primary/10 text-[10px] font-medium text-primary">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs font-medium">{course.professorName}</span>
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
