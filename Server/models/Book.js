import mongoose from "mongoose";
import { addSlugField } from "../utils/slug.js";

const BookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    originalPrice: {
      type: Number,
      min: 0,
      default: 0,
    },
    discount: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    reviews: {
      type: Number,
      min: 0,
      default: 0,
    },
    image: String,
    imageMimeType: String,
    imageFilename: String,
    imageSize: Number,
    description: {
      type: String,
      default: "",
    },
    features: {
      type: [String],
      default: [],
    },
    inStock: {
      type: Boolean,
      default: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

addSlugField(BookSchema, "title");

const BookModel = mongoose.model("Book", BookSchema);

export default BookModel;
