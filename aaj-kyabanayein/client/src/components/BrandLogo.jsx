import { APP_NAME, APP_TAGLINE } from "../lib/brand";
import { useTheme } from "../context/ThemeContext";

export default function BrandLogo({ className = "h-9 w-auto sm:h-10", iconOnly = false, light, decorative = false }) {
  const { theme } = useTheme();
  const useLightMark = light ?? theme !== "light";
  const src = iconOnly ? "/logo.svg" : useLightMark ? "/logo-wordmark-light.svg" : "/logo-wordmark.svg";
  return (
    <img
      src={src}
      alt={decorative ? "" : `${APP_NAME} — ${APP_TAGLINE}`}
      aria-hidden={decorative || undefined}
      className={className}
    />
  );
}
