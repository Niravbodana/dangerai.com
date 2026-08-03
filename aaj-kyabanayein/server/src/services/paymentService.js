/**
 * Razorpay payment pipeline — order create, verify, webhook.
 */
import crypto from "crypto";
import { getDb } from "../db/connection.js";
import { getFullConfig, getRazorpayCredentials } from "./siteConfigService.js";
import { updateUserPlan } from "./userStore.js";

function orderId() {
  return `ord_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function razorpayAuthHeader(keyId, keySecret) {
  return `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`;
}

export function getPaymentPlans() {
  const plans = getFullConfig().payments?.razorpay?.plans || {};
  return Object.values(plans);
}

export function getPlanById(planId) {
  return getFullConfig().payments?.razorpay?.plans?.[planId] || null;
}

export async function createRazorpayOrder(userId, planId) {
  const creds = getRazorpayCredentials();
  if (!creds) {
    return { ok: false, error: "payments_disabled", message: "Razorpay is not configured in admin" };
  }

  const plan = getPlanById(planId);
  if (!plan || planId === "free") {
    return { ok: false, error: "invalid_plan", message: "Invalid plan selected" };
  }

  const id = orderId();
  const amount = plan.amount;
  const currency = plan.currency || "INR";
  const now = new Date().toISOString();

  const body = {
    amount,
    currency,
    receipt: id,
    notes: { userId, planId, planName: plan.name },
  };

  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: razorpayAuthHeader(creds.keyId, creds.keySecret),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { ok: false, error: "razorpay_error", message: data.error?.description || "Order creation failed" };
  }

  getDb().prepare(
    `INSERT INTO payment_orders (id, user_id, plan_id, razorpay_order_id, amount, currency, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 'created', ?)`
  ).run(id, userId, planId, data.id, amount, currency, now);

  return {
    ok: true,
    orderId: data.id,
    amount: data.amount,
    currency: data.currency,
    keyId: creds.keyId,
    plan,
    internalOrderId: id,
  };
}

export function verifyPaymentSignature({ orderId, paymentId, signature }) {
  const creds = getRazorpayCredentials();
  if (!creds) return false;
  const payload = `${orderId}|${paymentId}`;
  const expected = crypto.createHmac("sha256", creds.keySecret).update(payload).digest("hex");
  return expected === signature;
}

export function verifyWebhookSignature(rawBody, signature) {
  const creds = getRazorpayCredentials();
  if (!creds?.webhookSecret || !signature) return false;
  const expected = crypto.createHmac("sha256", creds.webhookSecret).update(rawBody).digest("hex");
  return expected === signature;
}

export function completePayment({ razorpayOrderId, razorpayPaymentId, userId }) {
  const db = getDb();
  const row = db.prepare("SELECT * FROM payment_orders WHERE razorpay_order_id = ?").get(razorpayOrderId);
  if (!row) return { ok: false, error: "order_not_found" };
  if (row.status === "paid") return { ok: true, alreadyPaid: true, planId: row.plan_id };

  if (userId && row.user_id !== userId) {
    return { ok: false, error: "user_mismatch" };
  }

  const now = new Date().toISOString();
  db.prepare(
    `UPDATE payment_orders SET status = 'paid', razorpay_payment_id = ?, paid_at = ? WHERE razorpay_order_id = ?`
  ).run(razorpayPaymentId, now, razorpayOrderId);

  updateUserPlan(row.user_id, row.plan_id);

  return { ok: true, planId: row.plan_id, userId: row.user_id };
}

export function getUserPaymentHistory(userId) {
  return getDb()
    .prepare("SELECT id, plan_id, amount, currency, status, created_at, paid_at FROM payment_orders WHERE user_id = ? ORDER BY created_at DESC LIMIT 20")
    .all(userId);
}
