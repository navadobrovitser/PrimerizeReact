export const API_ORIGIN = (
  import.meta.env.PROD
    ? "http://primerizeserver.runasp.net"

    : "https://localhost:7227"
).replace(/\/+$/, "");
