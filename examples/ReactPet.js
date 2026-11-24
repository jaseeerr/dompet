import { useEffect } from "react";
import { DOMPet } from "dompet";

export function ReactPet() {
  useEffect(() => {
    const pet = new DOMPet();
    pet.start();
    return () => pet.destroy();
  }, []);
  return null;
}
