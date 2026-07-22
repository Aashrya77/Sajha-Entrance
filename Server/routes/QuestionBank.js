import express from "express";
import {
  DownloadQuestionBankPdf,
  GetQuestionBank,
  GetQuestionBankDetail,
  PreviewQuestionBankPdf,
} from "../controllers/QuestionBank.js";

const Router = express.Router();

Router.get("/question-bank", GetQuestionBank);
Router.get("/question-bank/:slug/preview/pdf", PreviewQuestionBankPdf);
Router.get("/question-bank/:slug/download/pdf", DownloadQuestionBankPdf);
Router.get("/question-bank/:slug", GetQuestionBankDetail);

export default Router;
