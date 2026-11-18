export const API_ORIGIN = (
  import.meta.env.PROD
    ? "https://primerizeserver.runasp.net"
    : "https://localhost:7227"
).replace(/\/+$/, "");
