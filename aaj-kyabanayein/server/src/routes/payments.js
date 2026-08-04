import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import {
  createRazorpayOrder,
  verifyPaymentSignature,
  completePayment,
  verifyWebhookSignature,
  getUserPaymentHistory,
  getPaymentPlans,
} from "../services/paymentService.js";
import { getPublicConfig } from "../services/siteConfigService.js";
import { findUserById, toPublicUser } from "../services/userStore.js";

const router = Router();

router.get("/plans", (_req, res) => {
  const publicConfig = getPublicConfig();
  res.json({
    success: true,
    plans: getPaymentPlans(),
    razorpay: publicConfig.payments?.razorpay || {},
  });
});

router.post("/create-order", authMiddleware, async (req, res) => {
  const { planId } = req.body;
  if (!planId) {
    return res.status(400).json({ success: false, message: "planId required" });
  }

  const result = await createRazorpayOrder(req.userId, planId);
  if (!result.ok) {
    return res.status(400).json({ success: false, ...result });
  }

  const user = findUserById(req.userId);
  res.json({
    success: true,
    order: {
      id: result.orderId,
      amount: result.amount,
      currency: result.currency,
      keyId: result.keyId,
      plan: result.plan,
    },
    user: user ? { name: user.name, email: user.email } : null,
  });
});

router.post("/verify", authMiddleware, (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ success: false, message: "Missing payment fields" });
  }

  const valid = verifyPaymentSignature({
    orderId: razorpay_order_id,
    paymentId: razorpay_payment_id,
    signature: razorpay_signature,
  });

  if (!valid) {
    return res.status(400).json({ success: false, message: "Invalid payment signature" });
  }

  const result = completePayment({
    razorpayOrderId: razorpay_order_id,
    razorpayPaymentId: razorpay_payment_id,
    userId: req.userId,
  });

  if (!result.ok) {
    return res.status(400).json({ success: false, ...result });
  }

  const user = findUserById(req.userId);
  res.json({
    success: true,
    planId: result.planId,
    user: user ? toPublicUser(user) : null,
  });
});

router.post("/webhook", (req, res) => {
  const signature = req.headers["x-razorpay-signature"];
  const rawBody = req.rawBody || JSON.stringify(req.body);

  if (!verifyWebhookSignature(rawBody, signature)) {
    return res.status(400).json({ success: false, message: "Invalid webhook signature" });
  }

  const event = req.body?.event;
  const payment = req.body?.payload?.payment?.entity;

  if (event === "payment.captured" && payment?.order_id) {
    completePayment({
      razorpayOrderId: payment.order_id,
      razorpayPaymentId: payment.id,
    });
  }

  res.json({ success: true });
});

router.get("/history", authMiddleware, (req, res) => {
  res.json({ success: true, orders: getUserPaymentHistory(req.userId) });
});

export default router;
