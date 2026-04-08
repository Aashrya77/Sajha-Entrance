import mongoose from "mongoose";

const DEFAULT_LANDING_AD_TITLE = "Ad";

const normalizeLandingAdLink = (value = "") => {
  if (typeof value !== "string") {
    return "";
  }

  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return "";
  }

  if (
    trimmedValue.startsWith("/") ||
    trimmedValue.startsWith("#") ||
    trimmedValue.startsWith("?")
  ) {
    return trimmedValue;
  }

  if (
    /^(?:https?:)?\/\//i.test(trimmedValue) ||
    /^(mailto|tel):/i.test(trimmedValue)
  ) {
    return trimmedValue;
  }

  return `https://${trimmedValue.replace(/^\/+/, "")}`;
};

const LandingAdSchema = new mongoose.Schema({
  title: {
    type: String,
    default: DEFAULT_LANDING_AD_TITLE,
    trim: true,
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
    default: "",
    set: normalizeLandingAdLink,
  },
  position: {
    type: Number,
    min: 1,
    required: true,
    unique: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

LandingAdSchema.pre("validate", async function assignDisplayOrder(next) {
  try {
    if (!this.title?.trim()) {
      this.title = DEFAULT_LANDING_AD_TITLE;
    }

    if (this.position === undefined || this.position === null || this.position === "") {
      const lastLandingAd = await this.constructor
        .findOne()
        .sort({ position: -1 })
        .select("position")
        .lean();

      this.position = (lastLandingAd?.position || 0) + 1;
    }

    const conflictingLandingAd = await this.constructor
      .findOne()
      .where("_id")
      .ne(this._id)
      .where("position")
      .equals(this.position)
      .select("_id")
      .lean();

    if (conflictingLandingAd) {
      this.invalidate("position", "Display order must be unique.");
    }

    next();
  } catch (error) {
    next(error);
  }
});

LandingAdSchema.pre("save", function updateTimestamp(next) {
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
      },
      isActive: {
        type: "boolean",
        isVisible: { list: true, show: true, edit: true, filter: true },
      },
    },
  },
};

export default LandingAdModel;
