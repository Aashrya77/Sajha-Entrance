import mongoose from "mongoose";

const NewsletterSchema = new mongoose.Schema({
  email: String,
});

const NewsletterModel = mongoose.model("Newsletter", NewsletterSchema);

export default NewsletterModel;
