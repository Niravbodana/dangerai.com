export default function BrandLogo({ className = "h-9 w-auto sm:h-10", iconOnly = false, light = true }) {
  const src = iconOnly ? "/logo.svg" : light ? "/logo-wordmark-light.svg" : "/logo-wordmark.svg";
  return <img src={src} alt="Rasoira — Home Cooked Food" className={className} />;
}
