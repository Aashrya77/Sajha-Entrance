import express from "express";
import {
  initiateBookPayment,
  esewaBookSuccess,
  esewaBookFailure,
  getBookPaymentStatus,
} from "../controllers/BookPayment.js";

const router = express.Router();

// Initiate book payment — frontend calls this to get eSewa form params
router.post("/book-payment/initiate", initiateBookPayment);

// eSewa callback URLs — eSewa redirects the browser here
router.get("/book-payment/esewa/success", esewaBookSuccess);
router.get("/book-payment/esewa/failure", esewaBookFailure);

// Check book order payment status
router.get("/book-payment/status/:transactionUuid", getBookPaymentStatus);

export default router;
