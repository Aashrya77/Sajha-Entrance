import fs from "fs";
import { BaseProvider } from "@adminjs/upload";
import {
  deleteQuestionBankCloudinaryFile,
  getCloudinaryQuestionBankUrl,
  uploadQuestionBankBuffer,
} from "../utils/cloudinaryQuestionBank.js";

export default class CloudinaryUploadProvider extends BaseProvider {
  constructor() {
    super("cloudinary-question-bank");
  }

  async upload(file, key) {
    const buffer = await fs.promises.readFile(file.path);
    try {
      await uploadQuestionBankBuffer(buffer, key);
    } finally {
      await fs.promises.unlink(file.path).catch(() => null);
    }
  }

  async delete(key) {
    await deleteQuestionBankCloudinaryFile(key);
  }

  path(key) {
    return getCloudinaryQuestionBankUrl(key);
  }
}
