import { createElement, StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ReactPet } from "../../examples/ReactPet.js";
export { mountPet } from "../../examples/vanilla.js";

export function mountStrict(root) {
  const tree = createRoot(root);
  tree.render(createElement(StrictMode, null, createElement(ReactPet)));
  return () => tree.unmount();
}
