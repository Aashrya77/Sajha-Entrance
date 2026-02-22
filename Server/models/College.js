import mongoose from "mongoose";
import { Schema } from "mongoose";

export const CollegeSchema = new mongoose.Schema({
  // Basic Information
  collegeName: {
    type: String,
    default: "College Name"
  },
  collegeAddress: {
    type: String,
    default: "College Address"
  },
  collegePhone: String,
  collegeEmail: String,
  universityName: String,
  establishedYear: Number,
  website: String,

  // Media
  collegeLogo: String,
  collegeCover: String,

  // Content Management
  admissionNotice: {
    type: String,
    default: ""
  },
  admissionCloseDate: {
    type: Date,
    default: null
  },
  overview: {
    type: String,
    default: ""
  },
  admissionGuidelines: {
    type: String,
    default: ""
  },
  scholarshipInfo: {
    type: String,
    default: ""
  },
  messageFromChairman: {
    type: String,
    default: ""
  },
  chairmanName: {
    type: String,
    default: ""
  },
  chairmanMessage: {
    type: String,
    default: ""
  },
  chairmanImage: String,
  keyFeatures: [String],
  gallery: [String],
  googleMapUrl: {
    type: String,
    default: ""
  },
  videos: [
    {
      title: String,
      url: String
    }
  ],

  // Relationships
  coursesOffered: [
    {
      type: Schema.Types.ObjectId,
      ref: "Course",
    },
  ],

  // Metadata
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
CollegeSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const CollegeModel = mongoose.model("College", CollegeSchema);

export const CollegeFileModel = {
  resource: CollegeModel,
  options: {
    id: 'College',
    properties: {
      // Basic Information - Always Visible
      collegeName: {
        type: "string",
        isVisible: {
          list: true,
          show: true,
          edit: true,
          filter: true,
        },
      },
      collegeAddress: {
        type: "string",
        isVisible: {
          list: true,
          show: true,
          edit: true,
          filter: true,
        },
      },
      universityName: {
        type: "string",
        isVisible: {
          list: true,
          show: true,
          edit: true,
          filter: true,
        },
      },
      establishedYear: {
        type: "number",
        isVisible: {
          list: true,
          show: true,
          edit: true,
          filter: true,
        },
      },

      // Contact Information
      collegePhone: {
        type: "string",
        isVisible: {
          list: false,
          show: true,
          edit: true,
          filter: false,
        },
      },
      collegeEmail: {
        type: "string",
        isVisible: {
          list: false,
          show: true,
          edit: true,
          filter: false,
        },
      },
      website: {
        type: "string",
        isVisible: {
          list: false,
          show: true,
          edit: true,
          filter: false,
        },
      },

      // Content Management
      admissionNotice: {
        type: "string",
        isVisible: {
          list: false,
          show: true,
          edit: true,
          filter: false,
        },
      },
      admissionCloseDate: {
        type: "date",
        isVisible: {
          list: false,
          show: true,
          edit: true,
          filter: false,
        },
      },
      overview: {
        type: "richtext",
        isVisible: {
          list: false,
          show: true,
          edit: true,
          filter: false,
        },
      },
      admissionGuidelines: {
        type: "richtext",
        isVisible: {
          list: false,
          show: true,
          edit: true,
          filter: false,
        },
      },
      scholarshipInfo: {
        type: "richtext",
        isVisible: {
          list: false,
          show: true,
          edit: true,
          filter: false,
        },
      },
      messageFromChairman: {
        type: "richtext",
        isVisible: {
          list: false,
          show: true,
          edit: true,
          filter: false,
        },
      },
      chairmanName: {
        type: "string",
        isVisible: {
          list: false,
          show: true,
          edit: true,
          filter: false,
        },
      },
      chairmanMessage: {
        type: "richtext",
        isVisible: {
          list: false,
          show: true,
          edit: true,
          filter: false,
        },
      },
      chairmanImage: {
        type: "string",
        isVisible: {
          list: false,
          show: true,
          edit: true,
          filter: false,
        },
      },
      keyFeatures: {
        type: "textarea",
        isVisible: {
          list: false,
          show: true,
          edit: true,
          filter: false,
        },
      },
      gallery: {
        type: "textarea",
        isVisible: {
          list: false,
          show: true,
          edit: true,
          filter: false,
        },
      },
      googleMapUrl: {
        type: "string",
        isVisible: {
          list: false,
          show: true,
          edit: true,
          filter: false,
        },
      },
      videos: {
        type: "textarea",
        isVisible: {
          list: false,
          show: true,
          edit: true,
          filter: false,
        },
      },

      // Courses Relationship
      coursesOffered: {
        type: "reference",
        isVisible: {
          list: false,
          show: true,
          edit: true,
          filter: false,
        },
      },
    },
  },
};

export default CollegeModel;
