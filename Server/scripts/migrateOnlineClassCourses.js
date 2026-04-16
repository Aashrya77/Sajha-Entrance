import mongoose from "mongoose";
import dotenv from "dotenv";
import OnlineClass from "../models/OnlineClass.js";
import { resolveOnlineClassCourses } from "../utils/onlineClassCourses.js";

dotenv.config();

const mongoDbUri = process.env.MONGODB_URI;

if (!mongoDbUri) {
  throw new Error("MONGODB_URI is required to migrate online class courses.");
}

const haveSameCourses = (left = [], right = []) =>
  left.length === right.length && left.every((course, index) => course === right[index]);

const migrateOnlineClassCourses = async () => {
  await mongoose.connect(mongoDbUri);

  try {
    const onlineClasses = await OnlineClass.find({}, "_id classTitle course courses").lean();
    const operations = [];
    let alreadyUpToDate = 0;
    let skipped = 0;

    for (const onlineClass of onlineClasses) {
      const nextCourses = resolveOnlineClassCourses(onlineClass);

      if (!nextCourses.length) {
        skipped += 1;
        console.warn(
          `Skipping ${onlineClass._id} (${onlineClass.classTitle || "Untitled class"}) because no valid course could be resolved.`
        );
        continue;
      }

      const currentCourses = resolveOnlineClassCourses({ courses: onlineClass.courses });
      const needsMigration =
        !haveSameCourses(currentCourses, nextCourses) || Boolean(onlineClass.course);

      if (!needsMigration) {
        alreadyUpToDate += 1;
        continue;
      }

      operations.push({
        updateOne: {
          filter: { _id: onlineClass._id },
          update: {
            $set: { courses: nextCourses },
            $unset: { course: "" },
          },
        },
      });
    }

    if (operations.length > 0) {
      await OnlineClass.bulkWrite(operations);
    }

    console.log(
      JSON.stringify(
        {
          total: onlineClasses.length,
          migrated: operations.length,
          alreadyUpToDate,
          skipped,
        },
        null,
        2
      )
    );
  } finally {
    await mongoose.disconnect();
  }
};

migrateOnlineClassCourses().catch((error) => {
  console.error("Online class course migration failed:", error);
  process.exitCode = 1;
});
