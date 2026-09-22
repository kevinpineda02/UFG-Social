import { useState, useEffect } from "react";

export default function useCambioTema() {
  const [claro, setClaro] = useState(() => {
    const guardado = localStorage.getItem("tema");
    if (guardado) return guardado === "claro";
    return window.matchMedia("(prefers-color-scheme: light)").matches;
  });

  useEffect(() => {
    document.documentElement.classList.toggle("modo-claro", claro);
    localStorage.setItem("tema", claro ? "claro" : "oscuro");
  }, [claro]);

  return [claro, () => setClaro((c) => !c)];
}