import { Readable, Writable } from "node:stream";
import path from "node:path";
import { Client } from "basic-ftp";
import { config } from "../config.js";
import { ftpPool } from "./ftpPool.js";

export const FTP_ROOT = (config.ftp.baseRoot || "/").replace(/\/+$/, "");

export function resolveFtpPath(input) {
  if (!input) return FTP_ROOT;
  let p = String(input).trim().replace(/\\/g, "/");
  if (!p.startsWith("/")) p = "/" + p;
  // If already an absolute FTP path, just normalize it (avoid double prefix)
  if (p.startsWith(FTP_ROOT + "/") || p === FTP_ROOT) return p;
  return path.posix.join(FTP_ROOT, p);
}

export async function createFtpClient() {
  const client = new Client(60000);
  client.ftp.verbose = process.env.FTP_VERBOSE === "true";
  await client.access({
    host: config.ftp.host,
    port: config.ftp.port,
    user: config.ftp.user,
    password: config.ftp.password,
    secure: false,
  });
  return client;
}

export async function buildPublicFileUrl(remotePath) {
  const domain = config.ftp.publicDomain;
  const baseRoot = FTP_ROOT;
  let relative = remotePath;
  if (remotePath.startsWith(baseRoot)) {
    relative = remotePath.slice(baseRoot.length) || "/";
  }
  if (domain) {
    return `${domain}${relative}`;
  }
  return relative;
}

export async function listRemoteDirectory(remotePath) {
  return ftpPool.withClient(async (client) => {
    return client.list(remotePath || "/");
  });
}

/**
 * Returns a readable stream of binary chunks from the remote FTP file.
 * @param {string} remotePath
 * @param {{ startAt?: number }} [options]
 */
export async function createRemoteReadStream(remotePath, options = {}) {
  const client = await ftpPool.acquire();
  const passThrough = new Readable({ read() {} });

  let released = false;

  const release = () => {
    if (released) return;
    released = true;
    try {
      ftpPool.release(client);
    } catch {
      try {
        client.close();
      } catch {
        /* ignore */
      }
    }
  };

  passThrough.on("close", release);
  passThrough.on("error", release);

  const writable = new Writable({
    write(chunk, _encoding, callback) {
      passThrough.push(chunk);
      callback();
    },
    final(callback) {
      passThrough.push(null);
      callback();
    },
  });

  writable.on("error", (err) => {
    passThrough.destroy(err);
    release();
  });

  try {
    await client.downloadTo(writable, remotePath, options.startAt ?? 0);
  } catch (err) {
    passThrough.destroy(err);
    release();
    throw err;
  }

  return passThrough;
}

export async function getRemoteFileSize(remotePath) {
  return ftpPool.withClient(async (client) => {
    const size = await client.size(remotePath);
    return size;
  });
}

export async function uploadRemoteFile(remotePath, readableStream) {
  return ftpPool.withClient(async (client) => {
    await client.uploadFrom(readableStream, remotePath);
  });
}

export async function deleteRemotePath(remotePath) {
  return ftpPool.withClient(async (client) => {
    try {
      await client.remove(remotePath);
    } catch {
      // If remove fails, try removeDir (might be a directory)
      await client.removeDir(remotePath);
    }
  });
}

export async function createRemoteDirectory(remotePath) {
  return ftpPool.withClient(async (client) => {
    await client.ensureDir(remotePath);
  });
}
