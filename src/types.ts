export interface MetricPoint {
  timestamp: string;
  rps: number;
  errorRate: number;
  avgLatency: number;
  p95Latency: number;
  p99Latency: number;
  cpuUsage: number;
  ramUsage: number;
}

export interface TestRun {
  id: string;
  targetIp: string;
  targetPort: number;
  workers: number; // capacity threads/workers
  duration: number; // seconds
  attackMode: "http_flood" | "syn_flood" | "udp_flood";
  status: "running" | "paused" | "stopped" | "completed" | "idle";
  createdAt: string;
  elapsedSeconds: number;
  metrics: MetricPoint[];
}

export interface AuditReport {
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
  score: number; // 0..10 risk
  vulnerabilities: string[];
  summary: string;
  recommendations: string;
}

export interface AuthUser {
  email: string;
  name: string;
  role: string;
  avatarBg?: string;
}

export interface UserProfile {
  email: string;
  name: string;
  role: string;
  avatarBg: string;
  concurrencyLimit: number;
  prometheusUrl: string;
  notificationsEnabled: boolean;
  soundEffectsEnabled: boolean;
  defaultDuration: number;
  defaultSpawnRate: number;
}

export interface AuthState {
  token: string | null;
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
}
