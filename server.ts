import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

const PORT = 3000;
const app = express();

app.use(express.json());

// Persistent request and error logging for diagnostic analysis
const isVercel = !!process.env.VERCEL;
const DEBUG_LOG_FILE = path.join(isVercel ? "/tmp" : path.join(process.cwd(), "data"), "debug.log");
function logDebug(message: string) {
  const timestamp = new Date().toISOString();
  const logLine = `[${timestamp}] ${message}\n`;
  try {
    fs.appendFileSync(DEBUG_LOG_FILE, logLine);
  } catch (err) {
    console.error("Failed to write to debug log file:", err);
  }
}

app.use((req, res, next) => {
  logDebug(`Incoming Request: ${req.method} ${req.url} | Body: ${JSON.stringify(req.body)} | Headers: ${JSON.stringify(req.headers)}`);
  
  // Intercept response to log the status code
  const originalSend = res.send;
  res.send = function(body) {
    logDebug(`Response for ${req.method} ${req.url}: Status ${res.statusCode} | Body Sample: ${typeof body === 'string' ? body.substring(0, 200) : 'binary-or-buffer'}`);
    return originalSend.apply(res, arguments as any);
  };
  
  next();
});

// Persistent data paths
const DATA_DIR = isVercel ? "/tmp" : path.join(process.cwd(), "data");
const HISTORY_FILE = path.join(DATA_DIR, "history.json");

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (err) {
    console.warn("Failed to create DATA_DIR, using temporary storage fallback:", err);
  }
}

// In-Memory Database / Active States
interface TestRun {
  id: string;
  targetIp: string;
  targetPort: number;
  workers: number; // Threads capacidad
  duration: number; // in seconds (limite tempo)
  attackMode: "http_flood" | "syn_flood" | "udp_flood";
  status: "running" | "paused" | "stopped" | "completed" | "idle";
  createdAt: string;
  elapsedSeconds: number;
  metrics: {
    timestamp: string;
    rps: number;
    errorRate: number;
    avgLatency: number;
    p95Latency: number;
    p99Latency: number;
    cpuUsage: number;
    ramUsage: number;
    bytesSent?: number;
    packetsSent?: number;
    packetsFailed?: number;
  }[];
}

interface AuditReport {
  id: string;
  title: string;
  targetIp: string;
  targetPort: number;
  duration: number;
  workers: number;
  attackMode: "http_flood" | "syn_flood" | "udp_flood";
  status: "compliant" | "vulnerable" | "critical" | "under_review";
  responsible: string;
  createdAt: string;
  score: number; // 0 to 10 risk rating
  vulnerabilities: string[];
  summary: string;
  recommendations: string;
}

const AUDITS_FILE = path.join(DATA_DIR, "audits.json");
let history: TestRun[] = [];

const DEFAULT_AUDITS: AuditReport[] = [
  {
    id: "audit_1",
    title: "Varredura de Resiliência DDoS - Gateway de Pagamentos API",
    targetIp: "10.0.12.45",
    targetPort: 443,
    duration: 120,
    workers: 850,
    attackMode: "syn_flood",
    status: "critical",
    responsible: "Evandro EIA Team",
    createdAt: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
    score: 8.8,
    vulnerabilities: [
      "Inundação TCP SYN esgotou fila de backlog de conexões (SYN backlog overflow).",
      "Ineficiência no timeout da tentativa de handshake TCP em nível de kernel do SO.",
      "Ausência de SYN cookies ativos no balanceador de carga frontal."
    ],
    summary: "Durante a execução do teste sintetizado de TCP SYN Flood (Handshake Sync) com carga escalar de até 850 workers simultâneos, o gateway de pagamentos apresentou paralisao completa das transações normais. A latência de rede saltou de 40ms para mais de 12.000ms de média (timeout).",
    recommendations: "Habilitar TCP SYN Cookies (net.ipv4.tcp_syncookies=1 nel kernel linux); reduzir timeouts de FIN/Wait-2 e SYN_Recv; e implementar regras de Rate Limit perimetrais no Edge Firewall (WAF) ou Cloudflare para mitigar handshakes incompletos."
  },
  {
    id: "audit_2",
    title: "Auditoria Periódica de Robustez - Web App Administrativo",
    targetIp: "192.168.10.150",
    targetPort: 80,
    duration: 60,
    workers: 150,
    attackMode: "http_flood",
    status: "compliant",
    responsible: "Ana DevOps Analyst",
    createdAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    score: 2.1,
    vulnerabilities: [
      "Jitter de latência marginal sob concorrência máxima de caminhos de login."
    ],
    summary: "O teste de inundação via HTTP Flood (GET / Requests) contínuo obteve performance aceitável. O servidor web nginx respondeu com taxa de erro de apenas 0.4% em pico, mantendo latência P95 abaixo de 110ms.",
    recommendations: "Configurar controle estrito de limitação de taxa por cliente no endpoint de login corporativo (/api/auth/login) e monitorar consumo de RAM."
  },
  {
    id: "audit_3",
    title: "Auditoria Preventiva de Estresse - Cluster DNS de Microserviços",
    targetIp: "172.16.89.20",
    targetPort: 53,
    duration: 90,
    workers: 500,
    attackMode: "udp_flood",
    status: "vulnerable",
    responsible: "Lucas SecOps Eng",
    createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    score: 5.5,
    vulnerabilities: [
      "Amplificação de consulta e consumo acelerado de banda de switch interno.",
      "Aumento exponencial de pacotes UDP perdidos (Packet loss de 14.3%)."
    ],
    summary: "A simulação de inundações via pacotes UDP (UDP Flood datagram spam) causou perda moderada-alta de pacotes na rede local, indicando que o DNS recursivo interno perdeu estabilidade nas resoluções locais durante o tráfego crítico.",
    recommendations: "Habilitar Rate Limiting no nível do servidor de nomes DNS (Response Rate Limiting - RRL); isolar tráfego DNS estrutural em VLAN dedicada e redimensionar banda do tronco do roteador core."
  }
];

let audits: AuditReport[] = [];

// Ensure default audits exist if not file
try {
  if (!fs.existsSync(AUDITS_FILE)) {
    fs.writeFileSync(AUDITS_FILE, JSON.stringify(DEFAULT_AUDITS, null, 2), "utf-8");
  }
} catch (error) {
  console.warn("Could not write default AUDITS_FILE, will fallback to memory values:", error);
}

// Load historical runs from file
if (fs.existsSync(HISTORY_FILE)) {
  try {
    const fileContent = fs.readFileSync(HISTORY_FILE, "utf-8");
    const rawHistory = JSON.parse(fileContent);
    // Migrate to new format if needed
    history = rawHistory.map((h: any) => {
      let migratedIp = h.targetIp || "127.0.0.1";
      let migratedPort = h.targetPort || 80;
      if (h.targetUrl && !h.targetIp) {
        try {
          const u = new URL(h.targetUrl);
          migratedIp = u.hostname;
          migratedPort = u.port ? Number(u.port) : (u.protocol === "https:" ? 443 : 80);
        } catch {
          migratedIp = h.targetUrl;
        }
      }
      return {
        id: h.id,
        targetIp: migratedIp,
        targetPort: migratedPort,
        workers: h.workers || h.users || 100,
        duration: h.duration || 60,
        attackMode: h.attackMode || (h.targetUrl?.toLowerCase().includes("dos") ? "syn_flood" : "http_flood"),
        status: h.status,
        createdAt: h.createdAt,
        elapsedSeconds: h.elapsedSeconds,
        metrics: h.metrics || []
      };
    });
  } catch (error) {
    console.error("Error reading history.json, starting fresh:", error);
    history = [];
  }
}

// Load Audit Reports
try {
  if (fs.existsSync(AUDITS_FILE)) {
    audits = JSON.parse(fs.readFileSync(AUDITS_FILE, "utf-8"));
  } else {
    audits = [...DEFAULT_AUDITS];
  }
} catch (e) {
  console.error("Error reading audits.json, falling back to default audits:", e);
  audits = [...DEFAULT_AUDITS];
}

function saveAudits() {
  try {
    fs.writeFileSync(AUDITS_FILE, JSON.stringify(audits, null, 2), "utf-8");
  } catch (error) {
    console.error("Error saving audits.json:", error);
  }
}

// Helper to save history
function saveHistory() {
  try {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2), "utf-8");
  } catch (error) {
    console.error("Error saving history.json:", error);
  }
}

// Global simulation state
let currentTest: TestRun | null = null;
let simulationInterval: NodeJS.Timeout | null = null;

// Generate realistic simulated metrics based on input configuration
function generateMetricsPoint(elapsed: number, config: { targetIp: string; targetPort: number; workers: number; duration: number; attackMode: string; status: string }) {
  const isPaused = config.status === "paused";
  
  if (isPaused) {
    return {
      timestamp: new Date().toISOString(),
      rps: 0,
      errorRate: 0,
      avgLatency: 0,
      p95Latency: 0,
      p99Latency: 0,
      cpuUsage: 1.5 + Math.random() * 0.5, // idle CPU
      ramUsage: 12.4 + Math.random() * 0.1, // idle RAM
    };
  }

  // Active load state calculated based on workers spawned quickly within first 5 seconds
  const activeWorkers = Math.min(config.workers, Math.floor(elapsed * (config.workers / 5)));
  
  // RPS grows relative to active workers and attack mode characteristics
  let rpsFactor = 12;
  if (config.attackMode === "syn_flood") {
    rpsFactor = 32;
  } else if (config.attackMode === "udp_flood") {
    rpsFactor = 48;
  }
  const rps = activeWorkers * rpsFactor + (Math.random() * 20 - 10);
  const safeRps = Math.max(0, parseFloat(rps.toFixed(1)));

  // Error rates spike if RPS exceeds a "server limit" (e.g. 500 RPS for http, 800 for syn, 1200 for udp)
  let limit = 600;
  if (config.attackMode === "syn_flood") limit = 800;
  if (config.attackMode === "udp_flood") limit = 1100;
  
  let errorRate = 0;
  if (safeRps > limit) {
    errorRate = (safeRps - limit) / 12 + Math.random() * 6;
  } else if (Math.random() < 0.02) {
    errorRate = Math.random() * 1.2; // ambient packet drops
  }
  const finalizedErrorRate = parseFloat(Math.min(100, Math.max(0, errorRate)).toFixed(2));

  // Latency spikes under high load
  const baseLatency = config.attackMode === "syn_flood" ? 180 : (config.attackMode === "udp_flood" ? 120 : 45);
  const loadMultiplier = Math.pow(activeWorkers / 100, 1.8) * 6;
  const jitter = Math.random() * 12;
  const avgLatency = Math.round(baseLatency + loadMultiplier + jitter);
  const p95Latency = Math.round(avgLatency * 1.3 + Math.random() * 25);
  const p99Latency = Math.round(avgLatency * 1.8 + Math.random() * 50);

  // CPU and RAM use of the Target Server (Prometheus Node Exporter Simulator)
  const targetCpu = Math.min(99.9, 5.0 + (activeWorkers / config.workers) * 82 + Math.random() * 3);
  const targetRam = Math.min(96.0, 22.0 + (activeWorkers / config.workers) * 44 + Math.random() * 1.0);

  return {
    timestamp: new Date().toISOString(),
    rps: safeRps,
    errorRate: finalizedErrorRate,
    avgLatency,
    p95Latency,
    p99Latency,
    cpuUsage: parseFloat(targetCpu.toFixed(1)),
    ramUsage: parseFloat(targetRam.toFixed(1)),
  };
}

// Start simulation ticker
function startSimulationTicker(runId: string) {
  if (simulationInterval) clearInterval(simulationInterval);
  
  simulationInterval = setInterval(() => {
    if (!currentTest || currentTest.id !== runId) {
      if (simulationInterval) clearInterval(simulationInterval);
      return;
    }

    if (currentTest.status === "running") {
      currentTest.elapsedSeconds += 1;
      
      const newPoint = generateMetricsPoint(currentTest.elapsedSeconds, {
        targetIp: currentTest.targetIp,
        targetPort: currentTest.targetPort,
        workers: currentTest.workers,
        duration: currentTest.duration,
        attackMode: currentTest.attackMode,
        status: currentTest.status,
      });

      currentTest.metrics.push(newPoint);

      // Check if test completed its requested duration
      if (currentTest.elapsedSeconds >= currentTest.duration) {
        currentTest.status = "completed";
        // Save to historical run list
        const runIdx = history.findIndex(r => r.id === runId);
        if (runIdx !== -1) {
          history[runIdx] = { ...currentTest };
        } else {
          history.push({ ...currentTest });
        }
        saveHistory();
        if (simulationInterval) clearInterval(simulationInterval);
      }
    } else if (currentTest.status === "paused") {
      // Metric point during pause (system idling)
      const newPoint = generateMetricsPoint(currentTest.elapsedSeconds, {
        targetIp: currentTest.targetIp,
        targetPort: currentTest.targetPort,
        workers: currentTest.workers,
        duration: currentTest.duration,
        attackMode: currentTest.attackMode,
        status: "paused",
      });
      currentTest.metrics.push(newPoint);
    }
  }, 1000);
}

// SSE Connection subscriptions
let clientSSEs: Set<any> = new Set();

// Send server-sent-event updates to all listeners
function broadcastStateUpdate() {
  const dataString = JSON.stringify({ currentTest });
  clientSSEs.forEach((res) => {
    res.write(`data: ${dataString}\n\n`);
  });
}

// Periodically broadcast state to keeping SSE connections alive & updating
setInterval(() => {
  broadcastStateUpdate();
}, 1000);

// --- REST API Endpoints ---

const PROFILE_FILE = path.join(DATA_DIR, "profile.json");

const DEFAULT_PROFILE = {
  email: "evolve.eia@gmail.com",
  name: "Evandro EIA Team",
  role: "M4t1nt4 Administrator",
  avatarBg: "indigo", // indigo, purple, emerald, sky, amber, rose
  concurrencyLimit: 2500,
  prometheusUrl: "http://prometheus:9090",
  notificationsEnabled: true,
  soundEffectsEnabled: false,
  defaultDuration: 120,
  defaultSpawnRate: 15
};

let userProfile = { ...DEFAULT_PROFILE };

// Load profile from file
if (fs.existsSync(PROFILE_FILE)) {
  try {
    const loaded = JSON.parse(fs.readFileSync(PROFILE_FILE, "utf-8"));
    userProfile = { ...DEFAULT_PROFILE, ...loaded };
  } catch (error) {
    console.error("Error reading profile.json, using defaults:", error);
  }
} else {
  try {
    fs.writeFileSync(PROFILE_FILE, JSON.stringify(userProfile, null, 2), "utf-8");
  } catch (error) {
    console.error("Error writing default profile.json:", error);
  }
}

// Authentication
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body || {};
  if (email === userProfile.email && password === "S@nb4f6e") {
    res.json({
      success: true,
      token: "m4t1nt4-simulated-jwt-token-xyz-1029",
      user: {
        email: userProfile.email,
        name: userProfile.name,
        role: userProfile.role,
        avatarBg: userProfile.avatarBg
      }
    });
  } else {
    res.status(401).json({ success: false, message: "E-mail ou senha incorretos." });
  }
});

// GET PROFILE
app.get("/api/profile", (req, res) => {
  res.json(userProfile);
});

// UPDATE PROFILE (PUT)
app.put("/api/profile", (req, res) => {
  const {
    name,
    email,
    role,
    avatarBg,
    concurrencyLimit,
    prometheusUrl,
    notificationsEnabled,
    soundEffectsEnabled,
    defaultDuration,
    defaultSpawnRate
  } = req.body || {};

  if (name !== undefined) userProfile.name = name;
  if (email !== undefined) userProfile.email = email;
  if (role !== undefined) userProfile.role = role;
  if (avatarBg !== undefined) userProfile.avatarBg = avatarBg;
  if (concurrencyLimit !== undefined) userProfile.concurrencyLimit = Number(concurrencyLimit);
  if (prometheusUrl !== undefined) userProfile.prometheusUrl = prometheusUrl;
  if (notificationsEnabled !== undefined) userProfile.notificationsEnabled = !!notificationsEnabled;
  if (soundEffectsEnabled !== undefined) userProfile.soundEffectsEnabled = !!soundEffectsEnabled;
  if (defaultDuration !== undefined) userProfile.defaultDuration = Number(defaultDuration);
  if (defaultSpawnRate !== undefined) userProfile.defaultSpawnRate = Number(defaultSpawnRate);

  try {
    fs.writeFileSync(PROFILE_FILE, JSON.stringify(userProfile, null, 2), "utf-8");
  } catch (error) {
    console.error("Error saving updated profile.json:", error);
  }

  res.json({ message: "Perfil atualizado com sucesso.", profile: userProfile });
});

// Load Testing State API
app.get("/api/test/current", (req, res) => {
  res.json({ currentTest });
});

app.post("/api/test/configure", (req, res) => {
  const { targetIp, targetPort, workers, duration, attackMode } = req.body || {};
  
  if (!targetIp || !targetPort || !workers || !duration || !attackMode) {
    return res.status(400).json({ error: "Parâmetros configuratórios incompletos." });
  }

  // If there's an ongoing test, stop it first
  if (currentTest && currentTest.status === "running") {
    currentTest.status = "stopped";
    history.push({ ...currentTest });
    saveHistory();
  }

  currentTest = {
    id: "run_" + Date.now(),
    targetIp,
    targetPort: Number(targetPort),
    workers: Number(workers),
    duration: Number(duration),
    attackMode,
    status: "idle",
    createdAt: new Date().toISOString(),
    elapsedSeconds: 0,
    metrics: []
  };

  res.json({ message: "Plataforma configurada com sucesso.", currentTest });
});

app.post("/api/test/control", (req, res) => {
  const { action } = req.body || {}; // "start" | "pause" | "resume" | "reset" | "stop"

  if (!currentTest) {
    return res.status(400).json({ error: "Nenhum teste configurado ativo." });
  }

  switch (action) {
    case "start":
      currentTest.status = "running";
      currentTest.elapsedSeconds = 0;
      currentTest.metrics = [generateMetricsPoint(0, {
        targetIp: currentTest.targetIp,
        targetPort: currentTest.targetPort,
        workers: currentTest.workers,
        duration: currentTest.duration,
        attackMode: currentTest.attackMode,
        status: currentTest.status,
      })];
      startSimulationTicker(currentTest.id);
      break;

    case "pause":
      currentTest.status = "paused";
      break;

    case "resume":
      currentTest.status = "running";
      break;

    case "stop":
      currentTest.status = "stopped";
      history.push({ ...currentTest });
      saveHistory();
      if (simulationInterval) {
        clearInterval(simulationInterval);
        simulationInterval = null;
      }
      break;

    case "reset":
      if (simulationInterval) {
        clearInterval(simulationInterval);
        simulationInterval = null;
      }
      currentTest = {
        ...currentTest,
        status: "idle",
        elapsedSeconds: 0,
        metrics: []
      };
      break;

    default:
      return res.status(400).json({ error: "Ação de controle desconhecida." });
  }

  broadcastStateUpdate();
  res.json({ message: `Ação '${action}' executada.`, currentTest });
});

// Load Testing History
app.get("/api/history", (req, res) => {
  res.json({ history });
});

// Audit Reports (Laudos de Auditoria) - Complete persistent CRUD
app.get("/api/audits", (req, res) => {
  res.json({ audits });
});

app.post("/api/audits", (req, res) => {
  const { title, targetIp, targetPort, duration, workers, attackMode, status, score, responsible, summary, recommendations, vulnerabilities } = req.body || {};
  const newAudit: AuditReport = {
    id: "audit_" + Date.now(),
    title: title || "Laudo de Auditoria de Segurança",
    targetIp: targetIp || "127.0.0.1",
    targetPort: Number(targetPort) || 80,
    duration: Number(duration) || 60,
    workers: Number(workers) || 100,
    attackMode: attackMode || "http_flood",
    status: status || "under_review",
    score: score !== undefined ? parseFloat(score) : 5.0,
    responsible: responsible || "Operador",
    createdAt: new Date().toISOString(),
    summary: summary || "",
    recommendations: recommendations || "",
    vulnerabilities: Array.isArray(vulnerabilities) ? vulnerabilities : []
  };
  audits.unshift(newAudit);
  saveAudits();
  res.status(201).json({ success: true, message: "Laudo de auditoria criado com sucesso.", audit: newAudit });
});

app.put("/api/audits/:id", (req, res) => {
  const { id } = req.params;
  const idx = audits.findIndex(a => a.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: "Laudo não encontrado." });
  }
  const body = req.body || {};
  const updated = { ...audits[idx], ...body };
  if (body.targetPort !== undefined) updated.targetPort = Number(body.targetPort);
  if (body.duration !== undefined) updated.duration = Number(body.duration);
  if (body.workers !== undefined) updated.workers = Number(body.workers);
  if (body.score !== undefined) updated.score = parseFloat(body.score);
  
  audits[idx] = updated;
  saveAudits();
  res.json({ success: true, message: "Laudo de auditoria atualizado com sucesso.", audit: updated });
});

app.delete("/api/audits/:id", (req, res) => {
  const { id } = req.params;
  audits = audits.filter(a => a.id !== id);
  saveAudits();
  res.json({ success: true, message: "Laudo de auditoria excluído com sucesso." });
});

app.delete("/api/history/:id", (req, res) => {
  const { id } = req.params;
  history = history.filter(r => r.id !== id);
  saveHistory();
  res.json({ message: "Registro histórico excluído.", success: true });
});

// Export Metrics to CSV format
app.get("/api/history/:id/export", (req, res) => {
  const { id } = req.params;
  const run = history.find(r => r.id === id) || (currentTest && currentTest.id === id ? currentTest : null);
  
  if (!run) {
    return res.status(404).send("Registro de teste não encontrado.");
  }

  let csvContent = "Timestamp,RPS,ErrorRate,AvgLatency,P95Latency,P99Latency,CPU_Usage,RAM_Usage\n";
  run.metrics.forEach(pt => {
    csvContent += `"${pt.timestamp}",${pt.rps},${pt.errorRate},${pt.avgLatency},${pt.p95Latency},${pt.p99Latency},${pt.cpuUsage},${pt.ramUsage}\n`;
  });

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="m4t1nt4_metrics_${id}.csv"`);
  res.status(200).send(csvContent);
});

// Real-time Event Stream (SSE)
app.get("/api/metrics/live", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  clientSSEs.add(res);

  // Send initial load
  res.write(`data: ${JSON.stringify({ currentTest })}\n\n`);

  req.on("close", () => {
    clientSSEs.delete(res);
  });
});

// Global error handling middleware to diagnostic server errors
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("[SERVER EXCEPTION ERROR]:", err);
  res.status(500).json({
    success: false,
    message: "Erro interno no servidor de simulação.",
    error: err.message || err.toString(),
    stack: err.stack
  });
});

// --- Bootstrapping frontend bundle serving ---
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Vite middleware for lightning-fast development reloads
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve production compilation target
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[M4t1nt4 Server] Executando em http://localhost:${PORT}`);
  });
}

const isVercelServerless = !!process.env.VERCEL;
if (!isVercelServerless) {
  startServer();
}

export default app;
