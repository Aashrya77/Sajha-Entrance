import MockTestCourseModel from "../../models/MockTestCourse.js";

const MockTestCourseAdminResource = {
  resource: MockTestCourseModel,
  options: {
    id: "MockTestCourse",
    navigation: { name: "Mock Test Management", icon: "Bookmark" },
    listProperties: ["name", "slug", "status", "createdAt"],
    filterProperties: ["name", "slug", "status", "createdAt"],
    editProperties: ["name", "description", "status"],
    showProperties: ["name", "slug", "description", "status", "createdAt", "updatedAt"],
    properties: {
      name: {
        isTitle: true,
        description: "Enter the course name. The slug will be generated automatically.",
      },
      slug: {
        isVisible: { list: true, show: true, edit: false, filter: true },
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
      createdAt: {
        isVisible: { list: true, show: true, edit: false, filter: true },
      },
      updatedAt: {
        isVisible: { list: false, show: true, edit: false, filter: false },
      },
    },
  },
};

export default MockTestCourseAdminResource;
