import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: resolve(__dirname, "../../../.env") });

export const config = {
  port: Number(process.env.API_PORT ?? 4000),
  host: process.env.API_HOST ?? "0.0.0.0",
  jwtSecret: process.env.JWT_SECRET ?? "dev-secret-change-in-production",
  ftp: {
    host: process.env.FTP_HOST,
    port: Number(process.env.FTP_PORT ?? 21),
    user: process.env.FTP_USER,
    password: process.env.FTP_PASSWORD,
    secure: process.env.FTP_SECURE === "true",
    poolSize: Number(process.env.FTP_POOL_SIZE ?? 5),
    baseRoot: process.env.FTP_BASE_ROOT ?? "/",
    publicDomain: (process.env.FTP_PUBLIC_DOMAIN || "").replace(/\/+$/, ""),
  },
};

export function assertFtpConfig() {
  const missing = [];
  if (!config.ftp.host) missing.push("FTP_HOST");
  if (!config.ftp.user) missing.push("FTP_USER");
  if (!config.ftp.password) missing.push("FTP_PASSWORD");
  if (missing.length) {
    throw new Error(`Missing required FTP env vars: ${missing.join(", ")}`);
  }
}
