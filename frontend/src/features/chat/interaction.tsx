import { createContext, useContext } from "react";
import type { Source } from "@/types/chat";

export interface SourceInteraction {
  sources: Source[];
  hoveredSource: number | null;
  setHoveredSource: (index: number | null) => void;
}

export const SourceInteractionContext = createContext<SourceInteraction>({
  sources: [],
  hoveredSource: null,
  setHoveredSource: () => undefined,
});

export function useSourceInteraction(): SourceInteraction {
  return useContext(SourceInteractionContext);
}
