export default function BrandLogo({ className = "h-9 w-auto sm:h-10", iconOnly = false }) {
  const src = iconOnly ? "/logo.svg" : "/logo-wordmark.svg";
  const alt = "Rasoira — Ghar Ka Khana";

  return <img src={src} alt={alt} className={className} />;
}
