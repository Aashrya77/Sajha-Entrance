import mongoose from "mongoose";

const CounterSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      required: true,
      trim: true,
    },
    seq: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    versionKey: false,
  }
);

const Counter = mongoose.models.Counter || mongoose.model("Counter", CounterSchema);

export default Counter;
