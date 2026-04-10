import MockTestModel from "../../models/MockTest.js";
import { Components } from "../ComponentLoader.js";

const MockTestAdminResource = {
  resource: MockTestModel,
  options: {
    id: "MockTest",
    navigation: { name: "Mock Test Management", icon: "Calendar" },
    listProperties: [
      "title",
      "courseName",
      "status",
      "startAt",
      "endAt",
      "questionCount",
      "totalMarks",
    ],
    filterProperties: ["title", "courseName", "status", "startAt", "endAt"],
    showProperties: [
      "title",
      "slug",
      "description",
      "instructions",
      "courseName",
      "subjectNames",
      "status",
      "questionCount",
      "totalMarks",
      "passMarks",
      "duration",
      "startAt",
      "endAt",
      "publishedAt",
      "createdAt",
      "updatedAt",
    ],
    editProperties: [],
    actions: {
      list: {
        actionType: "resource",
        icon: "Calendar",
        label: "Mock Test Workspace",
        component: Components.MockTestWorkspace,
        handler: async () => ({}),
      },
      new: {
        isAccessible: false,
        isVisible: false,
      },
      edit: {
        isAccessible: false,
        isVisible: false,
      },
      scheduler: {
        actionType: "resource",
        icon: "Calendar",
        label: "Mock Test Workspace",
        component: Components.MockTestWorkspace,
        handler: async () => ({}),
        isVisible: false,
      },
      delete: {
        guard: "Delete this mock test? Existing student attempts will remain for audit history.",
      },
    },
    properties: {
      title: {
        isTitle: true,
      },
      description: {
        type: "textarea",
      },
      instructions: {
        type: "textarea",
      },
      subjectNames: {
        isVisible: { list: false, show: true, edit: false, filter: false },
      },
      questionCount: {
        isVisible: { list: true, show: true, edit: false, filter: false },
      },
      totalMarks: {
        isVisible: { list: true, show: true, edit: false, filter: false },
      },
      passMarks: {
        isVisible: { list: false, show: true, edit: false, filter: false },
      },
      duration: {
        isVisible: { list: false, show: true, edit: false, filter: false },
      },
      startAt: {
        isVisible: { list: true, show: true, edit: false, filter: true },
      },
      endAt: {
        isVisible: { list: true, show: true, edit: false, filter: true },
      },
      publishedAt: {
        isVisible: { list: false, show: true, edit: false, filter: true },
      },
      createdAt: {
        isVisible: { list: false, show: true, edit: false, filter: false },
      },
      updatedAt: {
        isVisible: { list: false, show: true, edit: false, filter: false },
      },
    },
  },
};

export default MockTestAdminResource;
