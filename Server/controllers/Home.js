import Notice from "../models/Notice.js";
import Course from "../models/Course.js";
import College from "../models/College.js";
import Blog from "../models/Blog.js";
import Popup from "../models/Popup.js";
import dotenv from "dotenv";
import { MailHandler } from "./MailHandler.js";
import NewsletterModel from "../models/Newsletter.js";
import ContactModel from "../models/Contact.js";

dotenv.config();

const HomeDetails = async (req, res) => {
  try {
    const notice = await Notice.findOne().sort({ _id: -1 }).exec();
    const courses = await Course.find().limit(4).exec();
    const colleges = await College.find().limit(4).exec();
    const popup = await Popup.findOne({ isActive: true }).exec();
    res.json({
      success: true,
      data: {
        notice,
        courses,
        colleges,
        popup,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const ContactPage = async (req, res) => {
  try {
    const notice = await Notice.findOne().sort({ _id: -1 }).exec();
    const courses = await Course.find().exec();
    const popup = await Popup.findOne({ isActive: true }).exec();
    res.json({
      success: true,
      data: {
        notice,
        courses,
        popup,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const SendContact = async (req, res) => {
  try {
    // Save contact form data to database
    const contact = await ContactModel.create({
      name: req.body.name,
      phone: req.body.phone,
      address: req.body.address,
      email: req.body.email,
      course: req.body.course,
      message: req.body.message,
    });

    // Send email notification
    MailHandler.sendMail(
      {
        from: process.env.MAIL_USERNAME,
        to: process.env.MAIL_RECIPIENT,
        subject: "New Contact Request Message",
        text: `Name: ${req.body.name}\nPhone: ${req.body.phone}\nAddress: ${req.body.address}\nEmail Address: ${req.body.email}\nCourse: ${req.body.course}\nMessage: ${req.body.message}`,
      },
      (error, info) => {
        if (error) {
          console.log(error);
        } else {
          console.log(info);
        }
      }
    );

    res.json({
      success: true,
      message: "YOUR CONTACT REQUEST HAS BEEN RECEIVED SUCCESSFULLY",
      subMessage: "OUR TEAM WILL GET IN TOUCH WITH YOU WITHIN 1 BUSINESS DAY",
      data: contact
    });
  } catch (error) {
    console.log("Error saving contact form:", error);
    res.status(400).json({
      success: false,
      error: "There was an error submitting your form. Please try again."
    });
  }
};

const GetServices = async (req, res) => {
  try {
    const notice = await Notice.findOne().sort({ _id: -1 }).exec();
    const popup = await Popup.findOne({ isActive: true }).exec();
    res.json({
      success: true,
      data: {
        notice,
        popup,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const NotFoundHandler = async (req, res) => {
  res.status(404).json({
    success: false,
    error: "Resource not found"
  });
};

const GetAbout = async (req, res) => {
  try {
    const blogs = await Blog.find().sort({ _id: -1 }).limit(5).exec();
    const courses = await Course.find().limit(5).exec();
    const notice = await Notice.findOne().sort({ _id: -1 }).exec();
    const popup = await Popup.findOne({ isActive: true }).exec();
    res.json({
      success: true,
      data: {
        blogs,
        courses,
        notice,
        popup,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const PostSubscribe = async (req, res) => {
  try {
    const newsletterEmail = await NewsletterModel.findOne({
      email: req.body.email,
    });
    if (!newsletterEmail) {
      await NewsletterModel.create({ email: req.body.email });
      res.json({
        success: true,
        message: "YOUR EMAIL HAS BEEN ADDED TO LIST SUCCESSFULLY",
        subMessage: "YOUR WILL RECEIVE UPDATES FOR PROMOTIONS, MOCK TESTS AND TEST RESULTS",
      });
    } else {
      res.status(400).json({
        success: false,
        error: "Email already exists in our newsletter list"
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const GetNotice = async (req, res) => {
  try {
    const notice = await Notice.findOne({ isActive: true }).sort({ createdAt: -1 });
    res.json({
      success: true,
      data: notice
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch notice"
    });
  }
};

export {
  HomeDetails,
  ContactPage,
  SendContact,
  GetServices,
  NotFoundHandler,
  GetAbout,
  PostSubscribe,
  GetNotice,
};
