import MockTestResultModel from "../../models/MockTestResult.js";
import { Components } from "../ComponentLoader.js";

const MockTestResultAdminResource = {
  resource: MockTestResultModel,
  options: {
    id: "MockTestResult",
    navigation: { name: "Mock Test Management", icon: "Bookmark" },
    actions: {
      list: {
        actionType: "resource",
        icon: "Trophy",
        label: "Mock Test Results",
        component: Components.MockTestResults,
        handler: async (_request, _response, context) => ({
          currentAdminRole: context.currentAdmin?.role || "",
        }),
      },
      show: { isAccessible: false, isVisible: false },
      new: { isAccessible: false, isVisible: false },
      edit: { isAccessible: false, isVisible: false },
      delete: { isAccessible: false, isVisible: false },
      bulkDelete: { isAccessible: false, isVisible: false },
    },
    properties: {
      results: { isVisible: false },
      generatedBy: { isVisible: false },
      lockedBy: { isVisible: false },
    },
  },
};

export default MockTestResultAdminResource;
