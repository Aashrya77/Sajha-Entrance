import mongoose from "mongoose";

const BookItemSchema = new mongoose.Schema({
  bookId: { type: Number, required: true },
  title: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  image: { type: String },
});

const BookOrderSchema = new mongoose.Schema(
  {
    // Customer info
    customerName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },

    // Order items
    items: [BookItemSchema],

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

    // Delivery status
    deliveryStatus: {
      type: String,
      enum: ["pending", "processing", "shipped", "delivered"],
      default: "pending",
    },

    paidAt: { type: Date },
  },
  { timestamps: true }
);

const BookOrderModel = mongoose.model("BookOrder", BookOrderSchema);

export default BookOrderModel;
