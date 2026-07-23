import mongoose from "mongoose";
import BookModel from "../models/Book.js";

const MIGRATION_ID = "seed-initial-book-store-v1";

const initialBooks = [
  {
    title: "Complete BSc.CSIT Entrance Preparation Guide Book",
    slug: "complete-bsc-csit-entrance-preparation-guide",
    price: 1208,
    originalPrice: 1510,
    discount: 20,
    rating: 4.5,
    reviews: 2341,
    image: "/bookimage/csit.jpg",
    description: "Comprehensive guide covering all topics of BSc.CSIT Entrance with detailed explanations, solved examples, and practice problems. This book is designed to help students.",
    features: ["Chapter-wise detailed theory & Questions", "TU Based Model Sets", "All types of previous year questions", "Points to remember for quick revision", "Answer key"],
    inStock: true,
    isActive: true,
    category: "BSc.CSIT Entrance",
    sortOrder: 1,
  },
  {
    title: "Complete BIT Entrance Preparation Guide Book",
    slug: "complete-bit-entrance-preparation-guide",
    price: 926,
    originalPrice: 1090,
    discount: 15,
    rating: 4.5,
    reviews: 2341,
    image: "/bookimage/bit.jpg",
    description: "Comprehensive guide covering all topics of BIT Entrance with detailed explanations, solved examples, and practice problems.",
    features: ["Chapter-wise detailed theory & Questions", "TU Based Model Sets", "All types of previous year questions", "Points to remember for quick revision", "Answer key"],
    inStock: true,
    isActive: true,
    category: "BIT Entrance",
    sortOrder: 2,
  },
  {
    title: "Complete BCA & CMAT Entrance Preparation Guide Book",
    slug: "complete-bca-cmat-entrance-preparation-guide",
    price: 892,
    originalPrice: 1190,
    discount: 25,
    rating: 4.5,
    reviews: 2341,
    image: "/bookimage/bcacmat.jpg",
    description: "Comprehensive guide covering all topics of BCA and CMAT Entrance with detailed explanations, solved examples, and practice problems.",
    features: ["Chapter-wise detailed theory & Questions", "TU Based Model Sets", "All types of previous year questions", "Points to remember for quick revision", "Answer key"],
    inStock: true,
    isActive: true,
    category: "BCA & CMAT Entrance",
    sortOrder: 3,
  },
];

export const seedInitialBooks = async () => {
  const migrations = mongoose.connection.collection("app_migrations");
  const completedMigration = await migrations.findOne({ _id: MIGRATION_ID });
  if (completedMigration) {
    return 0;
  }

  let created = 0;
  for (const book of initialBooks) {
    const result = await BookModel.updateOne(
      { slug: book.slug },
      { $setOnInsert: book },
      { upsert: true }
    );
    created += result.upsertedCount || 0;
  }

  await migrations.updateOne(
    { _id: MIGRATION_ID },
    { $set: { completedAt: new Date() } },
    { upsert: true }
  );

  return created;
};
