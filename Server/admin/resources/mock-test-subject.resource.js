import { Components } from "../ComponentLoader.js";
import MockTestSubjectModel from "../../models/MockTestSubject.js";

const MockTestSubjectAdminResource = {
  resource: MockTestSubjectModel,
  options: {
    id: "MockTestSubject",
    navigation: { name: "Mock Test Management", icon: "Document" },
    listProperties: [
      "name",
      "course",
      "status",
      "totalQuestionCount",
      "questionDraftCount",
      "questionPublishedCount",
      "lastQuestionUploadAt",
    ],
    filterProperties: ["name", "course", "status", "lastQuestionUploadAt"],
    editProperties: ["course", "name", "description", "status", "displayOrder"],
    showProperties: [
      "name",
      "course",
      "slug",
      "description",
      "status",
      "displayOrder",
      "totalQuestionCount",
      "questionDraftCount",
      "questionPublishedCount",
      "lastQuestionUploadAt",
      "createdAt",
      "updatedAt",
    ],
    actions: {
      questionStudio: {
        actionType: "record",
        icon: "Edit",
        label: "Question Studio",
        component: Components.MockQuestionStudio,
        isVisible: false,
        handler: async (_request, _response, context) => ({
          record: context.record.toJSON(context.currentAdmin),
        }),
      },
    },
    properties: {
      course: {
        reference: "MockTestCourse",
      },
      name: {
        isTitle: true,
        description: "Enter the subject name. The slug will be generated automatically.",
      },
      slug: {
        isVisible: { list: false, show: true, edit: false, filter: false },
      },
      description: {
        type: "textarea",
      },
      status: {
        availableValues: [
          { value: "active", label: "Active" },
          { value: "inactive", label: "Inactive" },
        ],
      },
      totalQuestionCount: {
        isVisible: { list: true, show: true, edit: false, filter: false },
      },
      questionDraftCount: {
        isVisible: { list: true, show: true, edit: false, filter: false },
      },
      questionPublishedCount: {
        isVisible: { list: true, show: true, edit: false, filter: false },
      },
      lastQuestionUploadAt: {
        isVisible: { list: true, show: true, edit: false, filter: true },
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

export default MockTestSubjectAdminResource;
