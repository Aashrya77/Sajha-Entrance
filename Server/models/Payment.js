import mongoose from "mongoose";

const PaymentSchema = new mongoose.Schema({
  // Student info
  studentName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },

  // Course info
  course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
  courseTitle: { type: String, required: true },

  // Payment info
  amount: { type: Number, required: true },
  taxAmount: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  transactionUuid: { type: String, required: true, unique: true },
  productCode: { type: String, required: true },

  // eSewa response
  transactionCode: { type: String },
  refId: { type: String },

  // Status: pending | completed | failed | refunded
  status: {
    type: String,
    enum: ["pending", "completed", "failed", "refunded", "canceled"],
    default: "pending",
  },

  paidAt: { type: Date },
}, { timestamps: true });

const PaymentModel = mongoose.model("Payment", PaymentSchema);

export default PaymentModel;
