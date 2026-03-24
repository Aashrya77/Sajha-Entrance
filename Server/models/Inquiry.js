import mongoose from "mongoose";

const InquirySchema = new mongoose.Schema({
  // Type of inquiry - college or university
  inquiryType: {
    type: String,
    enum: ["college", "university"],
    required: true,
    default: "college",
  },
  // Reference to the college (optional - used when inquiryType is 'college')
  college: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "College",
    required: false,
  },
  // Reference to the university (optional - used when inquiryType is 'university')
  university: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "University",
    required: false,
  },
  // Name of the institution (college or university name)
  institutionName: {
    type: String,
    required: true,
  },
  // Student/User Information
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  // Inquiry Details
  course: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  // Status tracking
  status: {
    type: String,
    enum: ["pending", "contacted", "resolved", "closed"],
    default: "pending",
  },
  // Admin notes
  notes: {
    type: String,
    default: "",
  },
  // Timestamps
  submittedAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update timestamp on save
InquirySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const InquiryModel = mongoose.model("Inquiry", InquirySchema);

export default InquiryModel;
