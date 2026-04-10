import MockTestCourseModel from "../models/MockTestCourse.js";
import MockTestSubjectModel from "../models/MockTestSubject.js";
import MockQuestionModel from "../models/MockQuestion.js";
import MockTestModel, { MockTestAttemptModel } from "../models/MockTest.js";
import { createLogger } from "../utils/logger.js";

const logger = createLogger("mocktest-indexes");

const syncSingleModelIndexes = async (model) => {
  try {
    const droppedIndexes = await model.syncIndexes();

    if (Array.isArray(droppedIndexes) && droppedIndexes.length) {
      logger.info(
        `Removed stale indexes for ${model.modelName}: ${droppedIndexes.join(", ")}`
      );
    } else {
      logger.info(`Indexes verified for ${model.modelName}`);
    }
  } catch (error) {
    logger.error(`Failed to sync indexes for ${model.modelName}:`, error.message);
    throw error;
  }
};

const syncMockTestIndexes = async () => {
  const models = [
    MockTestCourseModel,
    MockTestSubjectModel,
    MockQuestionModel,
    MockTestModel,
    MockTestAttemptModel,
  ];

  for (const model of models) {
    await syncSingleModelIndexes(model);
  }
};

export { syncMockTestIndexes };
