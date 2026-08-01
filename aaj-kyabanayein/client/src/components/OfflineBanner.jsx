import { useOnline } from "../hooks/useOnline";

export default function OfflineBanner() {
  const online = useOnline();
  if (online) return null;

  return (
    <div
      role="status"
      className="fixed left-0 right-0 top-0 z-[100] bg-amber-600 px-4 py-2 text-center text-sm font-medium text-white safe-top"
    >
      You&apos;re offline — some features may be limited
    </div>
  );
}
