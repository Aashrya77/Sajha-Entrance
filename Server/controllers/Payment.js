import crypto from "crypto";
import PaymentModel from "../models/Payment.js";
import CourseModel from "../models/Course.js";
import Student from "../models/Student.js";

// eSewa config from env
const getEsewaConfig = () => ({
  merchantCode: process.env.ESEWA_MERCHANT_CODE || "EPAYTEST",
  secretKey: process.env.ESEWA_SECRET_KEY || "8gBm/:&EnhH.1/q",
  // Use test URL by default; set ESEWA_ENVIRONMENT=production for live
  paymentUrl:
    process.env.ESEWA_ENVIRONMENT === "production"
      ? "https://epay.esewa.com.np/api/epay/main/v2/form"
      : "https://rc-epay.esewa.com.np/api/epay/main/v2/form",
  statusUrl:
    process.env.ESEWA_ENVIRONMENT === "production"
      ? "https://esewa.com.np/api/epay/transaction/status/"
      : "https://rc.esewa.com.np/api/epay/transaction/status/",
});

// Generate HMAC SHA256 signature (base64)
const generateSignature = (message, secretKey) => {
  const hmac = crypto.createHmac("sha256", secretKey);
  hmac.update(message);
  return hmac.digest("base64");
};

// Verify signature from eSewa response
const verifySignature = (data, receivedSignature, secretKey) => {
  const { signed_field_names } = data;
  const fields = signed_field_names.split(",");
  const message = fields.map((field) => `${field}=${data[field]}`).join(",");
  const expectedSignature = generateSignature(message, secretKey);
  return expectedSignature === receivedSignature;
};

/**
 * POST /api/payment/initiate
 * Creates a payment record and returns eSewa form params + signature
 */
export const initiatePayment = async (req, res) => {
  try {
    const { courseId, fullName, email, phone } = req.body;

    if (!courseId || !fullName || !email || !phone) {
      return res.status(400).json({
        success: false,
        message: "All fields are required (courseId, fullName, email, phone)",
      });
    }

    // Verify course exists
    const course = await CourseModel.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    const config = getEsewaConfig();

    // Amount — you can make this dynamic per course if you add a fee field to Course model
    const amount = Number(req.body.amount) || 5000;
    const taxAmount = 0;
    const totalAmount = amount + taxAmount;

    // Unique transaction ID
    const transactionUuid = `SAJHA-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    // Create payment record in DB
    const payment = await PaymentModel.create({
      studentName: fullName,
      email,
      phone,
      course: courseId,
      courseTitle: course.title || course.fullForm || "Course",
      amount,
      taxAmount,
      totalAmount,
      transactionUuid,
      productCode: config.merchantCode,
      status: "pending",
    });

    // Generate signature: message = "total_amount=X,transaction_uuid=Y,product_code=Z"
    const signatureMessage = `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${config.merchantCode}`;
    const signature = generateSignature(signatureMessage, config.secretKey);

    // Frontend base URL for success/failure redirects
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

    // eSewa form parameters
    const esewaParams = {
      amount: String(amount),
      tax_amount: String(taxAmount),
      total_amount: String(totalAmount),
      transaction_uuid: transactionUuid,
      product_code: config.merchantCode,
      product_service_charge: "0",
      product_delivery_charge: "0",
      success_url: `${process.env.BACKEND_URL || "http://localhost:5000"}/api/payment/esewa/success`,
      failure_url: `${process.env.BACKEND_URL || "http://localhost:5000"}/api/payment/esewa/failure`,
      signed_field_names: "total_amount,transaction_uuid,product_code",
      signature,
    };

    return res.status(200).json({
      success: true,
      message: "Payment initiated",
      data: {
        paymentId: payment._id,
        esewaParams,
        esewaPaymentUrl: config.paymentUrl,
      },
    });
  } catch (error) {
    console.error("Payment initiation error:", error);
    return res.status(500).json({ success: false, message: "Failed to initiate payment" });
  }
};

/**
 * GET /api/payment/esewa/success
 * eSewa redirects here after successful payment with Base64-encoded data in query param
 */
export const esewaSuccess = async (req, res) => {
  try {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const config = getEsewaConfig();

    // eSewa sends the response as a base64-encoded JSON in the `data` query param
    const encodedData = req.query.data;
    if (!encodedData) {
      return res.redirect(`${frontendUrl}/payment/failure?reason=no_data`);
    }

    // Decode base64
    const decodedString = Buffer.from(encodedData, "base64").toString("utf-8");
    let esewaResponse;
    try {
      esewaResponse = JSON.parse(decodedString);
    } catch {
      return res.redirect(`${frontendUrl}/payment/failure?reason=invalid_data`);
    }

    const {
      transaction_code,
      status,
      total_amount,
      transaction_uuid,
      product_code,
      signed_field_names,
      signature,
    } = esewaResponse;

    // Verify signature
    const isValid = verifySignature(esewaResponse, signature, config.secretKey);
    if (!isValid) {
      console.error("eSewa signature verification failed for:", transaction_uuid);
      // Update payment as failed
      await PaymentModel.findOneAndUpdate(
        { transactionUuid: transaction_uuid },
        { status: "failed" }
      );
      return res.redirect(`${frontendUrl}/payment/failure?reason=signature_mismatch`);
    }

    if (status !== "COMPLETE") {
      await PaymentModel.findOneAndUpdate(
        { transactionUuid: transaction_uuid },
        { status: "failed" }
      );
      return res.redirect(`${frontendUrl}/payment/failure?reason=incomplete&uuid=${transaction_uuid}`);
    }

    // Update payment record
    const payment = await PaymentModel.findOneAndUpdate(
      { transactionUuid: transaction_uuid },
      {
        status: "completed",
        transactionCode: transaction_code,
        paidAt: new Date(),
      },
      { new: true }
    );

    if (!payment) {
      return res.redirect(`${frontendUrl}/payment/failure?reason=not_found`);
    }

    // Update student accountStatus to "Paid" if a matching student exists
    if (payment.email) {
      const updatedStudent = await Student.findOneAndUpdate(
        { email: payment.email.toLowerCase() },
        { accountStatus: "Paid" },
        { new: true }
      );
      if (updatedStudent) {
        console.log(`✅ Student ${updatedStudent.email} accountStatus updated to Paid`);
      }
    }

    // Redirect to frontend success page
    return res.redirect(
      `${frontendUrl}/payment/success?uuid=${transaction_uuid}&course=${encodeURIComponent(payment.courseTitle)}`
    );
  } catch (error) {
    console.error("eSewa success callback error:", error);
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    return res.redirect(`${frontendUrl}/payment/failure?reason=server_error`);
  }
};

/**
 * GET /api/payment/esewa/failure
 * eSewa redirects here when payment fails or is canceled
 */
export const esewaFailure = async (req, res) => {
  try {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

    // Try to decode data if present
    const encodedData = req.query.data;
    if (encodedData) {
      try {
        const decodedString = Buffer.from(encodedData, "base64").toString("utf-8");
        const esewaResponse = JSON.parse(decodedString);
        if (esewaResponse.transaction_uuid) {
          await PaymentModel.findOneAndUpdate(
            { transactionUuid: esewaResponse.transaction_uuid },
            { status: "failed" }
          );
        }
      } catch {
        // Ignore decode errors on failure callback
      }
    }

    return res.redirect(`${frontendUrl}/payment/failure?reason=payment_failed`);
  } catch (error) {
    console.error("eSewa failure callback error:", error);
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    return res.redirect(`${frontendUrl}/payment/failure?reason=server_error`);
  }
};

/**
 * GET /api/payment/status/:transactionUuid
 * Check payment status (can be used by frontend to poll or verify)
 */
export const getPaymentStatus = async (req, res) => {
  try {
    const { transactionUuid } = req.params;
    const payment = await PaymentModel.findOne({ transactionUuid }).populate("course", "title fullForm");

    if (!payment) {
      return res.status(404).json({ success: false, message: "Payment not found" });
    }

    return res.status(200).json({
      success: true,
      data: {
        status: payment.status,
        transactionUuid: payment.transactionUuid,
        transactionCode: payment.transactionCode,
        courseTitle: payment.courseTitle,
        amount: payment.amount,
        totalAmount: payment.totalAmount,
        studentName: payment.studentName,
        email: payment.email,
        paidAt: payment.paidAt,
      },
    });
  } catch (error) {
    console.error("Payment status check error:", error);
    return res.status(500).json({ success: false, message: "Failed to check payment status" });
  }
};

/**
 * POST /api/payment/verify/:transactionUuid
 * Server-side verification against eSewa's status API (optional extra security)
 */
export const verifyPaymentWithEsewa = async (req, res) => {
  try {
    const { transactionUuid } = req.params;
    const payment = await PaymentModel.findOne({ transactionUuid });

    if (!payment) {
      return res.status(404).json({ success: false, message: "Payment not found" });
    }

    const config = getEsewaConfig();
    const statusCheckUrl = `${config.statusUrl}?product_code=${config.merchantCode}&total_amount=${payment.totalAmount}&transaction_uuid=${transactionUuid}`;

    // Use native fetch (Node 18+) or you can use axios
    const response = await fetch(statusCheckUrl);
    const statusData = await response.json();

    // Update local record based on eSewa's response
    if (statusData.status === "COMPLETE") {
      payment.status = "completed";
      payment.refId = statusData.ref_id;
      if (!payment.paidAt) payment.paidAt = new Date();
      await payment.save();
    } else if (statusData.status === "CANCELED" || statusData.status === "NOT_FOUND") {
      payment.status = "failed";
      await payment.save();
    }

    return res.status(200).json({
      success: true,
      data: {
        localStatus: payment.status,
        esewaStatus: statusData.status,
        refId: statusData.ref_id,
      },
    });
  } catch (error) {
    console.error("eSewa verification error:", error);
    return res.status(500).json({ success: false, message: "Failed to verify with eSewa" });
  }
};
