import express from "express";
import {
  initiatePayment,
  esewaSuccess,
  esewaFailure,
  getPaymentStatus,
  verifyPaymentWithEsewa,
} from "../controllers/Payment.js";

const router = express.Router();

// Initiate payment — frontend calls this to get eSewa form params
router.post("/payment/initiate", initiatePayment);

// eSewa callback URLs — eSewa redirects the browser here
router.get("/payment/esewa/success", esewaSuccess);
router.get("/payment/esewa/failure", esewaFailure);

// Check payment status by transaction UUID
router.get("/payment/status/:transactionUuid", getPaymentStatus);

// Server-side verify against eSewa's status API
router.post("/payment/verify/:transactionUuid", verifyPaymentWithEsewa);

export default router;
