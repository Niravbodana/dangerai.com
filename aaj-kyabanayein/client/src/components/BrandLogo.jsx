export default function BrandLogo({ className = "h-9 w-auto sm:h-10", iconOnly = false, light = true, decorative = false }) {
  const src = iconOnly ? "/logo.svg" : light ? "/logo-wordmark-light.svg" : "/logo-wordmark.svg";
  return (
    <img
      src={src}
      alt={decorative ? "" : "Rasoira — Home Cooked Food"}
      aria-hidden={decorative || undefined}
      className={className}
    />
  );
}
