import { useCallback, useEffect, useRef, useState } from "react";

const NEAR_BOTTOM_PX = 96;

/**
 * Auto-scroll that follows streaming updates only while the user is at the
 * bottom, and stops as soon as they scroll up. Exposes a jump button state.
 */
export function useAutoScroll<T extends HTMLElement>(
  followKey: string | number,
): {
  ref: React.MutableRefObject<T | null>;
  pinned: boolean;
  scrollToBottom: (smooth?: boolean) => void;
  onScroll: () => void;
} {
  const ref = useRef<T | null>(null);
  const pinnedRef = useRef(true);
  const [pinned, setPinned] = useState(true);

  const scrollToBottom = useCallback((smooth = false): void => {
    const el = ref.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" });
    pinnedRef.current = true;
    setPinned(true);
  }, []);

  // follow streaming updates
  useEffect(() => {
    if (pinnedRef.current) scrollToBottom();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [followKey]);

  // scroll to bottom when content first mounts
  useEffect(() => {
    scrollToBottom();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onScroll = useCallback((): void => {
    const el = ref.current;
    if (!el) return;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const nearBottom = distFromBottom < NEAR_BOTTOM_PX;
    if (nearBottom !== pinnedRef.current) {
      pinnedRef.current = nearBottom;
      setPinned(nearBottom);
    }
  }, []);

  return { ref, pinned, scrollToBottom, onScroll };
}

export type UseAutoScrollResult = ReturnType<typeof useAutoScroll>;
