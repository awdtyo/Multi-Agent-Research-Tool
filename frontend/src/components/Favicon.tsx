import { useEffect, useState } from "react";
import { Globe } from "lucide-react";
import { cn, faviconCandidates, prettyDomain } from "@/lib/utils";

interface FaviconProps {
  url: string;
  className?: string;
}

/**
 * Favicon with a fallback chain (DuckDuckGo → Google → neutral globe mark).
 * Falls forward on each image load error; never renders a broken image.
 */
export function Favicon({ url, className }: FaviconProps): React.JSX.Element {
  const domain = prettyDomain(url).split("/")[0];
  const [candidates] = useState(() => faviconCandidates(domain ?? ""));
  const [index, setIndex] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setIndex(0);
    setFailed(false);
  }, [url]);

  const src = candidates[index];

  if (failed || !src) {
    return (
      <span
        aria-hidden
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded bg-surface-3 text-text-3",
          className,
        )}
      >
        <Globe size={12} strokeWidth={1.8} />
      </span>
    );
  }

  return (
    <img
      src={src}
      alt=""
      loading="lazy"
      onError={() => {
        if (index < candidates.length - 1) setIndex(index + 1);
        else setFailed(true);
      }}
      className={cn("h-5 w-5 shrink-0 rounded bg-surface-3 object-contain p-[1px]", className)}
    />
  );
}
