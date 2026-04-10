import MockQuestionModel from "../../models/MockQuestion.js";

const hiddenAction = {
  isAccessible: false,
  isVisible: false,
};

const MockQuestionAdminResource = {
  resource: MockQuestionModel,
  options: {
    id: "MockQuestion",
    navigation: false,
    actions: {
      list: hiddenAction,
      show: hiddenAction,
      search: hiddenAction,
      new: hiddenAction,
      edit: hiddenAction,
      delete: hiddenAction,
      bulkDelete: hiddenAction,
    },
    properties: {
      questionText: {
        isTitle: true,
      },
    },
  },
};

export default MockQuestionAdminResource;
