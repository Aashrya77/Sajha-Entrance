import mongoose from "mongoose";
import bcrypt from "bcrypt";

const StudentSchema = new mongoose.Schema({
  studentId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  course: {
    type: String,
    required: true,
    trim: true,
  },
  accountStatus: {
    type: String,
    enum: ["Paid", "Free Trial", "Expired"],
    default: "Free Trial",
  },
  trialExpiryDate: {
    type: Date,
    default: function() {
      // Default to 7 days from now for free trial
      const date = new Date();
      date.setDate(date.getDate() + 7);
      return date;
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Hash password before saving
StudentSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
StudentSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const Student = mongoose.model("Student", StudentSchema);

export default Student;
