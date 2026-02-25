import AdminJS from "adminjs";
import express from "express";
import AdminJSExpress from "@adminjs/express";
import * as AdminJSMongoose from "@adminjs/mongoose";
import session from "express-session";
import { default as MongoDBSession } from "connect-mongodb-session";
import dotenv from "dotenv";
import componentLoader, { Components } from "./ComponentLoader.js";

dotenv.config();

const MongoStore = MongoDBSession(session);

import Notice from "../models/Notice.js";
import CollegeModel, { CollegeFileModel } from "../models/College.js";
import Course from "../models/Course.js";
import { AdvertisementFileModel } from "../models/Advertisement.js";
import BlogModel, { BlogFileModel } from "../models/Blog.js";
import NewsletterModel from "../models/Newsletter.js";
import { PopupFileModel } from "../models/Popup.js";
import ContactModel from "../models/Contact.js";
import Student from "../models/Student.js";
import OnlineClass from "../models/OnlineClass.js";
import RecordedClass from "../models/RecordedClass.js";
import StudentResult from "../models/StudentResult.js";
import Payment from "../models/Payment.js";


// Helper function to extract YouTube video ID from URL
const extractVideoId = (url) => {
  if (!url) return "";
  
  // Match various YouTube URL formats
  const patterns = [
    /youtu\.be\/([a-zA-Z0-9_-]+)/,           // youtu.be/VIDEO_ID
    /youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/, // youtube.com/watch?v=VIDEO_ID
    /youtube\.com\/embed\/([a-zA-Z0-9_-]+)/,   // youtube.com/embed/VIDEO_ID
    /youtube\.com\/v\/([a-zA-Z0-9_-]+)/,       // youtube.com/v/VIDEO_ID
  ];
  
  for (let pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return "";
};

AdminJS.registerAdapter({
  Resource: AdminJSMongoose.Resource,
  Database: AdminJSMongoose.Database,
});

const startAdminPanel = async () => {
  const DEFAULT_ADMIN = {
    email: process.env.ADMIN_USERNAME,
    password: process.env.ADMIN_PASSWORD,
  };

  const authenticate = async (email, password) => {
    if (email === DEFAULT_ADMIN.email && password === DEFAULT_ADMIN.password) {
      return Promise.resolve(DEFAULT_ADMIN);
    }
    return null;
  };

  const courseResource = {
    resource: Course,
    options: {
      properties: {
        descriptionFormatted: {
          type: "richtext",
        },
        scholarshipDescription: {
          type: "richtext",
        },
        universityName: {
          type: "string",
          isVisible: {
            list: true,
            show: true,
            edit: true,
            filter: true,
          },
        },
        duration: {
          type: "string",
          isVisible: {
            list: true,
            show: true,
            edit: true,
            filter: true,
          },
        },
        aboutTab: {
          type: "textarea",
          isVisible: {
            list: false,
            show: true,
            edit: true,
            filter: false,
          },
        },
        eligibilityTab: {
          type: "textarea",
          isVisible: {
            list: false,
            show: true,
            edit: true,
            filter: false,
          },
        },
        curricularStructureTab: {
          type: "richtext",
          isVisible: {
            list: false,
            show: true,
            edit: true,
            filter: false,
          },
        },
        jobProspectsTab: {
          type: "textarea",
          isVisible: {
            list: false,
            show: true,
            edit: true,
            filter: false,
          },
        },
      },
    },
  };

  const recordedClassResource = {
    resource: RecordedClass,
    options: {
      listProperties: [
        "subject",
        "topicName",
        "courseIds",
        "youtubeUrl",
        "classDate",
      ],
      showProperties: [
        "subject",
        "topicName",
        "courseIds",
        "videoId",
        "youtubeUrl",
        "classDate",
        "description",
        "createdAt",
        "updatedAt",
      ],
      editProperties: [
        "subject",
        "topicName",
        "courseIds",
        "youtubeUrl",
        "classDate",
        "description",
      ],
      properties: {
        subject: {
          label: "Subject",
          type: "string",
        },
        topicName: {
          label: "Topic Name",
          type: "string",
        },
        courseIds: {
          label: "Course IDs (comma-separated)",
          type: "textarea",
          description: "Enter course IDs separated by commas. Example: BIT, BCA, BE",
        },
        videoId: {
          label: "Video ID",
          type: "string",
          isVisible: { edit: false },
        },
        youtubeUrl: {
          label: "YouTube URL",
          type: "string",
        },
        classDate: {
          label: "Class Date",
          type: "datetime",
        },
        description: {
          label: "Description",
          type: "textarea",
        },
      },
    },
  };

  // Course-to-subjects mapping
  const COURSE_SUBJECTS = {
    BIT: ["English", "Computer", "Math"],
    BCA: ["English", "GK", "Math"],
    CMAT: ["English", "GK", "Math", "Logical Reasoning"],
    CSIT: ["Physics", "English", "Math", "Chemistry"],
  };

  const studentResultResource = {
    resource: StudentResult,
    options: {
      navigation: { name: "Exam Results", icon: "Document" },
      listProperties: [
        "symbolNumber",
        "studentName",
        "course",
        "totalObtainedMarks",
        "totalFullMarks",
        "percentage",
        "result",
      ],
      editProperties: [
        "symbolNumber",
        "studentName",
        "course",
        "examDate",
        "subjects",
        "remarks",
      ],
      showProperties: [
        "symbolNumber",
        "studentName",
        "course",
        "examDate",
        "subjects",
        "totalFullMarks",
        "totalObtainedMarks",
        "percentage",
        "result",
        "remarks",
        "publishedAt",
      ],
      properties: {
        symbolNumber: {
          label: "Symbol Number",
          isTitle: true,
        },
        studentName: {
          label: "Student Name",
        },
        course: {
          label: "Course",
          availableValues: [
            { value: "BIT", label: "BIT" },
            { value: "BCA", label: "BCA" },
            { value: "CMAT", label: "CMAT" },
            { value: "CSIT", label: "CSIT" },
          ],
        },
        examDate: {
          label: "Exam Date",
          type: "datetime",
        },
        "subjects.subjectName": {
          label: "Subject Name",
          availableValues: [
            { value: "English", label: "English" },
            { value: "Math", label: "Math" },
            { value: "Computer", label: "Computer" },
            { value: "GK", label: "GK" },
            { value: "Physics", label: "Physics" },
            { value: "Chemistry", label: "Chemistry" },
            { value: "Logical Reasoning", label: "Logical Reasoning" },
          ],
          description: "Select subject for this row",
        },
        "subjects.fullMarks": {
          label: "Full Marks",
          type: "number",
        },
        "subjects.passMarks": {
          label: "Pass Marks",
          type: "number",
        },
        "subjects.obtainedMarks": {
          label: "Obtained Marks",
          type: "number",
        },
        totalFullMarks: {
          label: "Total Full Marks",
          isVisible: { edit: false, list: true, show: true, filter: false },
        },
        totalObtainedMarks: {
          label: "Total Obtained Marks",
          isVisible: { edit: false, list: true, show: true, filter: false },
        },
        percentage: {
          label: "Percentage (%)",
          isVisible: { edit: false, list: true, show: true, filter: false },
        },
        result: {
          label: "Result",
          isVisible: { edit: false, list: true, show: true, filter: true },
        },
        remarks: {
          label: "Remarks",
          type: "textarea",
        },
      },
      actions: {
        new: {
          before: async (request) => {
            const { payload } = request;
            if (payload && payload.course) {
              const subjects = COURSE_SUBJECTS[payload.course];
              if (subjects) {
                // Collect any marks the admin already entered
                const existingSubjects = [];
                let i = 0;
                while (payload[`subjects.${i}.subjectName`] !== undefined || i < subjects.length) {
                  existingSubjects.push({
                    subjectName: payload[`subjects.${i}.subjectName`],
                    fullMarks: payload[`subjects.${i}.fullMarks`],
                    passMarks: payload[`subjects.${i}.passMarks`],
                    obtainedMarks: payload[`subjects.${i}.obtainedMarks`],
                  });
                  i++;
                }
                // Ensure subjects match the course
                subjects.forEach((name, idx) => {
                  payload[`subjects.${idx}.subjectName`] = name;
                  if (!payload[`subjects.${idx}.fullMarks`]) {
                    payload[`subjects.${idx}.fullMarks`] = existingSubjects[idx]?.fullMarks || '';
                  }
                  if (!payload[`subjects.${idx}.passMarks`]) {
                    payload[`subjects.${idx}.passMarks`] = existingSubjects[idx]?.passMarks || '';
                  }
                  if (!payload[`subjects.${idx}.obtainedMarks`]) {
                    payload[`subjects.${idx}.obtainedMarks`] = existingSubjects[idx]?.obtainedMarks || '';
                  }
                });
                // Remove any extra subjects beyond what the course defines
                let extra = subjects.length;
                while (payload[`subjects.${extra}.subjectName`] !== undefined) {
                  delete payload[`subjects.${extra}.subjectName`];
                  delete payload[`subjects.${extra}.fullMarks`];
                  delete payload[`subjects.${extra}.passMarks`];
                  delete payload[`subjects.${extra}.obtainedMarks`];
                  extra++;
                }
              }
            }
            return request;
          },
        },
        edit: {
          before: async (request) => {
            const { payload } = request;
            if (payload && payload.course) {
              const subjects = COURSE_SUBJECTS[payload.course];
              if (subjects) {
                const existingSubjects = [];
                let i = 0;
                while (payload[`subjects.${i}.subjectName`] !== undefined || i < subjects.length) {
                  existingSubjects.push({
                    subjectName: payload[`subjects.${i}.subjectName`],
                    fullMarks: payload[`subjects.${i}.fullMarks`],
                    passMarks: payload[`subjects.${i}.passMarks`],
                    obtainedMarks: payload[`subjects.${i}.obtainedMarks`],
                  });
                  i++;
                }
                subjects.forEach((name, idx) => {
                  payload[`subjects.${idx}.subjectName`] = name;
                  if (!payload[`subjects.${idx}.fullMarks`]) {
                    payload[`subjects.${idx}.fullMarks`] = existingSubjects[idx]?.fullMarks || '';
                  }
                  if (!payload[`subjects.${idx}.passMarks`]) {
                    payload[`subjects.${idx}.passMarks`] = existingSubjects[idx]?.passMarks || '';
                  }
                  if (!payload[`subjects.${idx}.obtainedMarks`]) {
                    payload[`subjects.${idx}.obtainedMarks`] = existingSubjects[idx]?.obtainedMarks || '';
                  }
                });
                let extra = subjects.length;
                while (payload[`subjects.${extra}.subjectName`] !== undefined) {
                  delete payload[`subjects.${extra}.subjectName`];
                  delete payload[`subjects.${extra}.fullMarks`];
                  delete payload[`subjects.${extra}.passMarks`];
                  delete payload[`subjects.${extra}.obtainedMarks`];
                  extra++;
                }
              }
            }
            return request;
          },
        },
      },
    },
  };

  const studentResource = {
    resource: Student,
    options: {
      navigation: { name: "Students", icon: "User" },
      listProperties: ["studentId", "name", "email", "course", "accountStatus", "createdAt"],
      showProperties: ["studentId", "name", "email", "phone", "address", "collegeName", "course", "accountStatus", "createdAt"],
      editProperties: ["name", "email", "password", "phone", "address", "collegeName", "course", "accountStatus"],
      properties: {
        studentId: {
          label: "Student ID",
          isVisible: { edit: false, list: true, show: true, filter: true },
        },
        name: { label: "Full Name" },
        email: { label: "Email", isTitle: true },
        phone: { label: "Phone" },
        address: { label: "Address" },
        collegeName: { label: "College Name" },
        course: {
          label: "Course",
          availableValues: [
            { value: "BSc.CSIT", label: "BSc.CSIT" },
            { value: "BIT", label: "BIT" },
            { value: "BCA", label: "BCA" },
            { value: "CMAT", label: "CMAT" },
            { value: "IOT", label: "IOT" },
          ],
        },
        accountStatus: {
          label: "Payment Status",
          availableValues: [
            { value: "Unpaid", label: "Unpaid" },
            { value: "Paid", label: "Paid" },
          ],
        },
        password: {
          label: "Password",
          type: "password",
          isVisible: { list: false, show: false, edit: true, filter: false },
        },
      },
    },
  };

  const onlineClassResource = {
    resource: OnlineClass,
    options: {
      navigation: { name: "Classes", icon: "Video" },
      listProperties: ["classTitle", "subject", "course", "classDateTime", "duration"],
      editProperties: ["classTitle", "subject", "course", "classDateTime", "zoomMeetingLink", "duration"],
      properties: {
        classTitle: { label: "Class Title" },
        subject: { label: "Subject" },
        course: {
          label: "Course",
          availableValues: [
            { value: "BSc.CSIT", label: "BSc.CSIT" },
            { value: "BIT", label: "BIT" },
            { value: "BCA", label: "BCA" },
            { value: "CMAT", label: "CMAT" },
            { value: "IOT", label: "IOT" },
          ],
        },
        classDateTime: { label: "Class Date & Time", type: "datetime" },
        zoomMeetingLink: { label: "Zoom Meeting Link" },
        duration: { label: "Duration (minutes)", type: "number" },
      },
    },
  };

  const paymentResource = {
    resource: Payment,
    options: {
      navigation: { name: "Payments", icon: "CreditCard" },
      listProperties: ["studentName", "courseTitle", "totalAmount", "status", "transactionUuid", "createdAt"],
      showProperties: ["studentName", "email", "phone", "courseTitle", "amount", "taxAmount", "totalAmount", "transactionUuid", "transactionCode", "refId", "productCode", "status", "paidAt", "createdAt"],
      editProperties: ["status"],
      properties: {
        studentName: { label: "Student Name" },
        email: { label: "Email" },
        phone: { label: "Phone" },
        courseTitle: { label: "Course" },
        amount: { label: "Amount" },
        taxAmount: { label: "Tax" },
        totalAmount: { label: "Total Amount" },
        transactionUuid: { label: "Transaction UUID" },
        transactionCode: { label: "eSewa Txn Code" },
        refId: { label: "eSewa Ref ID" },
        productCode: { label: "Product Code" },
        status: {
          label: "Status",
          availableValues: [
            { value: "pending", label: "Pending" },
            { value: "completed", label: "Completed" },
            { value: "failed", label: "Failed" },
            { value: "refunded", label: "Refunded" },
            { value: "canceled", label: "Canceled" },
          ],
        },
        paidAt: { label: "Paid At", type: "datetime" },
      },
    },
  };

  const dashboardHandler = async () => {
    try {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const [
        studentsCount,
        paidStudentsCount,
        coursesCount,
        blogsCount,
        collegesCount,
        contactsCount,
        newslettersCount,
        onlineClassesCount,
        recordedClassesCount,
        noticesCount,
        resultsCount,
        studentsByCourse,
        paymentsByStatus,
        registrationsTrend,
        resultStats,
        revenueAgg,
        recentPayments,
        recentContacts,
        upcomingClasses,
      ] = await Promise.all([
        Student.countDocuments(),
        Student.countDocuments({ accountStatus: "Paid" }),
        Course.countDocuments(),
        BlogModel.countDocuments(),
        CollegeModel.countDocuments(),
        ContactModel.countDocuments(),
        NewsletterModel.countDocuments(),
        OnlineClass.countDocuments(),
        RecordedClass.countDocuments(),
        Notice.countDocuments(),
        StudentResult.countDocuments(),
        Student.aggregate([{ $group: { _id: "$course", count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
        Payment.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
        Student.aggregate([
          { $match: { createdAt: { $gte: sixMonthsAgo } } },
          {
            $group: {
              _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
              count: { $sum: 1 },
            },
          },
          { $sort: { "_id.year": 1, "_id.month": 1 } },
        ]),
        StudentResult.aggregate([{ $group: { _id: "$result", count: { $sum: 1 } } }]),
        Payment.aggregate([
          { $match: { status: "completed" } },
          { $group: { _id: null, total: { $sum: "$totalAmount" } } },
        ]),
        Payment.find().sort({ createdAt: -1 }).limit(5).lean(),
        ContactModel.find().sort({ submittedAt: -1 }).limit(5).lean(),
        OnlineClass.find({ classDateTime: { $gte: new Date() } }).sort({ classDateTime: 1 }).limit(5).lean(),
      ]);

      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const formattedTrend = registrationsTrend.map((item) => ({
        month: `${monthNames[item._id.month - 1]} ${item._id.year}`,
        count: item.count,
      }));

      return {
        counts: {
          students: studentsCount,
          paidStudents: paidStudentsCount,
          courses: coursesCount,
          blogs: blogsCount,
          colleges: collegesCount,
          contacts: contactsCount,
          newsletters: newslettersCount,
          onlineClasses: onlineClassesCount,
          recordedClasses: recordedClassesCount,
          notices: noticesCount,
          results: resultsCount,
        },
        studentsByCourse,
        paymentsByStatus,
        registrationsTrend: formattedTrend,
        resultStats,
        revenueTotal: revenueAgg.length > 0 ? revenueAgg[0].total : 0,
        recentPayments,
        recentContacts,
        upcomingClasses,
      };
    } catch (error) {
      console.error("Dashboard handler error:", error);
      return { error: error.message };
    }
  };

  const adminOptions = {
    resources: [
      BlogFileModel,
      Notice,
      AdvertisementFileModel,
      CollegeFileModel,
      courseResource,
      NewsletterModel,
      ContactModel,
      PopupFileModel,
      studentResource,
      onlineClassResource,
      recordedClassResource,
      studentResultResource,
      paymentResource,
    ],
    rootPath: "/admin",
    componentLoader,
    dashboard: {
      component: Components.Dashboard,
      handler: dashboardHandler,
    },
  };

  const admin = new AdminJS(adminOptions);

  const sessionStore = new MongoStore({
    uri: process.env.MONGO_URI,
    collection: "session",

  });

  sessionStore.on('error', function(error) {
      console.error("Session Store Error Details:", error);
    });

  const adminRouter = AdminJSExpress.buildAuthenticatedRouter(
    admin,
    {
      authenticate,
      cookieName: "adminjs",
      cookiePassword: "sessionsecret",
    },
    null,
    {
      // Temporarily disable session store to avoid SSL issues
      // store: sessionStore,
      resave: true,
      saveUninitialized: true,
      secret: "sessionsecret",
      cookie: {
        httpOnly: process.env.STATE === "production",
        secure: process.env.STATE === "production",
      },
      name: "adminjs",
    }
  );

  const Router = express.Router();
  Router.use(admin.options.rootPath, adminRouter);
  return Router;
};

    

export { startAdminPanel };
