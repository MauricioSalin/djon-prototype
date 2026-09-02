"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const Toaster = dynamic(
  () => import("sonner").then((module) => module.Toaster),
  { ssr: false },
);

export function AppToaster() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const enable = () => setEnabled(true);
    window.addEventListener("pointerdown", enable, { once: true, passive: true });
    window.addEventListener("keydown", enable, { once: true });
    return () => {
      window.removeEventListener("pointerdown", enable);
      window.removeEventListener("keydown", enable);
    };
  }, []);

  if (!enabled) return null;

  return (
    <Toaster
      className="app-toaster"
      position="top-right"
      richColors
      closeButton
      duration={4500}
      visibleToasts={4}
      offset={{ top: 80, right: 24 }}
      mobileOffset={{ top: 76, right: 16, left: 16 }}
      toastOptions={{
        classNames: {
          toast:
            "!border-djon-text/15 !bg-djon-surface-2 !text-djon-text !shadow-2xl",
          title: "!font-extrabold",
          description: "!text-djon-text/70",
          closeButton:
            "!border-djon-text/15 !bg-djon-surface-3 !text-djon-text",
        },
      }}
    />
  );
}
