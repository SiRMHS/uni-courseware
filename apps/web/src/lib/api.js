import { uploadFileWithProgress } from "./upload";

const API_BASE = "/api/proxy";

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function apiFetch(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
      ...options.headers,
    },
  });
  if (res.status === 401) {
    localStorage.removeItem("token");
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    throw new Error("نشست شما منقضی شده است");
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "خطا در ارتباط با سرور");
  }
  return res.json();
}

// ── Auth ──

export async function registerUser({ name, username, email, studentId, password, role }) {
  return apiFetch(`${API_BASE}/auth/register`, {
    method: "POST",
    body: JSON.stringify({ name, username, email, studentId, password, role }),
  });
}

export async function loginUser({ email, username, password }) {
  return apiFetch(`${API_BASE}/auth/login`, {
    method: "POST",
    body: JSON.stringify({ email, username, password }),
  });
}

export async function fetchMe() {
  return apiFetch(`${API_BASE}/auth/me`);
}

// ── Users (admin) ──

export async function fetchUsers() {
  return apiFetch(`${API_BASE}/users`);
}

export async function createUser(data) {
  return apiFetch(`${API_BASE}/users`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateUser(id, data) {
  return apiFetch(`${API_BASE}/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteUser(id) {
  return apiFetch(`${API_BASE}/users/${id}`, { method: "DELETE" });
}

// ── Modules ──

export async function fetchModuleLayout(moduleKey) {
  const res = await fetch(`${API_BASE}/modules/${moduleKey}/layout`, {
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "خطا در دریافت ساختار ماژول");
  }
  return res.json();
}

export async function browseDirectory(moduleKey, itemSlug, subpath = "") {
  const params = new URLSearchParams();
  if (subpath) params.set("subpath", subpath);
  const qs = params.toString();
  const url = `${API_BASE}/modules/${moduleKey}/browse/${itemSlug}${qs ? `?${qs}` : ""}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "خطا در مرور پوشه");
  }
  return res.json();
}

export function getStreamUrl(moduleKey, itemSlug, fileSubpath) {
  const encoded = fileSubpath
    .split("/")
    .map(encodeURIComponent)
    .join("/");
  return `${API_BASE}/modules/${moduleKey}/stream/${itemSlug}/${encoded}`;
}

export async function uploadFile(moduleKey, itemSlug, file, subpath = "") {
  const params = new URLSearchParams({ filename: file.name });
  if (subpath) params.set("subpath", subpath);
  const res = await fetch(
    `${API_BASE}/modules/${moduleKey}/upload/${itemSlug}?${params}`,
    { method: "POST", body: file }
  );
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "خطا در بارگذاری فایل");
  }
  return res.json();
}

export async function createFolder(moduleKey, itemSlug, folderName, subpath = "") {
  const res = await fetch(`${API_BASE}/modules/${moduleKey}/mkdir/${itemSlug}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ folderName, subpath }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "خطا در ایجاد پوشه");
  }
  return res.json();
}

export async function fetchFtpFolders(path = "") {
  const params = new URLSearchParams();
  if (path) params.set("path", path);
  const res = await fetch(`${API_BASE}/ftp/list-remote?${params}`, {
    headers: authHeaders(),
    cache: "no-store",
  });
  if (!res.ok) throw new Error("خطا در دریافت پوشه‌های FTP");
  return res.json();
}

// ── Courses (public) ──

export async function fetchCourses() {
  const res = await fetch(`${API_BASE}/courses`, { cache: "no-store" });
  if (!res.ok) throw new Error("خطا در دریافت لیست دروس");
  return res.json();
}

export async function fetchCourse(slug) {
  const res = await fetch(`${API_BASE}/courses/${slug}`, { cache: "no-store" });
  if (!res.ok) throw new Error("درس یافت نشد");
  return res.json();
}

export async function fetchFaculties() {
  const res = await fetch(`${API_BASE}/courses/faculties`, { cache: "no-store" });
  if (!res.ok) throw new Error("خطا در دریافت دانشکده‌ها");
  return res.json();
}

export async function fetchDepartments() {
  const res = await fetch(`${API_BASE}/courses/departments`, { cache: "no-store" });
  if (!res.ok) throw new Error("خطا در دریافت گروه‌ها");
  return res.json();
}

// ── Courses (management) ──

export async function createCourse(data) {
  return apiFetch(`${API_BASE}/courses/manage`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateCourse(slug, data) {
  return apiFetch(`${API_BASE}/courses/manage/${slug}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteCourse(slug) {
  return apiFetch(`${API_BASE}/courses/manage/${slug}`, { method: "DELETE" });
}

// ── Faculty Management ──

export async function createFaculty(data) {
  return apiFetch(`${API_BASE}/faculties`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateFaculty(slug, data) {
  return apiFetch(`${API_BASE}/faculties/${slug}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteFaculty(slug) {
  return apiFetch(`${API_BASE}/faculties/${slug}`, { method: "DELETE" });
}

// ── Department Management ──

export async function createDepartment(data) {
  return apiFetch(`${API_BASE}/departments`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateDepartment(id, data) {
  return apiFetch(`${API_BASE}/departments/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteDepartment(id) {
  return apiFetch(`${API_BASE}/departments/${id}`, { method: "DELETE" });
}

// ── Categories ──

export async function fetchCategories() {
  const res = await fetch(`${API_BASE}/categories`, { cache: "no-store" });
  if (!res.ok) throw new Error("خطا در دریافت دسته‌بندی‌ها");
  return res.json();
}

export async function createCategory(data) {
  return apiFetch(`${API_BASE}/categories`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateCategory(slug, data) {
  return apiFetch(`${API_BASE}/categories/${slug}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteCategory(slug) {
  return apiFetch(`${API_BASE}/categories/${slug}`, { method: "DELETE" });
}

// ── Books (public) ──

export async function fetchBooks() {
  const res = await fetch(`${API_BASE}/books`, { cache: "no-store" });
  if (!res.ok) throw new Error("خطا در دریافت کتاب‌ها");
  return res.json();
}

export async function fetchBook(slug) {
  const res = await fetch(`${API_BASE}/books/${slug}`, { cache: "no-store" });
  if (!res.ok) throw new Error("کتاب یافت نشد");
  return res.json();
}

// ── Books (management) ──

export async function createBook(data) {
  return apiFetch(`${API_BASE}/books/manage`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateBook(slug, data) {
  return apiFetch(`${API_BASE}/books/manage/${slug}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteBook(slug) {
  return apiFetch(`${API_BASE}/books/manage/${slug}`, { method: "DELETE" });
}

export async function deleteEntry(moduleKey, itemSlug, subpath) {
  const params = new URLSearchParams({ subpath });
  const res = await fetch(
    `${API_BASE}/modules/${moduleKey}/delete/${itemSlug}?${params}`,
    { method: "DELETE", headers: { ...authHeaders() } }
  );
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "خطا در حذف");
  }
  return res.json();
}

// ── Tickets ──

export async function fetchTickets() {
  return apiFetch(`${API_BASE}/tickets`);
}

export async function fetchTicket(id) {
  return apiFetch(`${API_BASE}/tickets/${id}`);
}

export async function createTicket(data) {
  return apiFetch(`${API_BASE}/tickets`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function sendTicketMessage(ticketId, body) {
  return apiFetch(`${API_BASE}/tickets/${ticketId}/messages`, {
    method: "POST",
    body: JSON.stringify({ body }),
  });
}

export async function updateTicket(ticketId, data) {
  return apiFetch(`${API_BASE}/tickets/${ticketId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteTicket(ticketId) {
  return apiFetch(`${API_BASE}/tickets/${ticketId}`, { method: "DELETE" });
}

// ── User Profile ──

export async function updateProfile(data) {
  return apiFetch(`${API_BASE}/auth/profile`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function changePassword(data) {
  return apiFetch(`${API_BASE}/auth/password`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

// ── FTP ──

export async function ftpList(path = "") {
  const params = new URLSearchParams();
  if (path) params.set("path", path);
  const res = await fetch(`${API_BASE}/ftp/list-remote?${params}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("خطا در دریافت لیست فایل‌ها");
  return res.json();
}

export async function ftpUpload(path, file) {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_BASE}/ftp/upload?path=${encodeURIComponent(path)}`, {
    method: "POST",
    headers: authHeaders(),
    body: formData,
  });
  if (!res.ok) throw new Error("خطا در آپلود فایل");
  return res.json();
}

export async function ftpMkdir(path, name) {
  return apiFetch(`${API_BASE}/ftp/mkdir`, {
    method: "POST",
    body: JSON.stringify({ path, name }),
  });
}

export async function ftpDelete(path, fileId) {
  return apiFetch(`${API_BASE}/ftp/delete`, {
    method: "DELETE",
    body: JSON.stringify({ path, fileId }),
  });
}

// ── Media Manager ──

export async function fetchMediaFiles({ folder = "/uploads", search, type } = {}) {
  const params = new URLSearchParams();
  if (folder) params.set("folder", folder);
  if (search) params.set("search", search);
  if (type) params.set("type", type);
  const res = await fetch(`${API_BASE}/ftp/media?${params}`, {
    headers: authHeaders(),
    cache: "no-store",
  });
  if (!res.ok) throw new Error("خطا در دریافت لیست فایل‌ها");
  return res.json();
}

export async function fetchAllMediaFiles({ folder, search, type, userId } = {}) {
  const params = new URLSearchParams();
  if (folder) params.set("folder", folder);
  if (search) params.set("search", search);
  if (type) params.set("type", type);
  if (userId) params.set("userId", userId);
  const res = await fetch(`${API_BASE}/ftp/media/all?${params}`, {
    headers: authHeaders(),
    cache: "no-store",
  });
  if (!res.ok) throw new Error("خطا در دریافت لیست فایل‌ها");
  return res.json();
}

export async function uploadMediaFile(file, folder = "/filamoon_uploads") {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_BASE}/ftp/upload?path=${encodeURIComponent(folder)}&folder=${encodeURIComponent(folder)}`, {
    method: "POST",
    headers: authHeaders(),
    body: formData,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "خطا در آپلود فایل");
  }
  return res.json();
}

// ── FTP Admin Operations ──

export async function uploadToFtp(file, path, { onProgress, signal } = {}) {
  if (onProgress || signal) {
    return uploadFileWithProgress({
      url: `${API_BASE}/ftp/upload?path=${encodeURIComponent(path)}`,
      file,
      headers: authHeaders(),
      onProgress,
      signal,
    });
  }
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_BASE}/ftp/upload?path=${encodeURIComponent(path)}`, {
    method: "POST",
    headers: authHeaders(),
    body: formData,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || "خطا در آپلود");
  }
  return res.json();
}

export async function createFtpFolder(path, name) {
  return apiFetch(`${API_BASE}/ftp/mkdir`, {
    method: "POST",
    body: JSON.stringify({ path, name }),
  });
}

export async function renameFtpItem(path, newName) {
  return apiFetch(`${API_BASE}/ftp/rename`, {
    method: "POST",
    body: JSON.stringify({ path, newName }),
  });
}

export async function deleteFtpItem(path) {
  return apiFetch(`${API_BASE}/ftp/delete`, {
    method: "POST",
    body: JSON.stringify({ path }),
  });
}

// ── Display Names (File Metadata) ──

export async function fetchDisplayNames() {
  const res = await fetch(`${API_BASE}/ftp/display-names`, {
    headers: authHeaders(),
    cache: "no-store",
  });
  if (!res.ok) throw new Error("خطا در دریافت متادیتا");
  return res.json();
}

export async function upsertDisplayName(data) {
  return apiFetch(`${API_BASE}/ftp/display-names`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ── Book Upload with File ──

export async function createBookWithFile(formData) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE}/books/manage`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "خطا در ایجاد کتاب");
  }
  return res.json();
}

// ── Notifications ──

export async function fetchNotifications() {
  const res = await fetch(`${API_BASE}/notifications`, {
    headers: authHeaders(),
    cache: "no-store",
  });
  if (!res.ok) throw new Error("خطا در دریافت اعلان‌ها");
  return res.json();
}

export async function createNotification(data) {
  return apiFetch(`${API_BASE}/notifications`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function deleteNotification(id) {
  return apiFetch(`${API_BASE}/notifications/${id}`, { method: "DELETE" });
}

// ── Announcements ──

export async function fetchAnnouncements() {
  const res = await fetch(`${API_BASE}/announcements`, { cache: "no-store" });
  if (!res.ok) throw new Error("خطا در دریافت اعلامیه‌ها");
  return res.json();
}

export async function fetchPublishedAnnouncements() {
  const res = await fetch(`${API_BASE}/announcements/published`, { cache: "no-store" });
  if (!res.ok) throw new Error("خطا در دریافت اعلامیه‌ها");
  return res.json();
}

export async function createAnnouncement(data) {
  return apiFetch(`${API_BASE}/announcements`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateAnnouncement(id, data) {
  return apiFetch(`${API_BASE}/announcements/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteAnnouncement(id) {
  return apiFetch(`${API_BASE}/announcements/${id}`, { method: "DELETE" });
}

// ── User Activities ──

export async function logActivity(data) {
  return apiFetch(`${API_BASE}/activities`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function fetchUserActivities(userId) {
  const res = await fetch(`${API_BASE}/activities/user/${userId}`, {
    headers: { ...authHeaders() },
    cache: "no-store",
  });
  if (!res.ok) throw new Error("خطا در دریافت فعالیت‌ها");
  return res.json();
}

// ── Calendar Events ──

export async function fetchEvents() {
  return apiFetch(`${API_BASE}/events`);
}

export async function createEvent(data) {
  return apiFetch(`${API_BASE}/events`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateEvent(id, data) {
  return apiFetch(`${API_BASE}/events/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteEvent(id) {
  return apiFetch(`${API_BASE}/events/${id}`, { method: "DELETE" });
}

export async function updateBookWithFile(slug, formData) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE}/books/manage/${slug}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "خطا در بروزرسانی کتاب");
  }
  return res.json();
}

// ── Teams ──

export async function fetchTeams() {
  return apiFetch(`${API_BASE}/teams`);
}

export async function createTeam(data) {
  return apiFetch(`${API_BASE}/teams`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateTeam(id, data) {
  return apiFetch(`${API_BASE}/teams/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteTeam(id) {
  return apiFetch(`${API_BASE}/teams/${id}`, { method: "DELETE" });
}

export async function addTeamMember(teamId, userId, role) {
  return apiFetch(`${API_BASE}/teams/${teamId}/members`, {
    method: "POST",
    body: JSON.stringify({ userId, role }),
  });
}

export async function updateTeamMember(teamId, memberId, data) {
  return apiFetch(`${API_BASE}/teams/${teamId}/members/${memberId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function removeTeamMember(teamId, memberId) {
  return apiFetch(`${API_BASE}/teams/${teamId}/members/${memberId}`, { method: "DELETE" });
}
