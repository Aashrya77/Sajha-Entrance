const QUESTION_BANK_EXAMS = [
  "CEE",
  "IOE",
  "BSc. CSIT",
  "BIT",
  "BCA",
  "CMAT",
  "NEB Class 11",
  "NEB Class 12",
  "Other",
];

const QUESTION_BANK_TYPES = [
  "Model Question",
  "Past Question",
  "Practice Set",
  "Mock Test",
];

const QUESTION_BANK_RESOURCE_TYPES = ["PDF", "Images"];

const QUESTION_BANK_IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const QUESTION_BANK_PDF_MIME_TYPES = ["application/pdf"];

const MAX_QUESTION_BANK_PDF_SIZE_BYTES = 50 * 1024 * 1024;
const MAX_QUESTION_BANK_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;

const toAdminAvailableValues = (values = []) =>
  values.map((value) => ({ value, label: value }));

export {
  MAX_QUESTION_BANK_IMAGE_SIZE_BYTES,
  MAX_QUESTION_BANK_PDF_SIZE_BYTES,
  QUESTION_BANK_EXAMS,
  QUESTION_BANK_IMAGE_MIME_TYPES,
  QUESTION_BANK_PDF_MIME_TYPES,
  QUESTION_BANK_RESOURCE_TYPES,
  QUESTION_BANK_TYPES,
  toAdminAvailableValues,
};
