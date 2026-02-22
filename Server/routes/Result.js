import express from "express";
import { SearchResult, GetTopResults, BulkUploadResults, upload } from "../controllers/Result.js";

const Router = express.Router();

Router.get("/results/top", GetTopResults);
Router.get("/results", SearchResult);
Router.post("/results/bulk-upload", upload.single("file"), BulkUploadResults);

export default Router;
