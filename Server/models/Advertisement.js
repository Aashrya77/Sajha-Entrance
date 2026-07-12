import mongoose from "mongoose";

export const ADVERTISEMENT_PAGES = [
  "home",
  "courses",
  "colleges",
  "universities",
  "admissions",
  "mock-tests",
];

export const AdvertisementScheme = new mongoose.Schema({
  advertisementName: { type: String, trim: true },
  advertisementFile: { type: String, default: "" },
  advertisementImageMimeType: { type: String, default: "" },
  advertisementImageFilename: { type: String, default: "" },
  advertisementImageSize: { type: Number, default: 0 },
  advertisementLink: { type: String, trim: true, default: "" },
  displayPages: {
    type: [{ type: String, enum: ADVERTISEMENT_PAGES }],
    default: [],
  },
  isActive: { type: Boolean, default: true },
  position: { type: Number, default: 0 },
}, {
  timestamps: true,
});

AdvertisementScheme.index({ displayPages: 1, isActive: 1, position: 1 });

const AdvertisementModel = mongoose.model("Advertisement", AdvertisementScheme);

export const AdvertisementFileModel = {
  resource: AdvertisementModel,
};

export default AdvertisementModel;
