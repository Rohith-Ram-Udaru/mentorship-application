import { useState } from "react";

export function useMentorflowStore(initial = {}) {
  const [state, setState] = useState(initial);
  const patch = (next) => setState((current) => ({ ...current, ...next }));
  return [state, patch];
}
