import { useEffect } from "react";
import { setPageSeo, setJsonLd } from "../lib/seo";

export default function usePageSeo(payload) {
  useEffect(() => {
    if (!payload) return;
    if (payload.seo) setPageSeo(payload.seo);
    if (payload.jsonLd) setJsonLd(payload.jsonLd);
  }, [payload]);
}
