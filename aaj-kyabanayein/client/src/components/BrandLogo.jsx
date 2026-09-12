import { APP_NAME, APP_TAGLINE } from "../lib/brand";

export default function BrandLogo({ className = "h-9 w-auto sm:h-10", iconOnly = false, light = true, decorative = false }) {
  const src = iconOnly ? "/logo.svg" : light ? "/logo-wordmark-light.svg" : "/logo-wordmark.svg";
  return (
    <img
      src={src}
      alt={decorative ? "" : `${APP_NAME} — ${APP_TAGLINE}`}
      aria-hidden={decorative || undefined}
      className={className}
    />
  );
}
