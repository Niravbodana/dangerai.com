/**
 * Site-wide config — partners, social links, payments (admin-managed).
 */
import { getDb } from "../db/connection.js";

const CONFIG_KEY = "main";

export const DEFAULT_CONFIG = {
  social: {
    instagram: "",
    youtube: "",
    whatsapp: "",
    twitter: "",
    facebook: "",
    telegram: "",
  },
  site: {
    supportEmail: "hello@rasoira.com",
    supportPhone: "",
    privacyUrl: "/privacy",
    termsUrl: "/terms",
    websiteUrl: "https://rasoira.com",
  },
  partners: {
    instamart: {
      id: "instamart",
      name: "Instamart",
      type: "grocery",
      enabled: true,
      comingSoon: true,
      searchUrlTemplate: "https://www.swiggy.com/instamart/search?custom_back=true&query={query}",
    },
    blinkit: {
      id: "blinkit",
      name: "Blinkit",
      type: "grocery",
      enabled: true,
      comingSoon: true,
      searchUrlTemplate: "https://blinkit.com/s/?q={query}",
    },
    zepto: {
      id: "zepto",
      name: "Zepto",
      type: "grocery",
      enabled: true,
      comingSoon: true,
      searchUrlTemplate: "https://www.zeptonow.com/search?query={query}",
    },
    bigbasket: {
      id: "bigbasket",
      name: "BigBasket",
      type: "grocery",
      enabled: true,
      comingSoon: false,
      searchUrlTemplate: "https://www.bigbasket.com/ps/?q={query}",
    },
    zomato: {
      id: "zomato",
      name: "Zomato",
      type: "delivery",
      enabled: true,
      comingSoon: true,
      searchUrlTemplate: "https://www.zomato.com/search?q={query}",
    },
    swiggy: {
      id: "swiggy",
      name: "Swiggy",
      type: "delivery",
      enabled: true,
      comingSoon: true,
      searchUrlTemplate: "https://www.swiggy.com/search?query={query}",
    },
  },
  payments: {
    razorpay: {
      enabled: false,
      mode: "test",
      keyId: "",
      keySecret: "",
      webhookSecret: "",
      checkoutNote: "Secure payment via Razorpay",
      plans: {
        plus: {
          id: "plus",
          name: "Rasoira Plus",
          nameHi: "रसोइरा प्लस",
          amount: 9900,
          currency: "INR",
          period: "month",
          displayPrice: 99,
        },
        family: {
          id: "family",
          name: "Family",
          nameHi: "फ़ैमिली",
          amount: 19900,
          currency: "INR",
          period: "month",
          displayPrice: 199,
        },
      },
    },
  },
};

function deepMerge(base, patch) {
  if (!patch || typeof patch !== "object") return base;
  const out = { ...base };
  for (const [k, v] of Object.entries(patch)) {
    if (v && typeof v === "object" && !Array.isArray(v) && base[k] && typeof base[k] === "object") {
      out[k] = deepMerge(base[k], v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

function seedDefaultConfig() {
  const now = new Date().toISOString();
  getDb().prepare(
    `INSERT OR IGNORE INTO site_config (key, value_json, updated_at) VALUES (?, ?, ?)`
  ).run(CONFIG_KEY, JSON.stringify(DEFAULT_CONFIG), now);
}

export function getFullConfig() {
  const db = getDb();
  const row = db.prepare("SELECT value_json FROM site_config WHERE key = ?").get(CONFIG_KEY);
  if (!row) {
    seedDefaultConfig();
    return structuredClone(DEFAULT_CONFIG);
  }
  try {
    return deepMerge(DEFAULT_CONFIG, JSON.parse(row.value_json));
  } catch {
    return structuredClone(DEFAULT_CONFIG);
  }
}

export function saveConfig(patch) {
  const current = getFullConfig();
  const merged = deepMerge(current, patch);
  const now = new Date().toISOString();
  getDb().prepare(
    `INSERT INTO site_config (key, value_json, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value_json = excluded.value_json, updated_at = excluded.updated_at`
  ).run(CONFIG_KEY, JSON.stringify(merged), now);
  return merged;
}

/** Public-safe config — no secrets */
export function getPublicConfig() {
  const full = getFullConfig();
  const razorpay = full.payments?.razorpay || {};
  return {
    social: full.social,
    site: full.site,
    partners: Object.fromEntries(
      Object.entries(full.partners || {}).map(([id, p]) => [
        id,
        {
          id: p.id || id,
          name: p.name,
          type: p.type || "grocery",
          enabled: p.enabled !== false,
          comingSoon: Boolean(p.comingSoon),
        },
      ])
    ),
    payments: {
      razorpay: {
        enabled: Boolean(razorpay.enabled && razorpay.keyId),
        mode: razorpay.mode || "test",
        keyId: razorpay.keyId || "",
        checkoutNote: razorpay.checkoutNote || "",
        plans: razorpay.plans || {},
      },
    },
  };
}

/** Admin view — masks secret partially */
export function getAdminConfig() {
  const full = getFullConfig();
  const razorpay = full.payments?.razorpay || {};
  return {
    ...full,
    payments: {
      razorpay: {
        ...razorpay,
        keySecret: razorpay.keySecret ? maskSecret(razorpay.keySecret) : "",
        webhookSecret: razorpay.webhookSecret ? maskSecret(razorpay.webhookSecret) : "",
        hasKeySecret: Boolean(razorpay.keySecret),
        hasWebhookSecret: Boolean(razorpay.webhookSecret),
      },
    },
  };
}

function maskSecret(val) {
  if (!val || val.length < 8) return "••••••••";
  return `${val.slice(0, 4)}••••${val.slice(-4)}`;
}

export function updateAdminConfig(patch) {
  const current = getFullConfig();
  const next = deepMerge(current, patch);

  const rzPatch = patch.payments?.razorpay;
  if (rzPatch) {
    const curRz = current.payments?.razorpay || {};
    if (rzPatch.keySecret?.includes("••••")) next.payments.razorpay.keySecret = curRz.keySecret;
    if (rzPatch.webhookSecret?.includes("••••")) next.payments.razorpay.webhookSecret = curRz.webhookSecret;
    if (rzPatch.keySecret === "") next.payments.razorpay.keySecret = "";
    if (rzPatch.webhookSecret === "") next.payments.razorpay.webhookSecret = "";
  }

  return saveConfig(next);
}

export function getPartnerList() {
  const config = getFullConfig();
  return Object.values(config.partners || {}).filter((p) => p.enabled !== false);
}

export function buildPartnerSearchUrl(partnerId, query = "groceries") {
  const partner = getFullConfig().partners?.[partnerId];
  if (!partner?.searchUrlTemplate) return null;
  return partner.searchUrlTemplate.replace("{query}", encodeURIComponent(query));
}

export function isPartnerComingSoon(partnerId) {
  const partner = getFullConfig().partners?.[partnerId];
  return Boolean(partner?.comingSoon);
}

export function getRazorpayCredentials() {
  const rz = getFullConfig().payments?.razorpay || {};
  if (!rz.enabled || !rz.keyId || !rz.keySecret) return null;
  return { keyId: rz.keyId, keySecret: rz.keySecret, webhookSecret: rz.webhookSecret, mode: rz.mode };
}
