import { v2 as cloudinary } from "cloudinary";

const QUESTION_BANK_CLOUDINARY_FOLDER =
  process.env.CLOUDINARY_QUESTION_BANK_FOLDER || "sajha-entrance/past-questions";

const hasExplicitCredentials = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
);

if (hasExplicitCredentials) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

const isCloudinaryQuestionBankEnabled = () =>
  Boolean(process.env.CLOUDINARY_URL || hasExplicitCredentials);

const normalizeKey = (value = "") =>
  String(value || "").replace(/\\/g, "/").replace(/^\/+/, "");

const buildCloudinaryPublicId = (key = "") =>
  `${QUESTION_BANK_CLOUDINARY_FOLDER}/${normalizeKey(key)}`.replace(/\/+/g, "/");

const getCloudinaryQuestionBankUrl = (key = "") => {
  if (!isCloudinaryQuestionBankEnabled() || !key) return "";
  if (/^https:\/\/res\.cloudinary\.com\//i.test(key)) return key;

  return cloudinary.url(buildCloudinaryPublicId(key), {
    resource_type: "raw",
    type: "upload",
    secure: true,
  });
};

const uploadBuffer = (buffer, publicId) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "raw",
        public_id: publicId,
        overwrite: false,
      },
      (error, result) => (error ? reject(error) : resolve(result))
    );
    stream.end(buffer);
  });

const uploadQuestionBankBuffer = async (buffer, key) => {
  if (!isCloudinaryQuestionBankEnabled()) return "";
  const result = await uploadBuffer(buffer, buildCloudinaryPublicId(key));
  return result.secure_url;
};

const extractPublicId = (keyOrUrl = "") => {
  const value = String(keyOrUrl || "");
  const match = value.match(/\/raw\/upload\/(?:v\d+\/)?(.+?)(?:[?#]|$)/i);
  return match ? decodeURIComponent(match[1]) : buildCloudinaryPublicId(value);
};

const deleteQuestionBankCloudinaryFile = async (keyOrUrl = "") => {
  if (!isCloudinaryQuestionBankEnabled() || !keyOrUrl) return;
  await cloudinary.uploader.destroy(extractPublicId(keyOrUrl), {
    resource_type: "raw",
    invalidate: true,
  });
};

export {
  deleteQuestionBankCloudinaryFile,
  getCloudinaryQuestionBankUrl,
  isCloudinaryQuestionBankEnabled,
  uploadQuestionBankBuffer,
};
