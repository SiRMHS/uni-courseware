import express from "express";
import cors from "cors";
import { config, assertFtpConfig } from "./config.js";
import { ftpPool } from "./services/ftpPool.js";
import { createFtpClient, FTP_ROOT } from "./services/ftpOperations.js";
import path from "node:path";
import {
  getLayoutHandler,
  browseHandler,
  streamHandler,
  uploadHandler,
  deleteHandler,
  mkdirHandler,
} from "./routes/modules.js";
import {
  getFacultiesHandler,
  getDepartmentsHandler,
  getCoursesHandler,
  getCourseHandler,
  createCourseHandler,
  updateCourseHandler,
  deleteCourseHandler,
  createFacultyHandler,
  updateFacultyHandler,
  deleteFacultyHandler,
  createDepartmentHandler,
  updateDepartmentHandler,
  deleteDepartmentHandler,
} from "./routes/courses.js";
import {
  registerHandler,
  loginHandler,
  meHandler,
  updateProfileHandler,
  changePasswordHandler,
} from "./routes/auth.js";
import {
  getUserHandler,
  listUsersHandler,
  createUserHandler,
  updateUserHandler,
  deleteUserHandler,
} from "./routes/users.js";
import {
  getCategoriesHandler,
  createCategoryHandler,
  updateCategoryHandler,
  deleteCategoryHandler,
  getBooksHandler,
  getBookHandler,
  createBookHandler,
  updateBookHandler,
  deleteBookHandler,
  upload,
} from "./routes/books.js";
import { authenticate, requireAnyPermission } from "./middleware/auth.js";
import ftpRouter from "./routes/ftp.js";
import notificationRoutes from "./routes/notifications.js";
import ticketRoutes from "./routes/tickets.js";
import eventRoutes from "./routes/events.js";
import announcementRoutes from "./routes/announcements.js";
import activityRoutes from "./routes/activities.js";
import teamRoutes from "./routes/teams.js";
import permissionRoutes from "./routes/permissions.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "api-server" });
});

// Auth routes
app.post("/api/auth/register", registerHandler);
app.post("/api/auth/login", loginHandler);
app.get("/api/auth/me", authenticate, meHandler);
app.put("/api/auth/profile", authenticate, updateProfileHandler);
app.put("/api/auth/password", authenticate, changePasswordHandler);

// User management (admin only)
const usersRouter = express.Router();

usersRouter.get("/:id", authenticate, getUserHandler);

const usersAdminRouter = express.Router();
usersAdminRouter.use(authenticate, requireAnyPermission("users.view", "users.create", "users.edit", "users.delete"));
usersAdminRouter.get("/", listUsersHandler);
usersAdminRouter.post("/", createUserHandler);
usersAdminRouter.put("/:id", updateUserHandler);
usersAdminRouter.delete("/:id", deleteUserHandler);

app.use("/api/users", usersRouter);
app.use("/api/users", usersAdminRouter);

// Module routes (authenticated for write operations)
const modulesRouter = express.Router();

modulesRouter.get("/:moduleKey/layout", getLayoutHandler);
modulesRouter.get("/:moduleKey/browse/:itemSlug", browseHandler);
modulesRouter.get("/:moduleKey/stream/:itemSlug/*filePath", streamHandler);
modulesRouter.post("/:moduleKey/upload/:itemSlug", authenticate, uploadHandler);
modulesRouter.delete("/:moduleKey/delete/:itemSlug", authenticate, deleteHandler);
modulesRouter.post("/:moduleKey/mkdir/:itemSlug", authenticate, mkdirHandler);

app.use("/api/modules", modulesRouter);

// Course / Faculty / Department — public read
app.get("/api/courses/faculties", getFacultiesHandler);
app.get("/api/courses/departments", getDepartmentsHandler);
app.get("/api/courses", getCoursesHandler);
app.get("/api/courses/:slug", getCourseHandler);

// Course management routes (admin/professor)
const courseManagementRouter = express.Router();
courseManagementRouter.use(authenticate, requireAnyPermission("courses.create", "courses.edit", "courses.delete"));
courseManagementRouter.post("/", createCourseHandler);
courseManagementRouter.put("/:slug", updateCourseHandler);
courseManagementRouter.delete("/:slug", deleteCourseHandler);
app.use("/api/courses/manage", courseManagementRouter);

// Faculty management (admin)
const facultyManagementRouter = express.Router();
facultyManagementRouter.use(authenticate, requireAnyPermission("faculties.create", "faculties.edit", "faculties.delete"));
facultyManagementRouter.post("/", createFacultyHandler);
facultyManagementRouter.put("/:slug", updateFacultyHandler);
facultyManagementRouter.delete("/:slug", deleteFacultyHandler);
app.use("/api/faculties", facultyManagementRouter);

// Department management (admin)
const deptManagementRouter = express.Router();
deptManagementRouter.use(authenticate, requireAnyPermission("departments.create", "departments.edit", "departments.delete"));
deptManagementRouter.post("/", createDepartmentHandler);
deptManagementRouter.put("/:id", updateDepartmentHandler);
deptManagementRouter.delete("/:id", deleteDepartmentHandler);
app.use("/api/departments", deptManagementRouter);

// Book / Category — public read
app.get("/api/books", getBooksHandler);
app.get("/api/books/:slug", getBookHandler);
app.get("/api/categories", getCategoriesHandler);

// Book management (admin/professor)
const bookManagementRouter = express.Router();
bookManagementRouter.use(authenticate, requireAnyPermission("books.create", "books.edit", "books.delete"));
bookManagementRouter.post("/", upload.single("fileUpload"), createBookHandler);
bookManagementRouter.put("/:slug", upload.single("fileUpload"), updateBookHandler);
bookManagementRouter.delete("/:slug", deleteBookHandler);
app.use("/api/books/manage", bookManagementRouter);

// Category management (admin)
const categoryManagementRouter = express.Router();
categoryManagementRouter.use(authenticate, requireAnyPermission("categories.create", "categories.edit", "categories.delete"));
categoryManagementRouter.post("/", createCategoryHandler);
categoryManagementRouter.put("/:slug", updateCategoryHandler);
categoryManagementRouter.delete("/:slug", deleteCategoryHandler);
app.use("/api/categories", categoryManagementRouter);

// FTP routes
app.use("/api/ftp", ftpRouter);
app.use("/api/notifications", notificationRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/activities", activityRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/permissions", permissionRoutes);

app.use((err, _req, res, _next) => {
  const status = err.status ?? 500;
  res.status(status).json({
    error: err.message ?? "خطای داخلی سرور",
  });
});

// Initialize uploads folder on FTP
async function initializeUploadsFolder() {
  try {
    const client = await createFtpClient();
    try {
      const basePath = FTP_ROOT;
      await client.ensureDir(`${basePath}/filamoon_uploads/profiles`);
      await client.ensureDir(`${basePath}/filamoon_uploads/courses`);
      await client.ensureDir(`${basePath}/filamoon_uploads/books`);
      await client.ensureDir(`${basePath}/courses`);
      await client.ensureDir(`${basePath}/books`);
      console.log(`[api-server] Upload folders ensured under ${basePath}`);
    } finally {
      client.close();
    }
  } catch (err) {
    console.warn(`[api-server] Failed to initialize upload folders: ${err.message}`);
  }
}

const shutdown = async () => {
  await ftpPool.destroy();
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

try {
  assertFtpConfig();
} catch (err) {
  console.warn(`[api-server] FTP config warning: ${err.message}`);
  console.warn("[api-server] Server will start but FTP operations will fail until configured.");
}

app.listen(config.port, config.host, async () => {
  console.log(`[api-server] listening on http://${config.host}:${config.port}`);
  await initializeUploadsFolder();
});

export default app;
