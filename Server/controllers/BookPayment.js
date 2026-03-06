import crypto from "crypto";
import BookOrderModel from "../models/BookOrder.js";

// eSewa config from env
const getEsewaConfig = () => ({
  merchantCode: process.env.ESEWA_MERCHANT_CODE || "EPAYTEST",
  secretKey: process.env.ESEWA_SECRET_KEY || "8gBm/:&EnhH.1/q",
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
 * POST /api/book-payment/initiate
 * Creates a book order and returns eSewa form params + signature
 */
export const initiateBookPayment = async (req, res) => {
  try {
    const { customerName, email, phone, address, items } = req.body;

    if (!customerName || !email || !phone || !address || !items || !items.length) {
      return res.status(400).json({
        success: false,
        message: "All fields are required (customerName, email, phone, address, items)",
      });
    }

    // Calculate total from items
    const amount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const taxAmount = 0;
    const totalAmount = amount + taxAmount;

    if (totalAmount <= 0) {
      return res.status(400).json({ success: false, message: "Invalid order amount" });
    }

    const config = getEsewaConfig();

    // Unique transaction ID
    const transactionUuid = `BOOK-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    // Create book order record in DB
    const order = await BookOrderModel.create({
      customerName,
      email,
      phone,
      address,
      items: items.map((item) => ({
        bookId: item.id,
        title: item.title,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
      })),
      amount,
      taxAmount,
      totalAmount,
      transactionUuid,
      productCode: config.merchantCode,
      status: "pending",
    });

    // Generate signature
    const signatureMessage = `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${config.merchantCode}`;
    const signature = generateSignature(signatureMessage, config.secretKey);

    // eSewa form parameters
    const esewaParams = {
      amount: String(amount),
      tax_amount: String(taxAmount),
      total_amount: String(totalAmount),
      transaction_uuid: transactionUuid,
      product_code: config.merchantCode,
      product_service_charge: "0",
      product_delivery_charge: "0",
      success_url: `${process.env.BACKEND_URL || "http://localhost:5000"}/api/book-payment/esewa/success`,
      failure_url: `${process.env.BACKEND_URL || "http://localhost:5000"}/api/book-payment/esewa/failure`,
      signed_field_names: "total_amount,transaction_uuid,product_code",
      signature,
    };

    return res.status(200).json({
      success: true,
      message: "Book payment initiated",
      data: {
        orderId: order._id,
        esewaParams,
        esewaPaymentUrl: config.paymentUrl,
      },
    });
  } catch (error) {
    console.error("Book payment initiation error:", error);
    return res.status(500).json({ success: false, message: "Failed to initiate book payment" });
  }
};

/**
 * GET /api/book-payment/esewa/success
 * eSewa redirects here after successful book payment
 */
export const esewaBookSuccess = async (req, res) => {
  try {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const config = getEsewaConfig();

    const encodedData = req.query.data;
    if (!encodedData) {
      return res.redirect(`${frontendUrl}/payment/failure?reason=no_data&type=book`);
    }

    const decodedString = Buffer.from(encodedData, "base64").toString("utf-8");
    let esewaResponse;
    try {
      esewaResponse = JSON.parse(decodedString);
    } catch {
      return res.redirect(`${frontendUrl}/payment/failure?reason=invalid_data&type=book`);
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
      console.error("eSewa signature verification failed for book order:", transaction_uuid);
      await BookOrderModel.findOneAndUpdate(
        { transactionUuid: transaction_uuid },
        { status: "failed" }
      );
      return res.redirect(`${frontendUrl}/payment/failure?reason=signature_mismatch&type=book`);
    }

    if (status !== "COMPLETE") {
      await BookOrderModel.findOneAndUpdate(
        { transactionUuid: transaction_uuid },
        { status: "failed" }
      );
      return res.redirect(`${frontendUrl}/payment/failure?reason=incomplete&uuid=${transaction_uuid}&type=book`);
    }

    // Update order record
    const order = await BookOrderModel.findOneAndUpdate(
      { transactionUuid: transaction_uuid },
      {
        status: "completed",
        transactionCode: transaction_code,
        paidAt: new Date(),
        deliveryStatus: "processing",
      },
      { new: true }
    );

    if (!order) {
      return res.redirect(`${frontendUrl}/payment/failure?reason=not_found&type=book`);
    }

    // Redirect to frontend success page
    return res.redirect(
      `${frontendUrl}/payment/success?uuid=${transaction_uuid}&type=book`
    );
  } catch (error) {
    console.error("eSewa book success callback error:", error);
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    return res.redirect(`${frontendUrl}/payment/failure?reason=server_error&type=book`);
  }
};

/**
 * GET /api/book-payment/esewa/failure
 * eSewa redirects here when book payment fails or is canceled
 */
export const esewaBookFailure = async (req, res) => {
  try {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

    const encodedData = req.query.data;
    if (encodedData) {
      try {
        const decodedString = Buffer.from(encodedData, "base64").toString("utf-8");
        const esewaResponse = JSON.parse(decodedString);
        if (esewaResponse.transaction_uuid) {
          await BookOrderModel.findOneAndUpdate(
            { transactionUuid: esewaResponse.transaction_uuid },
            { status: "failed" }
          );
        }
      } catch {
        // Ignore decode errors on failure callback
      }
    }

    return res.redirect(`${frontendUrl}/payment/failure?reason=payment_failed&type=book`);
  } catch (error) {
    console.error("eSewa book failure callback error:", error);
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    return res.redirect(`${frontendUrl}/payment/failure?reason=server_error&type=book`);
  }
};

/**
 * GET /api/book-payment/status/:transactionUuid
 * Check book order payment status
 */
export const getBookPaymentStatus = async (req, res) => {
  try {
    const { transactionUuid } = req.params;
    const order = await BookOrderModel.findOne({ transactionUuid });

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    return res.status(200).json({
      success: true,
      data: {
        status: order.status,
        deliveryStatus: order.deliveryStatus,
        transactionUuid: order.transactionUuid,
        transactionCode: order.transactionCode,
        items: order.items,
        customerName: order.customerName,
        email: order.email,
        phone: order.phone,
        address: order.address,
        amount: order.amount,
        totalAmount: order.totalAmount,
        paidAt: order.paidAt,
      },
    });
  } catch (error) {
    console.error("Book payment status check error:", error);
    return res.status(500).json({ success: false, message: "Failed to check order status" });
  }
};
