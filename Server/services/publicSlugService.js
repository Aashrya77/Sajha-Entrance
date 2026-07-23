import BlogModel from "../models/Blog.js";
import CollegeModel from "../models/College.js";
import CourseModel from "../models/Course.js";
import UniversityModel from "../models/University.js";
import BookModel from "../models/Book.js";
import { backfillModelSlugs } from "../utils/slug.js";

const SLUG_MODELS = [
  { model: CollegeModel, sourceField: "collegeName" },
  { model: UniversityModel, sourceField: "universityName" },
  { model: CourseModel, sourceField: "title" },
  { model: BlogModel, sourceField: "blogTitle" },
  { model: BookModel, sourceField: "title" },
];

export const backfillPublicSlugs = async () => {
  const counts = await Promise.all(
    SLUG_MODELS.map(({ model, sourceField }) => backfillModelSlugs(model, sourceField))
  );

  return counts.reduce((total, count) => total + count, 0);
};
