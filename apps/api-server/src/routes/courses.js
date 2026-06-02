import { prisma } from "@uni/database";
import { createFtpClient, resolveFtpPath, FTP_ROOT } from "../services/ftpOperations.js";

// ── Faculty ──

export async function getFacultiesHandler(req, res, next) {
  try {
    const faculties = await prisma.faculty.findMany({
      include: {
        departments: {
          include: {
            courses: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });
    res.json(faculties);
  } catch (err) {
    next(err);
  }
}

export async function getDepartmentsHandler(req, res, next) {
  try {
    const departments = await prisma.department.findMany({
      include: { faculty: true },
      orderBy: { name: "asc" },
    });
    res.json(departments);
  } catch (err) {
    next(err);
  }
}

export async function getCoursesHandler(req, res, next) {
  try {
    const courses = await prisma.course.findMany({
      include: {
        department: {
          include: {
            faculty: true,
          },
        },
        books: true,
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(courses);
  } catch (err) {
    next(err);
  }
}

export async function getCourseHandler(req, res, next) {
  try {
    const { slug } = req.params;
    const course = await prisma.course.findUnique({
      where: { slug },
      include: {
        department: {
          include: {
            faculty: true,
          },
        },
        books: true,
      },
    });
    if (!course) {
      return res.status(404).json({ error: "درس یافت نشد" });
    }
    res.json(course);
  } catch (err) {
    next(err);
  }
}

export async function createCourseHandler(req, res, next) {
  try {
    const { title, slug, description, thumbnail, professorName, departmentId, ftpPath } = req.body;

    if (!title || !slug || !departmentId) {
      return res.status(400).json({ error: "عنوان، اسلاگ و گروه الزامی است" });
    }

    const existing = await prisma.course.findUnique({ where: { slug } });
    if (existing) {
      return res.status(409).json({ error: "این اسلاگ قبلاً استفاده شده است" });
    }

    const course = await prisma.course.create({
      data: {
        title,
        slug,
        description,
        thumbnail,
        professorName,
        departmentId,
        ftpPath: ftpPath || null,
        createdById: req.user?.id,
      },
      include: {
        department: { include: { faculty: true } },
      },
    });

    try {
      const client = await createFtpClient();
      try {
        const courseFtpPath = `${FTP_ROOT}/courses/${slug}`;
        await client.ensureDir(courseFtpPath);
        if (!ftpPath) {
          await prisma.course.update({
            where: { id: course.id },
            data: { ftpPath: `/courses/${slug}` },
          });
          course.ftpPath = `/courses/${slug}`;
        }
      } finally {
        client.close();
      }
    } catch (err) {
      console.warn(`[courses] Failed to create FTP folder: ${err.message}`);
    }

    res.status(201).json(course);
  } catch (err) {
    next(err);
  }
}

export async function updateCourseHandler(req, res, next) {
  try {
    const { slug } = req.params;
    const { title, description, thumbnail, professorName, departmentId, ftpPath } = req.body;

    const data = {};
    if (title) data.title = title;
    if (description !== undefined) data.description = description;
    if (thumbnail !== undefined) data.thumbnail = thumbnail;
    if (professorName !== undefined) data.professorName = professorName;
    if (departmentId) data.departmentId = departmentId;
    if (ftpPath !== undefined) data.ftpPath = ftpPath;
    data.updatedById = req.user?.id;

    const course = await prisma.course.update({
      where: { slug },
      data,
      include: {
        department: { include: { faculty: true } },
      },
    });

    if (course.ftpPath) {
      try {
        const client = await createFtpClient();
        try {
          await client.ensureDir(resolveFtpPath(course.ftpPath));
        } finally {
          client.close();
        }
      } catch (err) {
        console.warn(`[courses] Failed to create FTP folder: ${err.message}`);
      }
    }

    res.json(course);
  } catch (err) {
    next(err);
  }
}

export async function deleteCourseHandler(req, res, next) {
  try {
    const { slug } = req.params;
    await prisma.course.delete({ where: { slug } });
    res.json({ message: "درس با موفقیت حذف شد" });
  } catch (err) {
    next(err);
  }
}

// ── Faculty Management ──

export async function createFacultyHandler(req, res, next) {
  try {
    const { name, slug } = req.body;
    if (!name || !slug) return res.status(400).json({ error: "نام و اسلاگ الزامی است" });
    const existing = await prisma.faculty.findUnique({ where: { slug } });
    if (existing) return res.status(409).json({ error: "این اسلاگ قبلاً استفاده شده است" });
    const faculty = await prisma.faculty.create({ data: { name, slug } });
    res.status(201).json(faculty);
  } catch (err) { next(err); }
}

export async function updateFacultyHandler(req, res, next) {
  try {
    const { slug } = req.params;
    const { name } = req.body;
    const faculty = await prisma.faculty.update({ where: { slug }, data: { name } });
    res.json(faculty);
  } catch (err) { next(err); }
}

export async function deleteFacultyHandler(req, res, next) {
  try {
    const { slug } = req.params;
    await prisma.faculty.delete({ where: { slug } });
    res.json({ message: "دانشکده با موفقیت حذف شد" });
  } catch (err) { next(err); }
}

// ── Department Management ──

export async function createDepartmentHandler(req, res, next) {
  try {
    const { name, slug, facultyId } = req.body;
    if (!name || !slug || !facultyId) return res.status(400).json({ error: "نام، اسلاگ و دانشکده الزامی است" });
    const dept = await prisma.department.create({ data: { name, slug, facultyId }, include: { faculty: true } });
    res.status(201).json(dept);
  } catch (err) { next(err); }
}

export async function updateDepartmentHandler(req, res, next) {
  try {
    const { id } = req.params;
    const { name, facultyId } = req.body;
    const data = {};
    if (name) data.name = name;
    if (facultyId) data.facultyId = facultyId;
    const dept = await prisma.department.update({ where: { id }, data, include: { faculty: true } });
    res.json(dept);
  } catch (err) { next(err); }
}

export async function deleteDepartmentHandler(req, res, next) {
  try {
    const { id } = req.params;
    await prisma.department.delete({ where: { id } });
    res.json({ message: "گروه با موفقیت حذف شد" });
  } catch (err) { next(err); }
}
