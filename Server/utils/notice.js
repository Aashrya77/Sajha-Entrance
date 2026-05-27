import Notice from "../models/Notice.js";

const NOTICE_SORT = {
  updatedAt: -1,
  createdAt: -1,
  _id: -1,
};

const getPublicNotice = async () => {
  const activeNotice = await Notice.findOne({ isActive: true }).sort(NOTICE_SORT).exec();

  if (activeNotice) {
    return activeNotice;
  }

  const hasExplicitActiveState = await Notice.exists({
    isActive: { $in: [true, false] },
  });

  if (hasExplicitActiveState) {
    return null;
  }

  return Notice.findOne().sort(NOTICE_SORT).exec();
};

export { NOTICE_SORT, getPublicNotice };
