import fs, { existsSync } from "fs";
import { move } from "fs-extra";
import path from "path";
import { BaseProvider } from "@adminjs/upload";

const normalizeBaseUrl = (value = "/") => {
  const normalized = value.replace(/\\/g, "/").replace(/^\/+|\/+$/g, "");
  return normalized ? `/${normalized}` : "/";
};

const normalizeStorageKey = (key = "") =>
  key.replace(/\\/g, "/").replace(/^\/+/, "");

export default class UploadProvider extends BaseProvider {
  constructor(options) {
    super(options.bucket, options?.opts);
    this.storageRoot = options.bucket;
    this.baseUrl = normalizeBaseUrl(options.baseUrl);

    if (!existsSync(this.storageRoot)) {
      fs.mkdirSync(this.storageRoot, { recursive: true });
    }
  }

  resolveFilePath(key, bucket = this.storageRoot) {
    const normalizedKey = normalizeStorageKey(key);
    return path.join(bucket, ...normalizedKey.split("/"));
  }

  async upload(file, key) {
    const filePath = this.resolveFilePath(key);
    await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
    await move(file.path, filePath, { overwrite: true });
  }

  async delete(key, bucket) {
    const filePath = this.resolveFilePath(key, bucket);

    if (existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
  }

  path(key) {
    const normalizedKey = normalizeStorageKey(key);
    return this.baseUrl === "/"
      ? `/${normalizedKey}`
      : `${this.baseUrl}/${normalizedKey}`;
  }
}
