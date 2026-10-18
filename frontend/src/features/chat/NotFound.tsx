import { Globe } from "lucide-react";
import { LogoMark, navigateToLanding } from "@/features/chat/Sidebar";

export function NotFound({
  message = "This page doesn't exist.",
}: {
  message?: string;
}): React.JSX.Element {
  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center gap-4 px-4">
      <LogoMark className="h-12 w-12 text-[22px]" />
      <div className="flex items-center gap-2 text-3xl font-semibold tracking-tight text-text">
        <span>404</span>
        <Globe size={22} className="text-text-3" />
      </div>
      <p className="text-[15px] text-text-2">{message}</p>
      <button
        onClick={navigateToLanding}
        className="rounded-pill bg-accent px-4 py-2 text-sm font-medium text-on-accent transition-colors hover:bg-accent-hover"
      >
        Back to Delve
      </button>
    </div>
  );
}
