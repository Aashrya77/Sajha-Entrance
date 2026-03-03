import mongoose from "mongoose";
import { Schema } from "mongoose";

export const UniversitySchema = new mongoose.Schema({
  // Basic Information
  universityName: {
    type: String,
    default: "University Name"
  },
  universityAddress: {
    type: String,
    default: "University Address"
  },
  universityPhone: String,
  universityEmail: String,
  establishedYear: Number,
  website: String,
  type: {
    type: String,
    enum: ["Public", "Private", "Deemed", "Autonomous"],
    default: "Public"
  },

  // Media
  universityLogo: String,
  universityCover: String,

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
  messageFromChancellor: {
    type: String,
    default: ""
  },
  chancellorName: {
    type: String,
    default: ""
  },
  chancellorMessage: {
    type: String,
    default: ""
  },
  chancellorImage: String,
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
  affiliatedColleges: [
    {
      type: Schema.Types.ObjectId,
      ref: "College",
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
UniversitySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const UniversityModel = mongoose.model("University", UniversitySchema);

export const UniversityFileModel = {
  resource: UniversityModel,
  options: {
    id: 'University',
    properties: {
      // Basic Information - Always Visible
      universityName: {
        type: "string",
        isVisible: {
          list: true,
          show: true,
          edit: true,
          filter: true,
        },
      },
      universityAddress: {
        type: "string",
        isVisible: {
          list: true,
          show: true,
          edit: true,
          filter: true,
        },
      },
      type: {
        type: "string",
        isVisible: {
          list: true,
          show: true,
          edit: true,
          filter: true,
        },
        availableValues: [
          { value: "Public", label: "Public" },
          { value: "Private", label: "Private" },
          { value: "Deemed", label: "Deemed" },
          { value: "Autonomous", label: "Autonomous" },
        ],
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
      universityPhone: {
        type: "string",
        isVisible: {
          list: false,
          show: true,
          edit: true,
          filter: false,
        },
      },
      universityEmail: {
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
      messageFromChancellor: {
        type: "richtext",
        isVisible: {
          list: false,
          show: true,
          edit: true,
          filter: false,
        },
      },
      chancellorName: {
        type: "string",
        isVisible: {
          list: false,
          show: true,
          edit: true,
          filter: false,
        },
      },
      chancellorMessage: {
        type: "richtext",
        isVisible: {
          list: false,
          show: true,
          edit: true,
          filter: false,
        },
      },
      chancellorImage: {
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

      // Relationships
      coursesOffered: {
        type: "reference",
        isVisible: {
          list: false,
          show: true,
          edit: true,
          filter: false,
        },
      },
      affiliatedColleges: {
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

export default UniversityModel;
