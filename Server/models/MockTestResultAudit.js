import mongoose from "mongoose";

const { Schema } = mongoose;

const ExportAuditMetadataSchema = new Schema(
  {
    exportType: { type: String, enum: ["internal_leads"], required: true },
    missingProfileFieldRecordCount: { type: Number, default: 0, min: 0 },
    missingContactNumberCount: { type: Number, default: 0, min: 0 },
    missingLocationCount: { type: Number, default: 0, min: 0 },
    matchedStudentProfileCount: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const MockTestResultAuditSchema = new Schema(
  {
    mockTest: { type: Schema.Types.ObjectId, ref: "MockTest", required: true, index: true },
    resultSnapshot: {
      type: Schema.Types.ObjectId,
      ref: "MockTestResult",
      required: true,
      index: true,
    },
    action: {
      type: String,
      enum: ["generated", "regenerated", "locked", "unlocked", "internal_exported"],
      required: true,
      index: true,
    },
    performedBy: { type: Schema.Types.ObjectId, ref: "AdminUser", required: true },
    participantCount: { type: Number, default: 0, min: 0 },
    snapshotVersion: { type: Number, required: true, min: 1 },
    metadata: { type: ExportAuditMetadataSchema, default: undefined },
  },
  { timestamps: true }
);

MockTestResultAuditSchema.index({ mockTest: 1, createdAt: -1 });

const MockTestResultAuditModel = mongoose.model(
  "MockTestResultAudit",
  MockTestResultAuditSchema
);

export default MockTestResultAuditModel;
