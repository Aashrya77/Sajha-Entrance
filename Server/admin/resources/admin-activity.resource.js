import AdminActivityModel from "../../models/AdminActivity.js";

const AdminActivityAdminResource = {
  resource: AdminActivityModel,
  options: {
    id: "AdminActivity",
    navigation: { name: "Administration", icon: "Activity" },
    listProperties: ["createdAt", "actorName", "action", "resource", "message"],
    showProperties: [
      "createdAt",
      "actorName",
      "actorEmail",
      "actorRole",
      "action",
      "resource",
      "recordId",
      "message",
      "meta",
    ],
    filterProperties: ["actorName", "actorEmail", "actorRole", "action", "resource", "createdAt"],
    actions: {
      new: { isAccessible: false },
      edit: { isAccessible: false },
      delete: { isAccessible: false },
      bulkDelete: { isAccessible: false },
    },
    properties: {
      actorName: {
        label: "Member",
      },
      actorEmail: {
        label: "Email",
      },
      actorRole: {
        label: "Role",
      },
      recordId: {
        label: "Record ID",
      },
      meta: {
        type: "textarea",
      },
    },
  },
};

export default AdminActivityAdminResource;
