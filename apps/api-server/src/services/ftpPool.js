import { Client } from "basic-ftp";
import { config } from "../config.js";

/**
 * Simple FTP connection pool with graceful acquire/release.
 */
export class FtpPool {
  #pool = [];
  #active = 0;
  #waitQueue = [];

  constructor(size = config.ftp.poolSize) {
    this.size = size;
  }

  async #createClient() {
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

  async acquire() {
    if (this.#pool.length > 0) {
      return this.#pool.pop();
    }

    if (this.#active < this.size) {
      this.#active++;
      return this.#createClient();
    }

    return new Promise((resolve) => {
      this.#waitQueue.push(resolve);
    });
  }

  release(client) {
    if (this.#waitQueue.length > 0) {
      const next = this.#waitQueue.shift();
      next(client);
      return;
    }
    this.#pool.push(client);
  }

  async withClient(fn) {
    const client = await this.acquire();
    try {
      return await fn(client);
    } finally {
      try {
        this.release(client);
      } catch {
        this.#active--;
        try {
          client.close();
        } catch {
          /* ignore */
        }
      }
    }
  }

  async destroy() {
    const all = [...this.#pool];
    this.#pool = [];
    for (const client of all) {
      try {
        client.close();
      } catch {
        /* ignore */
      }
    }
    this.#active = 0;
  }
}

export const ftpPool = new FtpPool();
