import mongoose from "mongoose";

export const AdvertisementScheme = new mongoose.Schema({
  advertisementName: String,
  advertisementFile: String,
  advertisementImageMimeType: String,
  advertisementImageFilename: String,
  advertisementImageSize: Number,
  advertisementLink: String,
});

const AdvertisementModel = mongoose.model("Advertisement", AdvertisementScheme);

export const AdvertisementFileModel = {
  resource: AdvertisementModel,
};

export default AdvertisementModel;
