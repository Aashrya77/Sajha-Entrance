import mongoose from "mongoose";

const OnlineClassSchema = new mongoose.Schema({
  classTitle: {
    type: String,
    required: true,
    trim: true,
  },
  subject: {
    type: String,
    required: true,
    trim: true,
  },
  course: {
    type: String,
    required: true,
    trim: true,
  },
  classDateTime: {
    type: Date,
    required: true,
  },
  zoomMeetingLink: {
    type: String,
    required: true,
    trim: true,
  },
  duration: {
    type: Number,
    default: 60, // Duration in minutes
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const OnlineClass = mongoose.model("OnlineClass", OnlineClassSchema);

export default OnlineClass;
