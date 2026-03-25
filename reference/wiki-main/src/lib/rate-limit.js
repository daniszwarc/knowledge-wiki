const requests = new Map();

const MAX_REQUESTS = process.env.MAX_REQUESTS || 10; // por ventana
const WINDOW_MS = process.env.WINDOW_MS || 60 * 1000; // 1 minuto

export function rateLimit(req) {
  const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket?.remoteAddress || "unknown";

  const now = Date.now();
  const entry = requests.get(ip);

  if (!entry || now - entry.start > WINDOW_MS) {
    requests.set(ip, { start: now, count: 1 });
    return { ok: true };
  }

  entry.count++;

  if (entry.count > MAX_REQUESTS) {
    return { ok: false };
  }

  return { ok: true };
}

// Limpiar entradas viejas cada 5 minutos
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of requests) {
    if (now - entry.start > WINDOW_MS) requests.delete(ip);
  }
}, 5 * 60 * 1000);
