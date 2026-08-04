import { createContext, useCallback, useContext, useEffect, useState } from "react";

const SiteConfigContext = createContext(null);

const FALLBACK_CONFIG = {
  social: {},
  site: {},
  partners: {},
  payments: { razorpay: { enabled: false, keyId: "", plans: {} } },
};

let cachedConfig = null;
let fetchPromise = null;

export async function fetchSiteConfig() {
  if (cachedConfig) return cachedConfig;
  if (fetchPromise) return fetchPromise;
  fetchPromise = fetch("/api/site/config")
    .then((r) => r.json())
    .then((data) => {
      cachedConfig = data.config || FALLBACK_CONFIG;
      cachedConfig._plans = data.plans || [];
      return cachedConfig;
    })
    .catch(() => FALLBACK_CONFIG)
    .finally(() => {
      fetchPromise = null;
    });
  return fetchPromise;
}

export function invalidateSiteConfig() {
  cachedConfig = null;
}

export function SiteConfigProvider({ children }) {
  const [config, setConfig] = useState(cachedConfig || FALLBACK_CONFIG);
  const [loading, setLoading] = useState(!cachedConfig);

  const reload = useCallback(async () => {
    invalidateSiteConfig();
    setLoading(true);
    const next = await fetchSiteConfig();
    setConfig(next);
    setLoading(false);
    return next;
  }, []);

  useEffect(() => {
    if (!cachedConfig) reload();
    else setConfig(cachedConfig);
  }, [reload]);

  return (
    <SiteConfigContext.Provider value={{ config, loading, reload }}>
      {children}
    </SiteConfigContext.Provider>
  );
}

export function useSiteConfig() {
  const ctx = useContext(SiteConfigContext);
  if (!ctx) throw new Error("useSiteConfig must be used within SiteConfigProvider");
  return ctx;
}

export function getPartnersFromConfig(config) {
  return Object.values(config?.partners || {}).filter((p) => p.enabled !== false);
}

export function isPartnerComingSoonFromConfig(config, providerId) {
  const p = config?.partners?.[providerId];
  return Boolean(p?.comingSoon);
}

export function buildPartnerUrlFromConfig(config, providerId, query = "groceries") {
  const full = cachedConfig?._fullPartners;
  const partner = full?.[providerId];
  if (partner?.searchUrlTemplate) {
    return partner.searchUrlTemplate.replace("{query}", encodeURIComponent(query));
  }
  const defaults = {
    instamart: `https://www.swiggy.com/instamart/search?custom_back=true&query=${encodeURIComponent(query)}`,
    blinkit: `https://blinkit.com/s/?q=${encodeURIComponent(query)}`,
    zepto: `https://www.zeptonow.com/search?query=${encodeURIComponent(query)}`,
    bigbasket: `https://www.bigbasket.com/ps/?q=${encodeURIComponent(query)}`,
    zomato: `https://www.zomato.com/search?q=${encodeURIComponent(query)}`,
    swiggy: `https://www.swiggy.com/search?query=${encodeURIComponent(query)}`,
  };
  return defaults[providerId] || null;
}
