import { Router } from "express";
import { getPublicConfig } from "../services/siteConfigService.js";
import { getPaymentPlans } from "../services/paymentService.js";

const router = Router();

router.get("/config", (_req, res) => {
  const config = getPublicConfig();
  res.json({
    success: true,
    config,
    plans: getPaymentPlans(),
  });
});

export default router;
