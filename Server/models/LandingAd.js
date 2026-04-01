import mongoose from "mongoose";

const LandingAdSchema = new mongoose.Schema({
  title: {
    type: String,
    default: "Ad"
  },
  adImage: {
    type: String,
    default: ""
  },
  landingAdImageMimeType: {
    type: String,
    default: ""
  },
  landingAdImageFilename: {
    type: String,
    default: ""
  },
  landingAdImageSize: {
    type: Number,
    default: 0
  },
  adLink: {
    type: String,
    default: ""
  },
  position: {
    type: Number,
    enum: [1, 2, 3, 4],
    required: true,
    unique: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

LandingAdSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const LandingAdModel = mongoose.model("LandingAd", LandingAdSchema);

export const LandingAdFileModel = {
  resource: LandingAdModel,
  options: {
    id: 'LandingAd',
    navigation: { name: 'Content', icon: 'Image' },
    properties: {
      title: {
        type: "string",
        isVisible: { list: true, show: true, edit: true, filter: true },
      },
      adImage: {
        type: "string",
        isVisible: { list: true, show: true, edit: true, filter: false },
      },
      adLink: {
        type: "string",
        isVisible: { list: false, show: true, edit: true, filter: false },
      },
      position: {
        type: "number",
        isVisible: { list: true, show: true, edit: true, filter: true },
        availableValues: [
          { value: 1, label: "Ad Slot 1 (Top)" },
          { value: 2, label: "Ad Slot 2" },
          { value: 3, label: "Ad Slot 3" },
          { value: 4, label: "Ad Slot 4 (Bottom)" },
        ],
      },
      isActive: {
        type: "boolean",
        isVisible: { list: true, show: true, edit: true, filter: true },
      },
    },
  },
};

export default LandingAdModel;
