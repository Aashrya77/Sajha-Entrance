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
  const notice = await Notice.findOne().sort({ _id: -1 }).exec();
  const courses = await Course.find().limit(4).exec();
  const colleges = await College.find().limit(4).exec();
  const popup = await Popup.findOne({ isActive: true }).exec();
  res.render("home", {
    pageName: "Home",
    notice,
    courses,
    colleges,
    parentGroup: "Home",
    popup,
  });
};

const ContactPage = async (req, res) => {
  const notice = await Notice.findOne().sort({ _id: -1 }).exec();
  const courses = await Course.find().exec();
  const popup = await Popup.findOne({ isActive: true }).exec();
  res.render("contact", {
    pageName: "Contact Us",
    parentGroup: "None",
    notice,
    courses,
    popup,
  });
};

const SendContact = async (req, res) => {
  const notice = await Notice.findOne().sort({ _id: -1 }).exec();
  const courses = await Course.find().exec();
  const popup = await Popup.findOne({ isActive: true }).exec();
  if (req.body["g-recaptcha-response"] == "") {
    return res.render("contact", {
      pageName: "Contact Us",
      parentGroup: "None",
      notice,
      courses,
      popup,
      errorMessage: "Please verify that you are not a robot.",
    });
  } else {
    try {
      // Save contact form data to database
      await ContactModel.create({
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

      res.render("success", {
        pageName: "Request Received",
        message: "YOUR CONTACT REQUEST HAS BEEN RECEIVED SUCCESSFULLY",
        subMessage: "OUR TEAM WILL GET IN TOUCH WITH YOU WITHIN 1 BUSINESS DAY",
      });
    } catch (error) {
      console.log("Error saving contact form:", error);
      res.render("contact", {
        pageName: "Contact Us",
        parentGroup: "None",
        notice,
        courses,
        popup,
        errorMessage: "There was an error submitting your form. Please try again.",
      });
    }
  }
};

const GetServices = async (req, res) => {
  const notice = await Notice.findOne().sort({ _id: -1 }).exec();
  const popup = await Popup.findOne({ isActive: true }).exec();
  res.render("services", {
    pageName: "Our Services",
    parentGroup: "Services",
    notice,
    popup,
  });
};

const NotFoundHandler = async (req, res) => {
  const notice = await Notice.findOne().sort({ _id: -1 }).exec();
  const popup = await Popup.findOne({ isActive: true }).exec();
  res.render("404", { pageName: "404 Not Found", notice, popup });
};

const GetAbout = async (req, res) => {
  const blogs = await Blog.find().sort({ _id: -1 }).limit(5).exec();
  const courses = await Course.find().limit(5).exec();
  const notice = await Notice.findOne().sort({ _id: -1 }).exec();
  const popup = await Popup.findOne({ isActive: true }).exec();
  res.render("about", {
    pageName: "About Us",
    parentGroup: "About",
    notice,
    blogs,
    courses,
    popup,
  });
};

const PostSubscribe = async (req, res) => {
  const newsletterEmail = await NewsletterModel.findOne({
    email: req.body.email,
  });
  if (!newsletterEmail) {
    try {
      await NewsletterModel.create({ email: req.body.email });
    } catch (error) {
      res.render("404");
    }
    res.render("success", {
      pageName: "Subscribe Successful",
      message: "YOUR EMAIL HAS BEEN ADDED TO LIST SUCCESSFULLY",
      subMessage:
        "YOUR WILL RECEIVE UPDATES FOR PROMOTIONS, MOCK TESTS AND TEST RESULTS",
    });
  } else {
    res.render("already-exists");
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
};
