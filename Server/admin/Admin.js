import AdminJS from "adminjs";
import componentsBundler from "../node_modules/adminjs/lib/backend/bundler/components.bundler.js";
import generateAdminComponentEntry from "../node_modules/adminjs/lib/backend/bundler/generate-user-component-entry.js";
import { ADMIN_JS_TMP_DIR } from "../node_modules/adminjs/lib/backend/bundler/utils/constants.js";
import populator from "../node_modules/adminjs/lib/backend/utils/populator/populator.js";
import express from "express";
import AdminJSExpress from "@adminjs/express";
import * as AdminJSMongoose from "@adminjs/mongoose";
import session from "express-session";
import { default as MongoDBSession } from "connect-mongodb-session";
import dotenv from "dotenv";
import componentLoader, { Components } from "./ComponentLoader.js";
import { adminAssets, adminBranding } from "./config/branding.js";
import { adminLocale } from "./config/locale.js";
import { adminBrandMeta } from "./config/theme.js";
import {
  authenticateAdminUser,
  ensureAdminUserSeed,
  hasPermission,
  requireAdminPermission,
  syncAllAdminUserPermissions,
} from "./utils/admin-auth.js";
import { decorateAdminResource } from "./utils/admin-resource.js";
import { logAdminLogin, logAdminSystemError } from "./utils/admin-audit.js";
import { createLogger } from "../utils/logger.js";

dotenv.config();

const MongoStore = MongoDBSession(session);
const logger = createLogger("admin");

import Notice from "../models/Notice.js";
import AdminUserModel from "../models/AdminUser.js";
import AdminNotificationModel from "../models/AdminNotification.js";
import CollegeModel from "../models/College.js";
import Course from "../models/Course.js";
import BlogModel from "../models/Blog.js";
import NewsletterModel from "../models/Newsletter.js";
import ContactModel from "../models/Contact.js";
import Student from "../models/Student.js";
import OnlineClass from "../models/OnlineClass.js";
import RecordedClass from "../models/RecordedClass.js";
import ResultExam from "../models/ResultExam.js";
import StudentResult from "../models/StudentResult.js";
import Payment from "../models/Payment.js";
import UniversityModel, { UniversityFileModel } from "../models/University.js";
import MockTestModel, { MockTestFileModel } from "../models/MockTest.js";
import { MockTestAttemptModel } from "../models/MockTest.js";
import BookOrderModel from "../models/BookOrder.js";
import InquiryModel from "../models/Inquiry.js";
import BlogAdminResource from "./resources/blog.resource.js";
import AdvertisementAdminResource from "./resources/advertisement.resource.js";
import PopupAdminResource from "./resources/popup.resource.js";
import LandingAdAdminResource from "./resources/landing-ad.resource.js";
import CollegeAdminResource from "./resources/college.resource.js";
import AdminUserAdminResource from "./resources/admin-user.resource.js";
import AdminNotificationAdminResource from "./resources/admin-notification.resource.js";
import {
  CreateAdminResultExam,
  DeleteResultExamSet,
  DownloadResultTemplate,
  GetAdminResultCourses,
  GetAdminResultExams,
  ImportBulkUploadResults,
  PreviewBulkUploadResults,
  PublishResultExam,
  RecalculateExamRanks,
  UpdateAdminResultExam,
  UnpublishResultExam,
} from "../controllers/Result.js";
import {
  calculateResultMetrics,
  recalculateExamRanks as recalculateExamRanksService,
  deleteResultExamSet as deleteResultExamSetService,
} from "../services/resultService.js";
import {
  getResultCourse,
  normalizeCourseCode,
} from "../constants/resultCourses.js";


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

const getMonthStart = (date) => new Date(date.getFullYear(), date.getMonth(), 1);

const shiftMonth = (date, offset) => new Date(date.getFullYear(), date.getMonth() + offset, 1);

const calculateGrowth = (currentValue, previousValue) => {
  if (!previousValue) {
    return currentValue > 0 ? 100 : 0;
  }

  return Number((((currentValue - previousValue) / previousValue) * 100).toFixed(1));
};

const formatMonthSeries = (series) => {
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return series.map((item) => ({
    month: `${monthNames[item._id.month - 1]} ${item._id.year}`,
    count: item.count,
    total: item.total,
  }));
};

const toIsoDateTimeString = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
};

const STUDENT_RESULT_SUBJECT_FIELD_PATTERN =
  /^subjects\.(\d+)\.(subjectName|fullMarks|passMarks|obtainedMarks)$/;

const resolveSubjectStringValue = (value, fallback = "") => {
  if (value === undefined || value === null) {
    return String(fallback || "").trim();
  }

  const normalizedValue = String(value).trim();
  return normalizedValue || String(fallback || "").trim();
};

const resolveSubjectNumericValue = (value, fallback = 0) => {
  if (value === undefined || value === null || value === "") {
    const parsedFallback = Number(fallback);
    return Number.isFinite(parsedFallback) ? parsedFallback : 0;
  }

  const parsedValue = Number(value);
  if (Number.isFinite(parsedValue)) {
    return parsedValue;
  }

  const parsedFallback = Number(fallback);
  return Number.isFinite(parsedFallback) ? parsedFallback : 0;
};

const getSubjectPayloadByIndex = (payload = {}, index) => {
  const subjects = payload?.subjects;

  if (Array.isArray(subjects)) {
    return subjects[index] || null;
  }

  if (subjects && typeof subjects === "object") {
    return subjects[index] || subjects[String(index)] || null;
  }

  return null;
};

const buildSubjectsFromPayload = (payload = {}, existingSubjects = []) => {
  const subjectIndexes = new Set(
    Array.isArray(existingSubjects)
      ? existingSubjects.map((_, index) => index)
      : []
  );

  if (Array.isArray(payload?.subjects)) {
    payload.subjects.forEach((_, index) => subjectIndexes.add(index));
  } else if (payload?.subjects && typeof payload.subjects === "object") {
    Object.keys(payload.subjects)
      .filter((key) => /^\d+$/.test(key))
      .forEach((key) => subjectIndexes.add(Number(key)));
  }

  Object.keys(payload).forEach((key) => {
    const match = key.match(STUDENT_RESULT_SUBJECT_FIELD_PATTERN);
    if (match) {
      subjectIndexes.add(Number(match[1]));
    }
  });

  return Array.from(subjectIndexes)
    .sort((left, right) => left - right)
    .map((index) => {
      const existingSubject = existingSubjects[index] || {};
      const payloadSubject = getSubjectPayloadByIndex(payload, index) || {};

      return {
        subjectName: resolveSubjectStringValue(
          payloadSubject.subjectName ?? payload[`subjects.${index}.subjectName`],
          existingSubject.subjectName
        ),
        fullMarks: resolveSubjectNumericValue(
          payloadSubject.fullMarks ?? payload[`subjects.${index}.fullMarks`],
          existingSubject.fullMarks
        ),
        passMarks: resolveSubjectNumericValue(
          payloadSubject.passMarks ?? payload[`subjects.${index}.passMarks`],
          existingSubject.passMarks
        ),
        obtainedMarks: resolveSubjectNumericValue(
          payloadSubject.obtainedMarks ?? payload[`subjects.${index}.obtainedMarks`],
          existingSubject.obtainedMarks
        ),
      };
    })
    .filter(
      (subject) =>
        subject.subjectName ||
        subject.fullMarks > 0 ||
        subject.passMarks > 0 ||
        subject.obtainedMarks > 0
    );
};

const applyCalculatedMetricsToPayload = (payload, metrics) => {
  if (!payload || !metrics) {
    return payload;
  }

  (metrics.subjects || []).forEach((subject, index) => {
    payload[`subjects.${index}.subjectName`] = subject.subjectName;
    payload[`subjects.${index}.fullMarks`] = subject.fullMarks;
    payload[`subjects.${index}.passMarks`] = subject.passMarks;
    payload[`subjects.${index}.obtainedMarks`] = subject.obtainedMarks;
    payload[`subjects.${index}.status`] = subject.status;
  });

  payload.totalFullMarks = metrics.totalFullMarks;
  payload.totalPassMarks = metrics.totalPassMarks;
  payload.totalObtainedMarks = metrics.totalObtainedMarks;
  payload.percentage = metrics.percentage;
  payload.resultStatus = metrics.resultStatus;
  payload.result = metrics.result;

  const recalculatedAt = new Date();
  payload.lastCalculatedAt = recalculatedAt;
  payload.updatedAt = recalculatedAt;

  return payload;
};

const syncStudentResultResponse = (response, result) => {
  if (!response?.record?.params || !result) {
    return response;
  }

  response.record.params.totalFullMarks = result.totalFullMarks;
  response.record.params.totalPassMarks = result.totalPassMarks;
  response.record.params.totalObtainedMarks = result.totalObtainedMarks;
  response.record.params.percentage = result.percentage;
  response.record.params.rank = result.rank;
  response.record.params.resultStatus = result.resultStatus;
  response.record.params.result = result.result;
  response.record.params.lastCalculatedAt = result.lastCalculatedAt;
  response.record.params.updatedAt = result.updatedAt;

  (result.subjects || []).forEach((subject, index) => {
    response.record.params[`subjects.${index}.subjectName`] = subject.subjectName;
    response.record.params[`subjects.${index}.fullMarks`] = subject.fullMarks;
    response.record.params[`subjects.${index}.passMarks`] = subject.passMarks;
    response.record.params[`subjects.${index}.obtainedMarks`] = subject.obtainedMarks;
    response.record.params[`subjects.${index}.status`] = subject.status;
  });

  return response;
};

const syncSubjectsWithTemplate = (payload, templateSubjects = []) => {
  if (!payload || !templateSubjects.length) {
    return payload;
  }

  const existingSubjects = [];
  let index = 0;
  while (payload[`subjects.${index}.subjectName`] !== undefined || index < templateSubjects.length) {
    existingSubjects.push({
      subjectName: payload[`subjects.${index}.subjectName`],
      fullMarks: payload[`subjects.${index}.fullMarks`],
      passMarks: payload[`subjects.${index}.passMarks`],
      obtainedMarks: payload[`subjects.${index}.obtainedMarks`],
    });
    index += 1;
  }

  templateSubjects.forEach((templateSubject, subjectIndex) => {
    payload[`subjects.${subjectIndex}.subjectName`] = templateSubject.name || templateSubject;
    if (existingSubjects[subjectIndex]?.fullMarks !== undefined) {
      payload[`subjects.${subjectIndex}.fullMarks`] = existingSubjects[subjectIndex].fullMarks;
    } else if (templateSubject.fullMarks !== undefined) {
      payload[`subjects.${subjectIndex}.fullMarks`] = templateSubject.fullMarks;
    }

    if (existingSubjects[subjectIndex]?.passMarks !== undefined) {
      payload[`subjects.${subjectIndex}.passMarks`] = existingSubjects[subjectIndex].passMarks;
    } else if (templateSubject.passMarks !== undefined) {
      payload[`subjects.${subjectIndex}.passMarks`] = templateSubject.passMarks;
    }

    if (existingSubjects[subjectIndex]?.obtainedMarks !== undefined) {
      payload[`subjects.${subjectIndex}.obtainedMarks`] = existingSubjects[subjectIndex].obtainedMarks;
    }
  });

  let extraIndex = templateSubjects.length;
  while (payload[`subjects.${extraIndex}.subjectName`] !== undefined) {
    delete payload[`subjects.${extraIndex}.subjectName`];
    delete payload[`subjects.${extraIndex}.fullMarks`];
    delete payload[`subjects.${extraIndex}.passMarks`];
    delete payload[`subjects.${extraIndex}.obtainedMarks`];
    extraIndex += 1;
  }

  return payload;
};

const ensureManualExamForPayload = async (payload) => {
  if (!payload) {
    return payload;
  }

  const normalizedCourseCode = normalizeCourseCode(payload.course);
  const examId = String(payload.exam || "").trim();
  const examDate = payload.examDate ? new Date(payload.examDate) : null;

  let exam = null;

  if (examId) {
    exam = await ResultExam.findById(examId);
  }

  if (exam) {
    payload.exam = `${exam._id}`;
    payload.course = exam.course;
    payload.examDate = toIsoDateTimeString(exam.examDate);
    payload.publishedAt =
      exam.status === "draft" ? "" : toIsoDateTimeString(exam.publishDate || new Date());
    syncSubjectsWithTemplate(payload, exam.subjects || []);
    return payload;
  }

  if (normalizedCourseCode) {
    payload.course = normalizedCourseCode;
    const defaultSubjects = (
      getResultCourse(normalizedCourseCode)?.templateSubjects || []
    ).map((subjectName) => ({ name: subjectName }));
    syncSubjectsWithTemplate(payload, defaultSubjects);
  }

  return payload;
};

const startAdminPanel = async () => {
  await ensureAdminUserSeed();
  await syncAllAdminUserPermissions();

  const authenticate = async (email, password) => {
    const result = await authenticateAdminUser(email, password);

    if (!result) {
      return null;
    }

    await logAdminLogin(result.currentAdmin);
    return result.currentAdmin;
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

  const resultExamResource = {
    resource: ResultExam,
    options: {
      navigation: { name: "Exam Results", icon: "Events" },
      listProperties: [
        "title",
        "course",
        "examDate",
        "status",
        "resultCount",
        "publishDate",
        "lastImportedAt",
      ],
      filterProperties: ["course", "status", "examDate", "title"],
      editProperties: [
        "title",
        "course",
        "examDate",
        "description",
        "status",
        "publishDate",
        "subjects",
      ],
      showProperties: [
        "title",
        "course",
        "courseName",
        "examDate",
        "status",
        "publishDate",
        "description",
        "subjects",
        "resultCount",
        "lastImportedAt",
        "createdAt",
        "updatedAt",
      ],
      properties: {
        title: { isTitle: true },
        course: {
          label: "Course",
        },
        examDate: {
          type: "datetime",
        },
        publishDate: {
          type: "datetime",
        },
        status: {
          availableValues: [
            { value: "draft", label: "Draft" },
            { value: "scheduled", label: "Scheduled" },
            { value: "published", label: "Published" },
          ],
        },
        "subjects.name": {
          label: "Subject Name",
        },
        "subjects.fullMarks": {
          label: "Full Marks",
          type: "number",
        },
        "subjects.passMarks": {
          label: "Pass Marks",
          type: "number",
        },
        "subjects.displayOrder": {
          label: "Display Order",
          type: "number",
        },
        resultCount: {
          isVisible: { edit: false, list: true, show: true, filter: false },
        },
        lastImportedAt: {
          type: "datetime",
          isVisible: { edit: false, list: true, show: true, filter: false },
        },
        createdAt: {
          type: "datetime",
          isVisible: { edit: false, list: false, show: true, filter: false },
        },
        updatedAt: {
          type: "datetime",
          isVisible: { edit: false, list: false, show: true, filter: false },
        },
      },
      actions: {
        new: {
          isAccessible: false,
          isVisible: false,
        },
        bulkUpload: {
          actionType: "resource",
          icon: "Upload",
          label: "Bulk Upload Workspace",
          component: Components.BulkUploadResults,
        },
        delete: {
          guard:
            "This will remove the exam and all imported results under it. Do you want to continue?",
          handler: async (request, response, context) => {
            const recordId = context.record?.param("_id");
            if (!recordId) {
              return {
                notice: {
                  message: "Exam record could not be resolved.",
                  type: "error",
                },
              };
            }

            await deleteResultExamSetService(recordId);
            return {
              notice: {
                message: "Exam and related result set deleted successfully.",
                type: "success",
              },
              redirectUrl: `/admin/resources/${context.resource.id()}`,
            };
          },
        },
      },
    },
  };

  const studentResultResource = {
    resource: StudentResult,
    options: {
      navigation: { name: "Exam Results", icon: "Document" },
      listProperties: [
        "symbolNumber",
        "studentName",
        "course",
        "exam",
        "rank",
        "totalObtainedMarks",
        "percentage",
        "resultStatus",
      ],
      filterProperties: ["course", "exam", "symbolNumber", "studentName", "resultStatus"],
      editProperties: [
        "symbolNumber",
        "studentName",
        "course",
        "exam",
        "examDate",
        "subjects",
        "remarks",
      ],
      showProperties: [
        "symbolNumber",
        "studentName",
        "course",
        "exam",
        "examDate",
        "subjects",
        "totalFullMarks",
        "totalPassMarks",
        "totalObtainedMarks",
        "percentage",
        "rank",
        "resultStatus",
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
        },
        exam: {
          label: "Exam / Mock Test",
          reference: "ResultExam",
        },
        examDate: {
          label: "Exam Date",
          type: "datetime",
        },
        "subjects.subjectName": {
          label: "Subject Name",
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
        "subjects.status": {
          label: "Subject Status",
          isVisible: { edit: false, list: false, show: true, filter: false },
        },
        totalFullMarks: {
          label: "Total Full Marks",
          isVisible: { edit: false, list: true, show: true, filter: false },
        },
        totalPassMarks: {
          label: "Total Pass Marks",
          isVisible: { edit: false, list: false, show: true, filter: false },
        },
        totalObtainedMarks: {
          label: "Total Obtained Marks",
          isVisible: { edit: false, list: true, show: true, filter: false },
        },
        percentage: {
          label: "Percentage (%)",
          isVisible: { edit: false, list: true, show: true, filter: false },
        },
        rank: {
          label: "Rank",
          isVisible: { edit: false, list: true, show: true, filter: true },
        },
        resultStatus: {
          label: "Result",
          isVisible: { edit: false, list: true, show: true, filter: true },
        },
        result: {
          isVisible: false,
        },
        remarks: {
          label: "Remarks",
          type: "textarea",
        },
        publishedAt: {
          type: "datetime",
          isVisible: { edit: false, list: false, show: true, filter: false },
        },
      },
      actions: {
        new: {
          isAccessible: false,
          isVisible: false,
        },
        edit: {
          handler: async (request, response, context) => {
            const {
              record,
              resource,
              currentAdmin,
              h,
            } = context;

            if (!record) {
              throw new Error("Result record could not be found.");
            }

            if (String(request.method || "").toLowerCase() === "get") {
              return {
                record: record.toJSON(currentAdmin),
              };
            }

            const payload =
              request.payload && typeof request.payload === "object"
                ? { ...request.payload }
                : {};

            await ensureManualExamForPayload(payload);

            const existingResult = await StudentResult.findById(record.param("_id"));
            if (!existingResult) {
              throw new Error("Result record could not be found.");
            }

            const previousExamId = existingResult.exam ? `${existingResult.exam}` : "";
            const subjects = buildSubjectsFromPayload(payload, existingResult.subjects || []);
            const metrics = calculateResultMetrics(subjects);

            if (payload.symbolNumber !== undefined) {
              existingResult.symbolNumber = payload.symbolNumber;
            }
            if (payload.studentName !== undefined) {
              existingResult.studentName = payload.studentName;
            }
            if (payload.course !== undefined) {
              existingResult.course = payload.course;
            }
            if (payload.exam !== undefined) {
              existingResult.exam = payload.exam || null;
            }
            if (payload.examDate !== undefined) {
              existingResult.examDate = payload.examDate || existingResult.examDate;
            }
            if (payload.remarks !== undefined) {
              existingResult.remarks = payload.remarks;
            }
            if (payload.publishedAt !== undefined) {
              existingResult.publishedAt = payload.publishedAt || null;
            }

            existingResult.subjects = metrics.subjects;
            existingResult.totalFullMarks = metrics.totalFullMarks;
            existingResult.totalPassMarks = metrics.totalPassMarks;
            existingResult.totalObtainedMarks = metrics.totalObtainedMarks;
            existingResult.percentage = metrics.percentage;
            existingResult.resultStatus = metrics.resultStatus;
            existingResult.result = metrics.result;
            existingResult.lastCalculatedAt = new Date();

            await existingResult.save();

            const currentExamId = existingResult.exam ? `${existingResult.exam}` : "";
            const examIdsToRefresh = Array.from(
              new Set([previousExamId, currentExamId].filter(Boolean))
            );

            for (const examId of examIdsToRefresh) {
              await recalculateExamRanksService(examId);
            }

            const refreshedResult = await StudentResult.findById(existingResult._id).lean();
            const refreshedRecord = resource.build({
              ...refreshedResult,
              _id: refreshedResult?._id,
            });
            const [populatedRecord] = await populator([refreshedRecord], context);
            context.record = populatedRecord;

            return syncStudentResultResponse(
              {
                redirectUrl: h.resourceUrl({
                  resourceId: resource._decorated?.id() || resource.id(),
                }),
                notice: {
                  message: "successfullyUpdated",
                  type: "success",
                },
                record: populatedRecord.toJSON(currentAdmin),
              },
              refreshedResult
            );
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

  const dashboardHandler = async (request, response, context) => {
    try {
      if (!hasPermission(context.currentAdmin, "dashboard", "view")) {
        return { error: "You do not have permission to view this dashboard." };
      }

      const now = new Date();
      const currentMonthStart = getMonthStart(now);
      const previousMonthStart = shiftMonth(currentMonthStart, -1);
      const nextMonthStart = shiftMonth(currentMonthStart, 1);
      const sixMonthsAgo = shiftMonth(currentMonthStart, -5);

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
        universitiesCount,
        adminUsersCount,
        activeAdminUsersCount,
        inactiveAdminUsersCount,
        studentsByCourse,
        paymentsByStatus,
        registrationsTrendRaw,
        revenueTrendRaw,
        resultStats,
        revenueAgg,
        recentPayments,
        upcomingClasses,
        notifications,
        unreadNotifications,
        currentMonthStudents,
        previousMonthStudents,
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
        UniversityModel.countDocuments(),
        AdminUserModel.countDocuments(),
        AdminUserModel.countDocuments({ isActive: true }),
        AdminUserModel.countDocuments({ isActive: false }),
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
        Payment.aggregate([
          { $match: { status: "completed", createdAt: { $gte: sixMonthsAgo } } },
          {
            $group: {
              _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
              total: { $sum: "$totalAmount" },
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
        OnlineClass.find({ classDateTime: { $gte: new Date() } }).sort({ classDateTime: 1 }).limit(5).lean(),
        AdminNotificationModel.find().sort({ createdAt: -1 }).limit(6).lean(),
        AdminNotificationModel.countDocuments({ isRead: false }),
        Student.countDocuments({ createdAt: { $gte: currentMonthStart, $lt: nextMonthStart } }),
        Student.countDocuments({ createdAt: { $gte: previousMonthStart, $lt: currentMonthStart } }),
      ]);

      const currentRevenueEntry = revenueTrendRaw.find(
        (item) =>
          item._id.year === currentMonthStart.getFullYear() &&
          item._id.month === currentMonthStart.getMonth() + 1
      );
      const previousRevenueEntry = revenueTrendRaw.find(
        (item) =>
          item._id.year === previousMonthStart.getFullYear() &&
          item._id.month === previousMonthStart.getMonth() + 1
      );

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
          universities: universitiesCount,
          adminUsers: adminUsersCount,
          activeAdminUsers: activeAdminUsersCount,
          inactiveAdminUsers: inactiveAdminUsersCount,
        },
        growth: {
          students: calculateGrowth(currentMonthStudents, previousMonthStudents),
          revenue: calculateGrowth(currentRevenueEntry?.total || 0, previousRevenueEntry?.total || 0),
        },
        studentsByCourse,
        paymentsByStatus,
        registrationsTrend: formatMonthSeries(registrationsTrendRaw).map(({ month, count }) => ({
          month,
          count,
        })),
        revenueTrend: formatMonthSeries(revenueTrendRaw).map(({ month, total, count }) => ({
          month,
          total: total || 0,
          count: count || 0,
        })),
        resultStats,
        revenueTotal: revenueAgg.length > 0 ? revenueAgg[0].total : 0,
        recentPayments,
        upcomingClasses,
        notifications,
        unreadNotifications,
      };
    } catch (error) {
      logger.error("Dashboard handler error:", error);
      await logAdminSystemError("Dashboard", error);
      return { error: error.message };
    }
  };

  const rawResources = [
    AdminUserAdminResource,
    AdminNotificationAdminResource,
    BlogAdminResource,
    Notice,
    AdvertisementAdminResource,
    CollegeAdminResource,
    UniversityFileModel,
    LandingAdAdminResource,
    MockTestFileModel,
    { resource: MockTestAttemptModel, options: { id: "MockTestAttempt", properties: { student: { type: "reference" }, mockTest: { type: "reference" } } } },
    courseResource,
    NewsletterModel,
    ContactModel,
    PopupAdminResource,
    studentResource,
    onlineClassResource,
    recordedClassResource,
    resultExamResource,
    studentResultResource,
    paymentResource,
    {
      resource: BookOrderModel,
      options: {
        navigation: { name: "Book Orders", icon: "ShoppingCart" },
        listProperties: [
          "customerName",
          "email",
          "phone",
          "totalAmount",
          "status",
          "deliveryStatus",
          "createdAt",
        ],
        showProperties: [
          "customerName",
          "email",
          "phone",
          "address",
          "items",
          "amount",
          "totalAmount",
          "transactionUuid",
          "transactionCode",
          "status",
          "deliveryStatus",
          "paidAt",
          "createdAt",
        ],
        editProperties: ["deliveryStatus", "status"],
        properties: {
          status: {
            availableValues: [
              { value: "pending", label: "Pending" },
              { value: "completed", label: "Completed" },
              { value: "failed", label: "Failed" },
              { value: "refunded", label: "Refunded" },
              { value: "canceled", label: "Canceled" },
            ],
          },
          deliveryStatus: {
            availableValues: [
              { value: "pending", label: "Pending" },
              { value: "processing", label: "Processing" },
              { value: "shipped", label: "Shipped" },
              { value: "delivered", label: "Delivered" },
            ],
          },
        },
      },
    },
    {
      resource: InquiryModel,
      options: {
        navigation: { name: "Inquiries", icon: "Message" },
        listProperties: [
          "inquiryType",
          "institutionName",
          "name",
          "email",
          "phone",
          "course",
          "status",
          "submittedAt",
        ],
        showProperties: [
          "inquiryType",
          "institutionName",
          "name",
          "email",
          "phone",
          "course",
          "message",
          "status",
          "notes",
          "submittedAt",
          "updatedAt",
        ],
        editProperties: ["status", "notes"],
        filterProperties: ["status", "inquiryType", "institutionName", "course"],
        properties: {
          inquiryType: {
            availableValues: [
              { value: "college", label: "College" },
              { value: "university", label: "University" },
            ],
            isVisible: { list: true, show: true, edit: false },
          },
          institutionName: {
            isVisible: { list: true, show: true, edit: false },
          },
          status: {
            availableValues: [
              { value: "pending", label: "Pending" },
              { value: "contacted", label: "Contacted" },
              { value: "resolved", label: "Resolved" },
              { value: "closed", label: "Closed" },
            ],
          },
          name: {
            isVisible: { list: true, show: true, edit: false },
          },
          email: {
            isVisible: { list: true, show: true, edit: false },
          },
          phone: {
            isVisible: { list: true, show: true, edit: false },
          },
          course: {
            isVisible: { list: true, show: true, edit: false },
          },
          message: {
            isVisible: { list: false, show: true, edit: false },
            type: "textarea",
          },
          notes: {
            isVisible: { list: false, show: true, edit: true },
            type: "textarea",
          },
          submittedAt: {
            isVisible: { list: true, show: true, edit: false },
          },
          updatedAt: {
            isVisible: { list: false, show: true, edit: false },
          },
        },
      },
    },
  ];

  const adminResources = rawResources.map((resource) => {
    const resourceId =
      resource?.options?.id ||
      resource?.resource?.modelName ||
      resource?.modelName ||
      resource?.name;

    if (resourceId === "AdminNotification") {
      return decorateAdminResource(resource, { audit: false });
    }

    return decorateAdminResource(resource);
  });

  const adminOptions = {
    resources: adminResources,
    rootPath: "/admin",
    componentLoader,
    branding: adminBranding,
    assets: adminAssets,
    locale: adminLocale,
    version: {
      admin: false,
      app: adminBrandMeta.consoleName,
    },
    dashboard: {
      component: Components.Dashboard,
      handler: dashboardHandler,
    },
  };

  const admin = new AdminJS(adminOptions);
  const shouldWatchAdmin =
    process.env.NODE_ENV !== "production" && process.env.ADMINJS_WATCH === "true";

  if (shouldWatchAdmin) {
    await admin.watch();
  } else {
    await admin.initialize();

    if (process.env.NODE_ENV !== "production") {
      logger.info("Bundling AdminJS user components for development mode");
      await componentsBundler.createEntry({
        content: generateAdminComponentEntry(admin, ADMIN_JS_TMP_DIR),
      });
      await componentsBundler.build();
    }
  }

  const sessionStore = new MongoStore({
    uri: process.env.MONGO_URI,
    collection: "session",

  });

  sessionStore.on("error", (error) => {
    logger.error("Session store error:", error);
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

  adminRouter.get(
    "/api/result-courses",
    requireAdminPermission("results", "view"),
    GetAdminResultCourses
  );

  adminRouter.get(
    "/api/result-exams",
    requireAdminPermission("results", "view"),
    GetAdminResultExams
  );

  adminRouter.post(
    "/api/result-exams",
    requireAdminPermission("results", "add"),
    CreateAdminResultExam
  );

  adminRouter.patch(
    "/api/result-exams/:examId",
    requireAdminPermission("results", "edit"),
    UpdateAdminResultExam
  );

  adminRouter.post(
    "/api/result-exams/:examId/publish",
    requireAdminPermission("results", "edit"),
    PublishResultExam
  );

  adminRouter.post(
    "/api/result-exams/:examId/unpublish",
    requireAdminPermission("results", "edit"),
    UnpublishResultExam
  );

  adminRouter.post(
    "/api/result-exams/:examId/recalculate-ranks",
    requireAdminPermission("results", "edit"),
    RecalculateExamRanks
  );

  adminRouter.delete(
    "/api/result-exams/:examId",
    requireAdminPermission("results", "delete"),
    DeleteResultExamSet
  );

  adminRouter.get(
    "/api/results/templates",
    requireAdminPermission("results", "view"),
    DownloadResultTemplate
  );

  adminRouter.post(
    "/api/results/bulk-upload/preview",
    requireAdminPermission("results", "add"),
    PreviewBulkUploadResults
  );

  adminRouter.post(
    "/api/results/bulk-upload/import",
    requireAdminPermission("results", "add"),
    ImportBulkUploadResults
  );

  const Router = express.Router();
  Router.use(admin.options.rootPath, (req, res, next) => {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    next();
  });
  Router.use(admin.options.rootPath, adminRouter);
  return Router;
};

    

export { startAdminPanel };
