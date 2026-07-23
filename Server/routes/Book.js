import express from "express";
import { GetBookData, GetBooks } from "../controllers/Book.js";

const router = express.Router();

router.get("/books", GetBooks);
router.get("/book/:id", GetBookData);

export default router;
