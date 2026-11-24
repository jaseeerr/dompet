import { DOMPet } from "dompet";

// Call after the host has mounted. Call the returned function on unmount.
export function mountPet(options = {}) {
  const pet = new DOMPet(options);
  pet.start();
  return () => pet.destroy();
}
