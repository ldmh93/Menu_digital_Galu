"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp } from "lucide-react";

import { EASE_SUAVE } from "@/lib/motion";

/**
 * Boton de volver arriba.
 *
 * La carta completa mide varias pantallas de alto en un celular: sin esto, un
 * cliente que llego hasta Blizz tiene que arrastrar diez veces para volver a la
 * barra de menus. Aparece solo cuando ya hay algo de recorrido detras.
 */
export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const alDesplazar = () => setVisible(window.scrollY > 900);

    alDesplazar();
    window.addEventListener("scroll", alDesplazar, { passive: true });
    return () => window.removeEventListener("scroll", alDesplazar);
  }, []);

  return (
    <AnimatePresence>
      {visible ? (
        <motion.button
          type="button"
          initial={{ opacity: 0, scale: 0.8, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 12 }}
          transition={{ duration: 0.35, ease: EASE_SUAVE }}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Volver arriba"
          className="fixed right-4 bottom-4 z-40 flex size-12 items-center justify-center rounded-full bg-morado text-white sm:right-6 sm:bottom-6 sm:size-14"
          style={{
            boxShadow: "var(--shadow-flotante)",
            // Respeta la barra de gestos de los celulares sin botones.
            marginBottom: "env(safe-area-inset-bottom)",
          }}
        >
          <ArrowUp size={22} strokeWidth={2.4} />
        </motion.button>
      ) : null}
    </AnimatePresence>
  );
}
