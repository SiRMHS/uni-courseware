import { spawn } from "node:child_process";
import { config } from "../config.js";

/**
 * Executes an lftp command script when LFTP_BIN is configured.
 * All connection params come from environment — no hardcoded hosts or paths.
 */
export function runLftpScript(scriptLines) {
  const lftpBin = process.env.LFTP_BIN;
  if (!lftpBin) {
    const err = new Error("LFTP_BIN env var is not configured");
    err.status = 503;
    throw err;
  }

  const openLine = [
    "set net:timeout 30",
    "set net:max-retries 2",
    "set ftp:ssl-allow no",
    config.ftp.secure ? "set ftp:ssl-force true" : "",
    `open -u ${config.ftp.user},${config.ftp.password} -p ${config.ftp.port} ${config.ftp.host}`,
  ]
    .filter(Boolean)
    .join("; ");

  const fullScript = [openLine, ...scriptLines, "bye"].join("\n");

  return new Promise((resolve, reject) => {
    const proc = spawn(lftpBin, ["-c", fullScript], { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (d) => {
      stdout += d.toString();
    });
    proc.stderr.on("data", (d) => {
      stderr += d.toString();
    });

    proc.on("close", (code) => {
      if (code === 0) resolve({ stdout, stderr });
      else reject(new Error(stderr || stdout || `lftp exited with code ${code}`));
    });
  });
}

export async function lftpMirrorUpload(localPath, remotePath) {
  return runLftpScript([`mirror -R "${localPath}" "${remotePath}"`]);
}

export async function lftpMirrorDownload(remotePath, localPath) {
  return runLftpScript([`mirror "${remotePath}" "${localPath}"`]);
}
