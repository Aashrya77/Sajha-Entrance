import mongoose from "mongoose";

const NoticeSchema = new mongoose.Schema({
  title: String,
  url: String,
});

const NoticeModel = mongoose.model("Notice", NoticeSchema);

export default NoticeModel;