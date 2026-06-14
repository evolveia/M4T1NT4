import React, { useState, useEffect, useRef } from "react";
import {
  Activity,
  ShieldAlert,
  Wifi,
  Cpu,
  Play,
  Pause,
  Square,
  RotateCcw,
  Trash2,
  Download,
  LogOut,
  CheckCircle,
  Clock,
  Database,
  Globe,
  RefreshCw,
  Layers,
  ShieldCheck,
  Terminal,
  BookOpen,
  Server,
  Zap,
  BarChart3,
  History,
  AlertTriangle,
  Flame,
  Bell,
  Search,
  MoreHorizontal,
  ChevronRight,
  User,
  Sliders,
  Settings,
  Shield,
  Key
} from "lucide-react";
import { AuthUser, TestRun, MetricPoint, UserProfile, AuditReport } from "./types";
import Login from "./components/Login";
import CustomChart from "./components/CustomChart";
import DocsPanel from "./components/DocsPanel";
import AuditPanel from "./components/AuditPanel";

export default function App() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("m4t1nt4_token"));
  const [user, setUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem("m4t1nt4_user");
    return saved ? JSON.parse(saved) : null;
  });

  const [activeTab, setActiveTab] = useState<"dashboard" | "history" | "docs" | "profile" | "audit">("dashboard");
  
  // Real-time states
  const [currentTest, setCurrentTest] = useState<TestRun | null>(null);
  const [historyList, setHistoryList] = useState<TestRun[]>([]);
  const [configuring, setConfiguring] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Configuration form fields (aligned with specific images/Python parameters)
  const [targetIp, setTargetIp] = useState("127.0.0.1");
  const [targetPort, setTargetPort] = useState(80);
  const [workers, setWorkers] = useState(100); // Threads/Workers capacity slider
  const [duration, setDuration] = useState(60); // Time Limit
  const [attackMode, setAttackMode] = useState<"http_flood" | "syn_flood" | "udp_flood">("http_flood");

  // Profile management states
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Audit Logs (Laudos de Auditoria) UI & Data CRUD States
  const [auditsList, setAuditsList] = useState<AuditReport[]>([]);
  const [loadingAudits, setLoadingAudits] = useState(false);
  const [auditMessage, setAuditMessage] = useState<string | null>(null);
  const [auditError, setAuditError] = useState<string | null>(null);
  const [isEditingAudit, setIsEditingAudit] = useState(false);
  const [activeAudit, setActiveAudit] = useState<AuditReport | null>(null);
  const [isCreatingAudit, setIsCreatingAudit] = useState(false);

  // Audit Form States
  const [auditTitle, setAuditTitle] = useState("");
  const [auditTargetIp, setAuditTargetIp] = useState("");
  const [auditTargetPort, setAuditTargetPort] = useState(80);
  const [auditDuration, setAuditDuration] = useState(60);
  const [auditWorkers, setAuditWorkers] = useState(100);
  const [auditAttackMode, setAuditAttackMode] = useState<"http_flood" | "syn_flood" | "udp_flood">("http_flood");
  const [auditStatus, setAuditStatus] = useState<"compliant" | "vulnerable" | "critical" | "under_review">("under_review");
  const [auditScore, setAuditScore] = useState(5.0);
  const [auditResponsible, setAuditResponsible] = useState("");
  const [auditSummary, setAuditSummary] = useState("");
  const [auditRecommendations, setAuditRecommendations] = useState("");
  const [auditVulnerabilities, setAuditVulnerabilities] = useState<string[]>([]);
  const [newVulnText, setNewVulnText] = useState("");

  // Dynamic presets state (Frontend CRUD)
  const [presetsList, setPresetsList] = useState<Array<{ name: string; targetIp: string; targetPort: number; workers: number; duration: number; attackMode: "http_flood" | "syn_flood" | "udp_flood"; desc: string; isCustom?: boolean }>>(() => {
    const saved = localStorage.getItem("m4t1nt4_presets_v2");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error loading presets from localStorage", e);
      }
    }
    return [
      { name: "HTTP Flood (Moderada)", targetIp: "127.0.0.1", targetPort: 80, workers: 100, duration: 60, attackMode: "http_flood", desc: "Varredura padrão HTTP GET requisições encadeadas" },
      { name: "TCP SYN Flood (Handshake Sync)", targetIp: "192.168.1.1", targetPort: 443, workers: 500, duration: 90, attackMode: "syn_flood", desc: "Ataque direcionado a falhas de timeout TCP Handshake" },
      { name: "UDP Flood (Datagram Spam)", targetIp: "10.0.12.15", targetPort: 53, workers: 1000, duration: 120, attackMode: "udp_flood", desc: "Inundação assíncrona de datagramas UDP de alta densidade" }
    ];
  });

  // Preset addition form values
  const [isAddingPreset, setIsAddingPreset] = useState(false);
  const [newPresetName, setNewPresetName] = useState("");
  const [newPresetIp, setNewPresetIp] = useState("127.0.0.1");
  const [newPresetPort, setNewPresetPort] = useState(80);
  const [newPresetWorkers, setNewPresetWorkers] = useState(100);
  const [newPresetDuration, setNewPresetDuration] = useState(60);
  const [newPresetAttackMode, setNewPresetAttackMode] = useState<"http_flood" | "syn_flood" | "udp_flood">("http_flood");
  const [newPresetDesc, setNewPresetDesc] = useState("");

  const handleAddPreset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPresetName || !newPresetIp) return;
    const item = {
      name: newPresetName,
      targetIp: newPresetIp,
      targetPort: Number(newPresetPort),
      workers: Number(newPresetWorkers),
      duration: Number(newPresetDuration),
      attackMode: newPresetAttackMode,
      desc: newPresetDesc || "Preset personalizado do usuário",
      isCustom: true
    };
    const updated = [...presetsList, item];
    setPresetsList(updated);
    localStorage.setItem("m4t1nt4_presets_v2", JSON.stringify(updated));
    
    // reset form
    setNewPresetName("");
    setNewPresetIp("127.0.0.1");
    setNewPresetPort(80);
    setNewPresetWorkers(100);
    setNewPresetDuration(60);
    setNewPresetAttackMode("http_flood");
    setNewPresetDesc("");
    setIsAddingPreset(false);
  };

  const handleDeletePreset = (indexToDelete: number, e: React.MouseEvent) => {
    e.stopPropagation(); // prevent applying the preset when clicking delete
    const updated = presetsList.filter((_, idx) => idx !== indexToDelete);
    setPresetsList(updated);
    localStorage.setItem("m4t1nt4_presets_v2", JSON.stringify(updated));
  };

  // Complete Audit CRUD Handlers
  const fetchAudits = async () => {
    try {
      setLoadingAudits(true);
      const res = await fetch("/api/audits");
      if (res.ok) {
        const data = await res.json();
        setAuditsList(data.audits || []);
      }
    } catch (e) {
      console.error("Erro ao carregar laudos", e);
    } finally {
      setLoadingAudits(false);
    }
  };

  const handleCreateAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuditError(null);
    setAuditMessage(null);
    try {
      const res = await fetch("/api/audits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: auditTitle,
          targetIp: auditTargetIp,
          targetPort: auditTargetPort,
          duration: auditDuration,
          workers: auditWorkers,
          attackMode: auditAttackMode,
          status: auditStatus,
          score: auditScore,
          responsible: auditResponsible,
          summary: auditSummary,
          recommendations: auditRecommendations,
          vulnerabilities: auditVulnerabilities
        })
      });
      if (res.ok) {
        setAuditMessage("Laudo de auditoria criado com sucesso!");
        fetchAudits();
        setIsCreatingAudit(false);
        resetAuditForm();
        setTimeout(() => setAuditMessage(null), 3500);
      } else {
        const err = await res.json();
        setAuditError(err.error || "Erro ao salvar laudo.");
      }
    } catch (err) {
      setAuditError("Falha de conexão com o servidor de laudos.");
    }
  };

  const handleUpdateAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAudit) return;
    setAuditError(null);
    setAuditMessage(null);
    try {
      const res = await fetch(`/api/audits/${activeAudit.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: auditTitle,
          targetIp: auditTargetIp,
          targetPort: auditTargetPort,
          duration: auditDuration,
          workers: auditWorkers,
          attackMode: auditAttackMode,
          status: auditStatus,
          score: auditScore,
          responsible: auditResponsible,
          summary: auditSummary,
          recommendations: auditRecommendations,
          vulnerabilities: auditVulnerabilities
        })
      });
      if (res.ok) {
        setAuditMessage("Laudo de auditoria atualizado com sucesso!");
        fetchAudits();
        setIsEditingAudit(false);
        setActiveAudit(null);
        resetAuditForm();
        setTimeout(() => setAuditMessage(null), 3500);
      } else {
        const err = await res.json();
        setAuditError(err.error || "Erro ao salvar laudo.");
      }
    } catch (err) {
      setAuditError("Falha de conexão com o servidor de laudos.");
    }
  };

  const handleDeleteAudit = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir permanentemente este laudo de auditoria?")) return;
    try {
      const res = await fetch(`/api/audits/${id}`, { method: "DELETE" });
      if (res.ok) {
        setAuditsList(prev => prev.filter(a => a.id !== id));
        setAuditMessage("Laudo excluído com sucesso.");
        setTimeout(() => setAuditMessage(null), 3000);
      }
    } catch (err) {
      console.error("Erro ao deletar laudo:", err);
    }
  };

  const startEditAudit = (audit: AuditReport) => {
    setActiveAudit(audit);
    setAuditTitle(audit.title);
    setAuditTargetIp(audit.targetIp);
    setAuditTargetPort(audit.targetPort);
    setAuditDuration(audit.duration);
    setAuditWorkers(audit.workers);
    setAuditAttackMode(audit.attackMode);
    setAuditStatus(audit.status);
    setAuditScore(audit.score);
    setAuditResponsible(audit.responsible);
    setAuditSummary(audit.summary);
    setAuditRecommendations(audit.recommendations);
    setAuditVulnerabilities(audit.vulnerabilities || []);
    setIsEditingAudit(true);
    setIsCreatingAudit(false);
  };

  const startCreateAudit = () => {
    resetAuditForm();
    setAuditResponsible(user?.name || "Administrador");
    setIsCreatingAudit(true);
    setIsEditingAudit(false);
  };

  const resetAuditForm = () => {
    setAuditTitle("");
    setAuditTargetIp("127.0.0.1");
    setAuditTargetPort(80);
    setAuditDuration(60);
    setAuditWorkers(100);
    setAuditAttackMode("http_flood");
    setAuditStatus("under_review");
    setAuditScore(5.0);
    setAuditResponsible(user?.name || "Administrador");
    setAuditSummary("");
    setAuditRecommendations("");
    setAuditVulnerabilities([]);
    setNewVulnText("");
  };

  // Ref to SSE connection
  const sseRef = useRef<EventSource | null>(null);

  // Load token callback
  const handleLoginSuccess = (newToken: string, authenticatedUser: AuthUser) => {
    setToken(newToken);
    setUser(authenticatedUser);
  };

  const handleLogout = () => {
    localStorage.removeItem("m4t1nt4_token");
    localStorage.removeItem("m4t1nt4_user");
    setToken(null);
    setUser(null);
  };

  // Fetch past histories
  const fetchHistory = async () => {
    try {
      const response = await fetch("/api/history");
      if (response.ok) {
        const data = await response.json();
        setHistoryList(data.history || []);
      }
    } catch (e) {
      console.error("Erro ao buscar histórico:", e);
    }
  };

  // Setup simulated initial state if currentTest is null
  const configureTestDefault = async () => {
    try {
      setConfiguring(true);
      const response = await fetch("/api/test/configure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetIp, targetPort, workers, duration, attackMode }),
      });
      if (response.ok) {
        const data = await response.json();
        setCurrentTest(data.currentTest);
      }
    } catch (err) {
      console.error("Failed default configuration setup", err);
    } finally {
      setConfiguring(false);
    }
  };

  // Control core: start/pause/resume/stop/reset
  const triggerControlAction = async (action: "start" | "pause" | "resume" | "stop" | "reset") => {
    try {
      setActionLoading(true);
      const response = await fetch("/api/test/control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setCurrentTest(data.currentTest);
        if (action === "stop" || action === "reset") {
          fetchHistory();
        }
      } else {
        const errData = await response.json();
        setFetchError(errData.error || "Erro ao acionar comando.");
      }
    } catch (err) {
      setFetchError("Erro crítico de conexão com o painel.");
    } finally {
      setActionLoading(false);
    }
  };

  // Fetch profile settings
  const fetchUserProfile = async () => {
    try {
      setLoadingProfile(true);
      const tempError = profileError; // track
      const response = await fetch("/api/profile");
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        // If there's no ongoing config, setup default values from profile
        if (!currentTest) {
          setDuration(data.defaultDuration);
          // Sync default workers/threads with concurrency capacity
          setWorkers(Math.min(100, data.concurrencyLimit));
        }
      }
    } catch (err) {
      console.error("Failed to load user profile:", err);
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleUpdateProfile = async (updatedFields: Partial<UserProfile>) => {
    try {
      setLoadingProfile(true);
      setProfileMessage(null);
      setProfileError(null);
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedFields),
      });
      if (response.ok) {
        const data = await response.json();
        setProfile(data.profile);
        
        // Sync local user session
        const updatedUser = {
          ...user!,
          name: data.profile.name,
          email: data.profile.email,
          role: data.profile.role,
          avatarBg: data.profile.avatarBg
        };
        setUser(updatedUser);
        localStorage.setItem("m4t1nt4_user", JSON.stringify(updatedUser));
        setProfileMessage("Configurações do perfil salvas no banco persistente!");
        setTimeout(() => setProfileMessage(null), 4000);
      } else {
        const errData = await response.json();
        setProfileError(errData.message || "Erro ao salvar Perfil.");
      }
    } catch (err) {
      setProfileError("Conexão falhou ao tentar persistir configurações.");
    } finally {
      setLoadingProfile(false);
    }
  };

  // Apply Quick Preset configuration
  const applyPreset = (p: typeof presetsList[0]) => {
    setTargetIp(p.targetIp);
    setTargetPort(p.targetPort);
    setWorkers(p.workers);
    setDuration(p.duration);
    setAttackMode(p.attackMode);
  };

  // Submit manual parameters configurator
  const submitConfiguration = async (e: React.FormEvent) => {
    e.preventDefault();
    setConfiguring(true);
    setFetchError(null);

    try {
      const response = await fetch("/api/test/configure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetIp, targetPort, workers, duration, attackMode }),
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentTest(data.currentTest);
      } else {
        const errData = await response.json();
        setFetchError(errData.error || "Operação falhou.");
      }
    } catch (err) {
      setFetchError("Erro ao despachar configuração.");
    } finally {
      setConfiguring(false);
    }
  };

  // Delete test run
  const deleteRun = async (id: string) => {
    try {
      const res = await fetch(`/api/history/${id}`, { method: "DELETE" });
      if (res.ok) {
        setHistoryList((prev) => prev.filter((r) => r.id !== id));
      }
    } catch (e) {
      console.error("Erro ao deletar registro:", e);
    }
  };

  // Start real-time stream subscription (SSE) when authenticated
  useEffect(() => {
    if (!token) return;

    // Fetch initial data payload
    fetch("/api/test/current")
      .then((res) => res.json())
      .then((data) => {
        if (data.currentTest) {
          setCurrentTest(data.currentTest);
          setTargetIp(data.currentTest.targetIp);
          setTargetPort(data.currentTest.targetPort);
          setWorkers(data.currentTest.workers);
          setDuration(data.currentTest.duration);
          setAttackMode(data.currentTest.attackMode);
        } else {
          // Setup a default initial configuration if empty
          configureTestDefault();
        }
      });

    fetchHistory();
    fetchUserProfile();
    fetchAudits(); // fetch persistent Audit reports on start

    // SSE connection for live metric streams
    sseRef.current = new EventSource("/api/metrics/live");
    
    sseRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.currentTest) {
          setCurrentTest(data.currentTest);
        }
      } catch (err) {
        console.error("Error parsing EventSource stream:", err);
      }
    };

    sseRef.current.onerror = () => {
      console.warn("Lost connection to metric feed, retrying...");
    };

    return () => {
      if (sseRef.current) {
        sseRef.current.close();
      }
    };
  }, [token]);

  // If user is not authenticated, render Login window
  if (!token || !user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // Derived current metrics helper indicators
  const metricsList = currentTest?.metrics || [];
  const latestMetric: MetricPoint = metricsList[metricsList.length - 1] || {
    timestamp: "",
    rps: 0,
    errorRate: 0,
    avgLatency: 0,
    p95Latency: 0,
    p99Latency: 0,
    cpuUsage: 2.1,
    ramUsage: 12.8,
  };

  const getAvatarClass = (colorName?: string) => {
    switch (colorName) {
      case "purple":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "emerald":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "rose":
        return "bg-rose-100 text-rose-700 border-rose-200";
      case "sky":
        return "bg-sky-100 text-sky-700 border-sky-200";
      case "amber":
        return "bg-amber-100 text-amber-700 border-amber-200";
      case "indigo":
      default:
        return "bg-indigo-100 text-indigo-700 border-indigo-200";
    }
  };

  const getAvatarBgClass = (colorName?: string) => {
    switch (colorName) {
      case "purple": return "bg-purple-600";
      case "emerald": return "bg-emerald-600";
      case "rose": return "bg-rose-600";
      case "sky": return "bg-sky-600";
      case "amber": return "bg-amber-600";
      case "indigo":
      default: return "bg-indigo-600";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "running":
        return "bg-emerald-50 text-emerald-600 border-emerald-200";
      case "paused":
        return "bg-yellow-50 text-yellow-600 border-yellow-200";
      case "stopped":
        return "bg-rose-50 text-rose-600 border-rose-200";
      case "completed":
        return "bg-purple-50 text-purple-600 border-purple-200";
      default:
        return "bg-slate-50 text-slate-500 border-slate-200";
    }
  };

  // Scroll viewport down to the configuration parameters block beautifully
  const scrollToConfigurator = () => {
    const el = document.getElementById("target-configurator-block");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Progress percentage of the active simulation run
  const testProgressPercent = currentTest && currentTest.status !== "idle"
    ? Math.min(100, Math.round((currentTest.elapsedSeconds / currentTest.duration) * 100))
    : 0;

  return (
    <div className="min-h-screen bg-[#f4f6fa] text-slate-800 flex font-sans antialiased selection:bg-purple-600 selection:text-white">
      
      {/* 1. LEFT SIDEBAR (Desktop view, hidden on mobile) */}
      <aside className="w-68 bg-white border-r border-slate-100 flex-shrink-0 flex-col hidden lg:flex sticky top-0 h-screen z-40">
        
        {/* Brand logo block */}
        <div className="p-6 pb-4 border-b border-slate-50/80 flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-100">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="font-display font-bold text-slate-900 tracking-tight text-lg uppercase">
                M4T1NT4
              </span>
              <span className="bg-purple-50 text-purple-600 text-[9px] px-1.5 py-0.5 rounded-full border border-purple-100 font-mono font-bold">
                PROD
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">
              Load & DoS Simulator
            </p>
          </div>
        </div>

        {/* Register patient button equivalent -> Launch / Trigger Carga button */}
        <div className="p-4">
          <button
            onClick={() => {
              setActiveTab("dashboard");
              setTimeout(scrollToConfigurator, 100);
            }}
            className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white font-medium text-xs rounded-xl shadow-md shadow-purple-200 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>Configurar Nova Carga</span>
          </button>
        </div>

        {/* Sidebar Menu Navigation items */}
        <nav className="flex-1 px-3 py-2 space-y-1 text-xs">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all cursor-pointer ${
              activeTab === "dashboard"
                ? "bg-purple-50 text-purple-600 shadow-sm"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            }`}
          >
            <Activity className="w-4 h-4" />
            <span className="text-left flex-1 font-semibold text-sm">Overview Monitor</span>
            <ChevronRight className={`w-3 h-3 text-slate-400 ${activeTab === "dashboard" ? "opacity-100" : "opacity-40"}`} />
          </button>

          <button
            onClick={() => {
              setActiveTab("audit");
              fetchAudits();
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all cursor-pointer ${
              activeTab === "audit"
                ? "bg-purple-50 text-purple-600 shadow-sm"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span className="text-left flex-1 font-semibold text-sm">Laudos Auditoria</span>
            <ChevronRight className={`w-3 h-3 text-slate-400 ${activeTab === "audit" ? "opacity-100" : "opacity-40"}`} />
          </button>

          <button
            onClick={() => {
              setActiveTab("history");
              fetchHistory();
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all cursor-pointer ${
              activeTab === "history"
                ? "bg-purple-50 text-purple-600 shadow-sm"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            }`}
          >
            <History className="w-4 h-4" />
            <span className="text-left flex-1 font-semibold text-sm">Histórico Relatórios</span>
            <ChevronRight className={`w-3 h-3 text-slate-400 ${activeTab === "history" ? "opacity-100" : "opacity-40"}`} />
          </button>

          <button
            onClick={() => setActiveTab("docs")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all cursor-pointer ${
              activeTab === "docs"
                ? "bg-purple-50 text-purple-600 shadow-sm"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span className="text-left flex-1 font-semibold text-sm">Arquitetura DevOps</span>
            <ChevronRight className={`w-3 h-3 text-slate-400 ${activeTab === "docs" ? "opacity-100" : "opacity-40"}`} />
          </button>

          <button
            onClick={() => setActiveTab("profile")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all cursor-pointer ${
              activeTab === "profile"
                ? "bg-purple-50 text-purple-600 shadow-sm"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            }`}
          >
            <User className="w-4 h-4" />
            <span className="text-left flex-1 font-semibold text-sm">Perfil do Usuário</span>
            <ChevronRight className={`w-3 h-3 text-slate-400 ${activeTab === "profile" ? "opacity-100" : "opacity-40"}`} />
          </button>
        </nav>

        {/* Custom H-Care styled call to action at bottom of sidebar */}
        <div className="p-4 mt-auto">
          <div className="bg-gradient-to-tr from-purple-50 to-indigo-50/60 border border-purple-100/60 rounded-2xl p-4 relative overflow-hidden shadow-sm">
            <div className="absolute -top-6 -right-6 w-16 h-16 bg-purple-200/40 rounded-full blur-md" />
            <div className="absolute -bottom-8 -left-8 w-16 h-16 bg-indigo-200/30 rounded-full blur-md" />
            
            <span className="inline-block bg-purple-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full mb-2 uppercase tracking-wide">
              PROMETHEUS SETUP
            </span>
            <h4 className="text-[11px] font-bold text-slate-800 mb-1 leading-tight">
              Acelere em Produção!
            </h4>
            <p className="text-[10px] text-slate-500 mb-3 leading-relaxed">
              Consulte nosso Docker Stack para rodar Locust nativamente em nuvem.
            </p>
            <button
              onClick={() => setActiveTab("docs")}
              className="text-[10px] font-bold text-purple-600 hover:text-purple-700 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Ver Códigos YAML</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </aside>

      {/* 2. MAIN VIEWPORT (Spans to end, accommodates footer padding on mobile) */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 lg:pb-0">
        
        {/* Header Top Bar (With Desktop Search + Profile Metadata) */}
        <header className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
          
          {/* Mock search system mimicking H-Care */}
          <div className="relative w-64 md:w-96 hidden sm:block">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4.5 w-4.5 text-slate-400" />
            </div>
            <input
              type="text"
              readOnly
              onClick={() => {
                setActiveTab("dashboard");
                setTimeout(scrollToConfigurator, 100);
              }}
              className="block w-full pl-10 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 placeholder-slate-400 focus:outline-none cursor-pointer"
              placeholder="Pesquisar alvos, presets ou endpoints..."
            />
          </div>

          {/* Fallback brand header for mobile view */}
          <div className="flex items-center gap-2 lg:hidden">
            <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold text-slate-900 tracking-tight text-sm">
              M4T1NT4
            </span>
          </div>

          {/* User profile widget & notifications */}
          <div className="flex items-center gap-3">
            
            {/* Notification bell widget */}
            <div className="relative p-1.5 bg-slate-50 hover:bg-slate-100 rounded-xl cursor-default text-slate-500">
              <Bell className="w-4.5 h-4.5" />
              <span className="absolute top-1 right-1 w-1.5 s-1.5 bg-purple-600 rounded-full" />
            </div>

            <div className="w-px h-6 bg-slate-100" />

            {/* Admin identity block */}
            <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setActiveTab("profile")}>
              <div className={`w-9 h-9 rounded-full border flex items-center justify-center font-bold text-xs uppercase shadow-sm ${getAvatarClass(user.avatarBg)}`}>
                {user.name.slice(0, 2)}
              </div>
              
              <div className="text-left hidden sm:block">
                <span className="block text-xs font-semibold text-slate-800 leading-none">
                  {user.name}
                </span>
                <span className="block text-[9px] font-mono text-slate-400 uppercase tracking-widest mt-0.5">
                  {user.role}
                </span>
              </div>
            </div>

            <div className="w-px h-6 bg-slate-100" />

            {/* Logout trigger button */}
            <button
              onClick={handleLogout}
              title="Encerrar sessão"
              className="p-1.5 bg-slate-50 hover:bg-rose-50 border border-slate-100 hover:border-rose-100 text-slate-400 hover:text-rose-600 rounded-xl transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>

          </div>
        </header>

        {/* Global Page Scroll Container */}
        <main className="p-6 space-y-6 flex-1">
          
          {/* A. 4 KPI CARDS GRID (Aesthetic mirroring of H-care) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Card 1: RPS (Patients count equivalent) */}
            <div className="bg-white border border-slate-100 px-5 py-4 rounded-3xl flex items-center justify-between shadow-sm relative group overflow-hidden">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center shadow-inner">
                  <Activity className="w-5.5 h-5.5" />
                </div>
                <div>
                  <h3 className="text-xl md:text-2xl font-bold text-slate-900 leading-tight">
                    {latestMetric.rps.toFixed(1)}
                  </h3>
                  <p className="text-[10px] md:text-xs text-slate-400 font-medium">Taxa RPS Atual</p>
                </div>
              </div>
              <div className="text-slate-300 hover:text-slate-500 hidden md:block">
                <MoreHorizontal className="w-4 h-4" />
              </div>
            </div>

            {/* Card 2: Lateny (Staff available equivalent) */}
            <div className="bg-white border border-slate-100 px-5 py-4 rounded-3xl flex items-center justify-between shadow-sm relative group overflow-hidden">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center shadow-inner">
                  <Clock className="w-5.5 h-5.5" />
                </div>
                <div>
                  <h3 className="text-xl md:text-2xl font-bold text-slate-900 leading-tight">
                    {latestMetric.avgLatency} <span className="text-xs font-normal text-slate-400">ms</span>
                  </h3>
                  <p className="text-[10px] md:text-xs text-slate-400 font-medium">RTT (Tempo Médio)</p>
                </div>
              </div>
              <div className="text-slate-300 hover:text-slate-500 hidden md:block">
                <MoreHorizontal className="w-4 h-4" />
              </div>
            </div>

            {/* Card 3: Target CPU (Costs equivalent) */}
            <div className="bg-white border border-slate-100 px-5 py-4 rounded-3xl flex items-center justify-between shadow-sm relative group overflow-hidden">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shadow-inner">
                  <Cpu className="w-5.5 h-5.5" />
                </div>
                <div>
                  <h3 className="text-xl md:text-2xl font-bold text-slate-900 leading-tight">
                    {latestMetric.cpuUsage.toFixed(1)} %
                  </h3>
                  <p className="text-[10px] md:text-xs text-slate-400 font-medium">Uso Recurso CPU</p>
                </div>
              </div>
              <div className="text-slate-300 hover:text-slate-500 hidden md:block">
                <MoreHorizontal className="w-4 h-4" />
              </div>
            </div>

            {/* Card 4: Incident/Error Rate (Cars available equivalent) */}
            <div className="bg-white border border-slate-100 px-5 py-4 rounded-3xl flex items-center justify-between shadow-sm relative group overflow-hidden">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner ${latestMetric.errorRate > 0 ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"}`}>
                  <ShieldAlert className="w-5.5 h-5.5" />
                </div>
                <div>
                  <h3 className="text-xl md:text-2xl font-bold text-slate-900 leading-tight">
                    {latestMetric.errorRate.toFixed(2)} %
                  </h3>
                  <p className="text-[10px] md:text-xs text-slate-400 font-medium">Taxa de Falhas</p>
                </div>
              </div>
              <div className="text-slate-300 hover:text-slate-500 hidden md:block">
                <MoreHorizontal className="w-4 h-4" />
              </div>
            </div>

          </div>

          {/* B. ACTIVE WORK tabs render layout */}
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              
              {/* B1. PRESET GRID & LIVE CHARTS (H-care mockup blocks) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Visualizer segment with Charts (H-care Center Section) */}
                <div className="lg:col-span-8 space-y-6">
                  
                  {/* Outpatients vs Inpatients Trend equivalent chart container */}
                  <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm relative space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-base font-bold text-slate-900">Histórico de Dispersão de RPS</h3>
                        <p className="text-[11px] text-slate-400">Medição sequencial por intervalo de telemetria</p>
                      </div>
                      <div className="text-xs bg-slate-50 border border-slate-200 text-slate-500 px-2.5 py-1 rounded-lg font-mono">
                        Filtro: Tempo Real (35s)
                      </div>
                    </div>
                    
                    <div className="p-2 border border-slate-50 bg-slate-50/20 rounded-2xl">
                      <CustomChart
                        data={metricsList}
                        dataKey="rps"
                        label="Volume de Tráfego"
                        color="#7c3ade"
                        fillColor="rgba(124,58,237,0.06)"
                        unit="req/s"
                      />
                    </div>
                  </div>

                  {/* Secondary auxiliary charts side-by-side row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Aux Latency Chart */}
                    <div className="bg-white border border-slate-100 p-5 rounded-3xl shadow-sm space-y-3">
                      <span className="inline-block text-[9px] font-bold text-slate-400 font-mono uppercase tracking-wider">
                        TELEMETRIA DE LATÊNCIA RTT
                      </span>
                      <CustomChart
                        data={metricsList}
                        dataKey="avgLatency"
                        label="Tempo de Resposta em MS"
                        color="#0284c7"
                        fillColor="rgba(2,132,199,0.04)"
                        unit="ms"
                      />
                    </div>

                    {/* Aux RAM Chart */}
                    <div className="bg-white border border-slate-100 p-5 rounded-3xl shadow-sm space-y-3">
                      <span className="inline-block text-[9px] font-bold text-slate-400 font-mono uppercase tracking-wider">
                        MEMÓRIA RAM DO ALVO
                      </span>
                      <CustomChart
                        data={metricsList}
                        dataKey="ramUsage"
                        label="Uso Estimado da Infraestrutura"
                        color="#f59e0b"
                        fillColor="rgba(245,158,11,0.04)"
                        unit="%"
                      />
                    </div>

                  </div>

                </div>

                {/* Right side widgets (Progress ring + solid container + recent division list) */}
                <div className="lg:col-span-4 space-y-6">
                  
                  {/* Patients by Gender Equivalent -> Circular Progress Ring */}
                  <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm relative text-center">
                    <h3 className="text-sm font-semibold text-slate-900 mb-4 text-left">Progresso do Teste de Carga</h3>
                    
                    <div className="relative w-36 h-36 mx-auto flex items-center justify-center mb-4">
                      {/* Circle tracks */}
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          className="text-slate-100"
                          strokeWidth="8"
                          stroke="currentColor"
                          fill="transparent"
                        />
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          className="text-purple-600 transition-all duration-300"
                          strokeWidth="8"
                          strokeDasharray={2 * Math.PI * 40}
                          strokeDashoffset={2 * Math.PI * 40 * (1 - testProgressPercent / 100)}
                          strokeLinecap="round"
                          stroke="currentColor"
                          fill="transparent"
                        />
                      </svg>
                      
                      <div className="absolute flex flex-col items-center">
                        <span className="text-2xl font-bold text-slate-900 font-mono">{testProgressPercent}%</span>
                        <span className="text-[9px] text-slate-400 uppercase font-mono tracking-wider">Concluído</span>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-500 font-mono border-t border-slate-50 pt-4 flex flex-col justify-center items-center">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${currentTest?.status === "running" ? "bg-emerald-400" : "bg-slate-300"}`} />
                        <span>Status: <strong className="text-slate-800 uppercase">{currentTest?.status || "Inativo"}</strong></span>
                      </div>
                      <p className="text-[10px] text-slate-400">
                        Tempo decorrido: {currentTest?.elapsedSeconds || 0}s / {currentTest?.duration || 0}s
                      </p>
                    </div>
                  </div>

                  {/* Solid Purple active session cards metadata */}
                  <div className="bg-gradient-to-br from-purple-700 to-indigo-800 text-white p-6 rounded-3xl shadow-lg relative overflow-hidden flex flex-col justify-between">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10" />
                    
                    <div>
                      <span className="text-[9px] font-mono font-medium uppercase tracking-widest text-purple-200 block mb-1">
                        Sessão de Carga Ativa
                      </span>
                      <h4 className="text-2xl font-bold font-mono">
                        {currentTest ? currentTest.workers : "0"} <span className="text-xs font-normal text-purple-100">threads</span>
                      </h4>
                      <p className="text-[11px] text-purple-100/80 mt-1 leading-relaxed">
                        Inundação de requisições simulada via modulador {currentTest?.attackMode?.replace("_", " ") || "http flood"} de alto volume.
                      </p>
                    </div>

                    <div className="border-t border-white/10 mt-6 pt-4 flex items-center justify-between text-[11px] font-mono text-purple-100">
                      <span>Host Alvo:</span>
                      <span className="font-bold underline truncate max-w-40" title={currentTest ? `${currentTest.targetIp}:${currentTest.targetPort}` : "---"}>
                        {currentTest ? `${currentTest.targetIp}:${currentTest.targetPort}` : "---"}
                      </span>
                    </div>
                  </div>

                  {/* Patients by Division Equivalent -> Recent Log Feed Table */}
                  <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm relative">
                    <h3 className="text-sm font-semibold text-slate-900 mb-3">Logs do Cluster (Por Divisão)</h3>
                    
                    <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                      {currentTest && currentTest.status !== "idle" && (
                        <div className="flex items-center justify-between text-xs p-2 bg-slate-50 rounded-xl border border-slate-100">
                          <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                            <span className="font-semibold text-slate-700 font-mono">LOCUST_MASTER</span>
                          </div>
                          <span className="text-[10px] text-slate-405 text-slate-500 font-medium">Spawn OK</span>
                        </div>
                      )}

                      {metricsList.slice(-3).map((pt, index) => (
                        <div key={index} className="flex flex-col gap-1 p-2 bg-slate-50/50 rounded-xl border border-slate-100 text-[11px] font-mono">
                          <div className="flex items-center justify-between text-slate-400 text-[9px]">
                            <span>[{new Date(pt.timestamp).toLocaleTimeString()}]</span>
                            <span className="text-purple-600 font-bold">STREAM_TABS</span>
                          </div>
                          <div className="flex justify-between text-slate-700">
                            <span>RPS: <strong className="text-slate-950">{pt.rps.toFixed(1)}</strong></span>
                            <span>Err: <strong className={pt.errorRate > 0 ? "text-cherry-600 text-red-600" : "text-emerald-600"}>{pt.errorRate}%</strong></span>
                          </div>
                        </div>
                      ))}

                      <div className="flex items-center justify-between text-xs p-2 bg-slate-50/30 rounded-xl border border-slate-100/50 text-slate-400">
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                          <span className="font-mono text-[10px]">PROMTQL_IO</span>
                        </div>
                        <span className="text-[9px] font-mono">Coleta Ativa</span>
                      </div>
                    </div>
                  </div>

                </div>

              </div>

              {/* B2. PRESETS AND MANUAL FORM (At bottom block dynamically) */}
              <div id="target-configurator-block" className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-2">
                
                {/* Presets Grid Panel with full CRUD functionality */}
                <div className="md:col-span-6 bg-white border border-slate-100 p-6 rounded-3xl shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                        <Layers className="w-4.5 h-4.5 text-purple-600" />
                        <span>Modelos de Tráfego (Presets)</span>
                      </h3>
                      <button
                        onClick={() => setIsAddingPreset(!isAddingPreset)}
                        className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-600 font-bold text-[10px] rounded-lg border border-purple-100 transition-all cursor-pointer"
                      >
                        {isAddingPreset ? "Ver Lista" : "+ Novo Preset"}
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-500 mb-4 font-mono">Gerencie e dispare cargas personalizadas</p>

                    {isAddingPreset ? (
                      <form onSubmit={handleAddPreset} className="space-y-3 bg-slate-50/55 p-4 rounded-2xl border border-slate-100 text-xs animate-fade-in">
                        <h4 className="font-bold text-slate-800 text-[11px] uppercase font-mono tracking-wider">Novo Preset de Carga</h4>
                        
                        <div>
                          <label className="block text-[9px] font-mono font-bold text-slate-400 uppercase mb-1">Nome do Preset</label>
                          <input
                            type="text"
                            required
                            placeholder="Ex: Teste da BlackFriday"
                            value={newPresetName}
                            onChange={(e) => setNewPresetName(e.target.value)}
                            className="block w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:border-purple-500"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[9px] font-mono font-bold text-slate-400 uppercase mb-1">IP do Alvo</label>
                            <input
                              type="text"
                              required
                              placeholder="127.0.0.1"
                              value={newPresetIp}
                              onChange={(e) => setNewPresetIp(e.target.value)}
                              className="block w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:border-purple-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-mono font-bold text-slate-400 uppercase mb-1">Porta Alvo</label>
                            <input
                              type="number"
                              required
                              min="1"
                              max="65535"
                              value={newPresetPort}
                              onChange={(e) => setNewPresetPort(Number(e.target.value))}
                              className="block w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:border-purple-500"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[9px] font-mono font-bold text-slate-400 uppercase mb-1">Threads / Workers</label>
                            <input
                              type="number"
                              required
                              min="1"
                              value={newPresetWorkers || ""}
                              onChange={(e) => setNewPresetWorkers(Number(e.target.value))}
                              className="block w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:border-purple-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-mono font-bold text-slate-400 uppercase mb-1">Modulação Loop</label>
                            <select
                              value={newPresetAttackMode}
                              onChange={(e) => setNewPresetAttackMode(e.target.value as any)}
                              className="block w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:border-purple-500"
                            >
                              <option value="http_flood">HTTP Flood</option>
                              <option value="syn_flood">SYN Flood</option>
                              <option value="udp_flood">UDP Flood</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[9px] font-mono font-bold text-slate-400 uppercase mb-1">Duração (S)</label>
                            <input
                              type="number"
                              required
                              min="10"
                              value={newPresetDuration || ""}
                              onChange={(e) => setNewPresetDuration(Number(e.target.value))}
                              className="block w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:border-purple-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-mono font-bold text-slate-400 uppercase mb-1">Descrição</label>
                            <input
                              type="text"
                              placeholder="Simula tráfego crítico..."
                              value={newPresetDesc}
                              onChange={(e) => setNewPresetDesc(e.target.value)}
                              className="block w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:border-purple-500"
                            />
                          </div>
                        </div>

                        <button
                          type="submit"
                          className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-all font-mono cursor-pointer"
                        >
                          Salvar Novo Modelo Presets
                        </button>
                      </form>
                    ) : (
                      <div className="space-y-2 max-h-84 overflow-y-auto pr-1">
                        {presetsList.map((preset, index) => {
                          let IconComp = Globe;
                          if (preset.attackMode === "syn_flood") {
                            IconComp = Flame;
                          } else if (preset.workers >= 500) {
                            IconComp = Zap;
                          }
                          
                          return (
                            <div
                              key={index}
                              onClick={() => {
                                applyPreset(preset);
                                scrollToConfigurator();
                              }}
                              className="w-full group text-left bg-slate-50/50 hover:bg-slate-50 border border-slate-100 hover:border-slate-300 p-3 rounded-xl transition-all flex items-start gap-3 cursor-pointer relative"
                            >
                              <div className="p-2 bg-white border border-slate-100 rounded-lg text-purple-600">
                                <IconComp className="w-4 h-4" />
                              </div>
                              <div className="flex-1 min-w-0 pr-6">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-slate-800 font-mono block truncate">{preset.name}</span>
                                  <span className="text-[9px] bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded-full border border-purple-100 font-bold font-mono uppercase">
                                    {preset.attackMode.replace("_", " ")}
                                  </span>
                                </div>
                                <p className="text-[10px] text-slate-400 mt-0.5 truncate">{preset.desc}</p>
                                <div className="text-[9px] text-slate-500 font-mono flex gap-2 mt-1">
                                  <span>Alvo: {preset.targetIp}:{preset.targetPort}</span>
                                  <span>•</span>
                                  <span>Workers: {preset.workers}</span>
                                </div>
                              </div>

                              {/* Delete preset item button */}
                              <button
                                onClick={(e) => handleDeletePreset(index, e)}
                                title="Excluir preset"
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50/65 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Form Input Configurators and Manual Command Deck */}
                <div className="md:col-span-6 bg-white border border-slate-100 p-6 rounded-3xl shadow-sm space-y-4">
                  <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                    <Terminal className="w-4.5 h-4.5 text-purple-600" />
                    <span>Configurador e Mesa de Controle Locust</span>
                  </h3>

                  <form onSubmit={submitConfiguration} className="space-y-3 text-xs">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-mono font-semibold text-slate-500 uppercase tracking-wider mb-1">
                          IP / Host de Destino
                        </label>
                        <input
                          type="text"
                          required
                          value={targetIp}
                          onChange={(e) => setTargetIp(e.target.value)}
                          className="block w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono focus:outline-none focus:border-purple-500 focus:bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono font-semibold text-slate-500 uppercase tracking-wider mb-1">
                          Porta de Conexão
                        </label>
                        <input
                          type="number"
                          required
                          min="1"
                          max="65535"
                          value={targetPort}
                          onChange={(e) => setTargetPort(Number(e.target.value))}
                          className="block w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono focus:outline-none focus:border-purple-500 focus:bg-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-mono font-semibold text-slate-500 uppercase tracking-wider mb-1">
                          Capacidade Threads / Workers
                        </label>
                        <input
                          type="number"
                          required
                          min="1"
                          max="10000"
                          value={workers}
                          onChange={(e) => setWorkers(Number(e.target.value))}
                          className="block w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono focus:outline-none focus:border-purple-500 focus:bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono font-semibold text-slate-500 uppercase tracking-wider mb-1">
                          Modulador de Loop (Ataque)
                        </label>
                        <select
                          value={attackMode}
                          onChange={(e) => setAttackMode(e.target.value as any)}
                          className="block w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono focus:outline-none focus:border-purple-500 focus:bg-white"
                        >
                          <option value="http_flood">HTTP flood (GET Request spam)</option>
                          <option value="syn_flood">SYN flood (TCP Half-Open)</option>
                          <option value="udp_flood">UDP flood (UDP Datagram Spam)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono font-semibold text-slate-500 uppercase tracking-wider mb-1">
                        Limite de Tempo (Segundos)
                      </label>
                      <input
                        type="number"
                        required
                        min="10"
                        max="1800"
                        value={duration}
                        onChange={(e) => setDuration(Number(e.target.value))}
                        className="block w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono focus:outline-none focus:border-purple-500 focus:bg-white"
                      />
                    </div>

                    {/* Action buttons triggers */}
                    <div className="pt-2 flex flex-col md:flex-row gap-2">
                      <button
                        type="submit"
                        disabled={configuring || (currentTest && currentTest.status === "running")}
                        className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-800 font-mono text-[11px] font-semibold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${configuring ? "animate-spin" : ""}`} />
                        <span>Aplicar Parâmetros</span>
                      </button>

                      {currentTest?.status === "paused" ? (
                        <button
                          type="button"
                          onClick={() => triggerControlAction("resume")}
                          disabled={actionLoading}
                          className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-[11px] font-semibold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <Play className="w-3.5 h-3.5 fill-white" />
                          <span>Retomar</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => triggerControlAction("start")}
                          disabled={actionLoading || currentTest?.status === "running"}
                          className="flex-1 py-2 px-3 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-100 disabled:text-slate-400 text-white font-mono text-[11px] font-bold rounded-xl shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <Play className="w-3.5 h-3.5 fill-white" />
                          <span>Disparar Carga</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => triggerControlAction("pause")}
                        disabled={actionLoading || currentTest?.status !== "running"}
                        className="py-2 px-3 bg-yellow-500 hover:bg-yellow-600 text-white font-mono text-[11px] font-semibold rounded-xl text-center disabled:opacity-35 cursor-pointer flex items-center justify-center"
                        title="Pausar Carga"
                      >
                        <Pause className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => triggerControlAction("stop")}
                        disabled={actionLoading || (currentTest?.status !== "running" && currentTest?.status !== "paused")}
                        className="py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white font-mono text-[11px] font-semibold rounded-xl text-center disabled:opacity-35 cursor-pointer flex items-center justify-center"
                        title="Parar e Salvar no Histórico"
                      >
                        <Square className="w-3.5 h-3.5 fill-white" />
                      </button>
                    </div>

                    {fetchError && (
                      <p className="text-[10px] text-red-600 font-mono mt-1 text-center bg-red-50 p-1 rounded">
                        {fetchError}
                      </p>
                    )}
                  </form>
                </div>

              </div>

            </div>
          )}

          {/* C. History Tab View */}
          {activeTab === "history" && (
            <div className="space-y-6 animate-fade-in text-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 leading-tight">
                    Histórico de Testes de Carga Realizados
                  </h2>
                  <p className="text-xs text-slate-400 font-mono">
                    Registros persistidos diretamente na infraestrutura de banco de dados PostgreSQL
                  </p>
                </div>

                <button
                  onClick={fetchHistory}
                  className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-xs font-mono text-slate-600 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Atualizar Banco</span>
                </button>
              </div>

              {historyList.length === 0 ? (
                <div className="border border-slate-200 border-dashed rounded-3xl p-12 text-center text-slate-400 font-mono text-xs bg-white shadow-sm">
                  Nenhum teste de carga foi finalizado ainda. Realize testes de simulação e pare-os para consolidar os relatórios no banco relacional.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {historyList.map((run) => (
                    <div key={run.id} className="border border-slate-100 bg-white p-5 rounded-3xl space-y-4 shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4">
                        <span className={`inline-block text-[9px] font-mono font-bold uppercase p-1 px-2.5 rounded-full border ${getStatusColor(run.status)}`}>
                          {run.status}
                        </span>
                      </div>

                      <div>
                        <div className="text-[9px] font-mono text-slate-400 uppercase">RUN ID: {run.id}</div>
                        <h4 className="text-sm font-semibold text-slate-800 break-all font-mono mt-0.5">
                          {run.targetUrl}
                        </h4>
                        <p className="text-[10px] text-slate-400 leading-none mt-1">
                          Disparado em: <strong className="font-mono">{new Date(run.createdAt).toLocaleString()}</strong>
                        </p>
                      </div>

                      <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-2xl text-center font-mono text-[10px]">
                        <div>
                          <span className="text-[9px] text-slate-400 block uppercase">Usuários</span>
                          <span className="text-slate-800 block font-bold mt-0.5">{run.users}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 block uppercase">Duração</span>
                          <span className="text-slate-800 block font-bold mt-0.5">{run.duration}s</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 block uppercase">Amostras</span>
                          <span className="text-slate-800 block font-bold mt-0.5">{run.metrics?.length || 0}s</span>
                        </div>
                      </div>

                      {/* Summary calculations */}
                      {run.metrics && run.metrics.length > 0 && (
                        <div className="text-[10px] font-mono space-y-1 text-slate-500 p-2.5 bg-slate-50/60 rounded-xl border border-slate-100">
                          <div className="flex justify-between">
                            <span>Média Volume RPS:</span>
                            <span className="text-slate-800 font-bold">
                              {(run.metrics.reduce((acc, c) => acc + c.rps, 0) / run.metrics.length).toFixed(1)} rps
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Média Latência RTT:</span>
                            <span className="text-slate-800 font-bold">
                              {Math.round(run.metrics.reduce((acc, c) => acc + c.avgLatency, 0) / run.metrics.length)} ms
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Pico Consumo CPU:</span>
                            <span className="text-amber-600 font-bold">
                              {Math.max(...run.metrics.map(m => m.cpuUsage)).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-2 pt-2">
                        <a
                          href={`/api/history/${run.id}/export`}
                          download
                          className="flex-1 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 font-mono text-[11px] rounded-lg transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5 text-purple-600" />
                          <span>Exportar CSV</span>
                        </a>

                        <button
                          onClick={() => deleteRun(run.id)}
                          className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg border border-rose-100 transition-colors cursor-pointer"
                          title="Excluir do Histórico"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* C2. Audit Logs Panel - Complete CRUD with file & PostgreSQL persistence */}
          {activeTab === "audit" && (
            <div className="animate-fade-in text-slate-700">
              <AuditPanel
                auditsList={auditsList}
                loadingAudits={loadingAudits}
                user={user}
                currentTest={currentTest}
                onDelete={handleDeleteAudit}
                onCreate={async (data) => {
                  const res = await fetch("/api/audits", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(data)
                  });
                  if (!res.ok) {
                    const err = await res.json();
                    throw new Error(err.error || "Operação falhou.");
                  }
                  fetchAudits();
                }}
                onUpdate={async (id, data) => {
                  const res = await fetch(`/api/audits/${id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(data)
                  });
                  if (!res.ok) {
                    const err = await res.json();
                    throw new Error(err.error || "Operação falhou.");
                  }
                  fetchAudits();
                }}
                fetchAudits={fetchAudits}
              />
            </div>
          )}

          {/* D. DevOps tab view */}
          {activeTab === "docs" && <DocsPanel />}

          {/* E. Profile Tab View - Full persistent configuration console */}
          {activeTab === "profile" && (
            <div className="space-y-6 animate-fade-in text-slate-700">
              
              {/* Profile Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 leading-tight">
                    Perfil e Preferências do Operador
                  </h2>
                  <p className="text-xs text-slate-400 font-mono">
                    Banco de configurações do simulador persistido em banco de dados
                  </p>
                </div>
                
                {/* Profile notification pill */}
                {profile && (
                  <div className="flex items-center gap-2 bg-purple-50 text-purple-600 px-3 py-1.5 rounded-xl border border-purple-100 text-xs font-mono font-bold self-start md:self-center">
                    <Shield className="w-4 h-4 text-purple-600" />
                    <span>Nível de Acesso: {profile.role}</span>
                  </div>
                )}
              </div>

              {loadingProfile && !profile ? (
                <div className="bg-white border border-slate-100 rounded-3xl p-12 text-center text-slate-400 font-mono text-xs shadow-sm">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4" />
                  Carregando configurações persistentes do perfil...
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  
                  {/* Left Column: Avatar Settings Badge Panel */}
                  <div className="lg:col-span-4 bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden p-6 text-center flex flex-col items-center">
                    
                    {/* Visual Avatar Preview */}
                    <div className={`w-24 h-24 rounded-full border-4 border-white shadow-md flex items-center justify-center text-white text-3xl font-bold uppercase transition-all mb-4 ${getAvatarBgClass(profile?.avatarBg || user.avatarBg)}`}>
                      {profile?.name ? profile.name.slice(0, 2) : user.name.slice(0, 2)}
                    </div>

                    <h3 className="font-semibold text-base text-slate-900">{profile?.name || user.name}</h3>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">{profile?.email || user.email}</p>
                    <span className="inline-block bg-slate-100 text-slate-600 font-mono font-bold text-[9px] px-2 py-0.5 rounded-full mt-3 uppercase tracking-wider">
                      Identidade DevOps • Ativo
                    </span>

                    <div className="w-full border-t border-slate-100 my-5" />

                    {/* Avatar Background Selection Palette */}
                    <div className="w-full text-left">
                      <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-2.5 text-center lg:text-left text-xs">
                        Paleta de Avatar Decorativa
                      </label>
                      <div className="grid grid-cols-5 gap-2.5 justify-center">
                        {[
                          { key: "indigo", bg: "bg-indigo-600" },
                          { key: "purple", bg: "bg-purple-600" },
                          { key: "emerald", bg: "bg-emerald-600" },
                          { key: "rose", bg: "bg-rose-600" },
                          { key: "sky", bg: "bg-sky-600" }
                        ].map((item) => (
                          <button
                            key={item.key}
                            onClick={() => handleUpdateProfile({ avatarBg: item.key })}
                            title={`Mudar para cor ${item.key}`}
                            className={`w-10 h-10 rounded-xl transition-all cursor-pointer flex items-center justify-center border-2 ${
                              (profile?.avatarBg || user.avatarBg) === item.key
                                ? "border-slate-800 scale-105 shadow-md shadow-slate-100"
                                : "border-transparent text-white/40 hover:scale-102"
                            } ${item.bg}`}
                          >
                            {(profile?.avatarBg || user.avatarBg) === item.key && (
                              <div className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="w-full border-t border-slate-100 my-5" />

                    {/* Quick limits warning summary description */}
                    <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100 w-full text-left text-[11px] text-slate-500 leading-relaxed font-mono">
                      <div className="flex items-center gap-2 mb-1.5 font-bold text-slate-705">
                        <Sliders className="w-3.5 h-3.5 text-purple-600" />
                        <span>Controles de Banda Ativos</span>
                      </div>
                      <span>Simulações de Carga DoS limitadas a </span>
                      <strong className="text-purple-600 font-bold">{profile?.concurrencyLimit || 1000} conexas/seg</strong>
                      <span> para preservar integridade de redes locais.</span>
                    </div>

                  </div>

                  {/* Right Column: Profile Form controls */}
                  <div className="lg:col-span-8 bg-white border border-slate-100 rounded-3xl shadow-sm p-6 space-y-6">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
                        <SettingsIcon className="w-4 h-4 text-purple-600" />
                        <span>Configurações Gerais de Operador</span>
                      </h3>
                      <p className="text-[11px] text-slate-400">Edite credenciais, limites locais e integração de logs.</p>
                    </div>

                    {profileMessage && (
                      <div className="p-3 bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs rounded-xl font-medium animate-fade-in flex items-center gap-2 shadow-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
                        <span>{profileMessage}</span>
                      </div>
                    )}

                    {profileError && (
                      <div className="p-3 bg-rose-50 text-rose-700 border border-rose-100 text-xs rounded-xl font-medium animate-fade-in">
                        {profileError}
                      </div>
                    )}

                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        handleUpdateProfile({
                          name: formData.get("name") as string,
                          email: formData.get("email") as string,
                          defaultSpawnRate: Number(formData.get("spawnRate")),
                          defaultDuration: Number(formData.get("duration")),
                          prometheusUrl: formData.get("prometheusUrl") as string,
                          notificationsEnabled: formData.get("notificationsEnabled") === "true"
                        });
                      }}
                      className="space-y-4 text-xs"
                    >
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                            Nome Completo
                          </label>
                          <input
                            type="text"
                            name="name"
                            required
                            defaultValue={profile?.name || user.name}
                            className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono focus:outline-none focus:border-purple-500 focus:bg-white transition-all shadow-inner"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                            Endereço de E-mail
                          </label>
                          <input
                            type="email"
                            name="email"
                            required
                            defaultValue={profile?.email || user.email}
                            className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono focus:outline-none focus:border-purple-500 focus:bg-white transition-all shadow-inner"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                            Spawn Rate Padrão (RPS)
                          </label>
                          <input
                            type="number"
                            name="spawnRate"
                            required
                            min="1"
                            defaultValue={profile?.defaultSpawnRate || 10}
                            className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono focus:outline-none focus:border-purple-500 focus:bg-white transition-all shadow-inner"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                            Duração Padrão (Segundos)
                          </label>
                          <input
                            type="number"
                            name="duration"
                            required
                            min="10"
                            defaultValue={profile?.defaultDuration || duration}
                            className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono focus:outline-none focus:border-purple-500 focus:bg-white transition-all shadow-inner"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                            Limite Limiar de Concurrencia (Segurança)
                          </label>
                          <input
                            type="text"
                            disabled
                            value={`${profile?.concurrencyLimit || 1000} RPS`}
                            className="block w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-400 font-mono focus:outline-none cursor-not-allowed"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                          API / Host de Integração de Métricas (Prometheus URL)
                        </label>
                        <input
                          type="url"
                          name="prometheusUrl"
                          placeholder="http://127.0.0.1:9090"
                          defaultValue={profile?.prometheusUrl || ""}
                          className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono focus:outline-none focus:border-purple-500 focus:bg-white transition-all shadow-inner"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-2">
                          Notificações e Alertas Visuais
                        </label>
                        <div className="flex items-center gap-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                          <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                            <input
                              type="radio"
                              name="notificationsEnabled"
                              value="true"
                              defaultChecked={profile?.notificationsEnabled === true}
                              className="accent-purple-600 w-4 h-4"
                            />
                            <span>Habilitar avisos sonoros e pop-ups</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                            <input
                              type="radio"
                              name="notificationsEnabled"
                              value="false"
                              defaultChecked={profile?.notificationsEnabled === false}
                              className="accent-purple-600 w-4 h-4"
                            />
                            <span>Desativar alertas (Silencioso)</span>
                          </label>
                        </div>
                      </div>

                      <div className="pt-3 flex gap-3">
                        <button
                          type="submit"
                          disabled={loadingProfile}
                          className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 text-white font-mono font-bold rounded-xl shadow-md shadow-purple-100 transition-all flex items-center gap-2 cursor-pointer"
                        >
                          {loadingProfile ? "Carregando..." : "Persistir Configurações no Banco"}
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => {
                            fetchUserProfile();
                            setProfileMessage("Configurações recarregadas com sucesso do banco.");
                          }}
                          className="px-4 py-3 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 font-mono font-semibold rounded-xl transition-all cursor-pointer"
                        >
                          Descartar Alterações
                        </button>
                      </div>

                    </form>
                  </div>

                </div>
              )}

            </div>
          )}

        </main>

        {/* Global corporate footer mirroring H-Care design layout */}
        <footer className="border-t border-slate-100 py-6 px-6 bg-white text-xs font-mono text-slate-400 mt-12 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-purple-500" />
            <span>Infraestrutura ativa: PostgreSQL persistente</span>
            <span className="text-slate-200">|</span>
            <Server className="w-4 h-4 text-sky-400" />
            <span>Cluster simulador: Locust + Prometheus v1.4</span>
          </div>
          
          <div>
            <span>M4T1NT4 © 2026 • Painel Executivo Integrado</span>
          </div>
        </footer>

      </div>

      {/* 3. MOBILE FIXED BOTTOM NAVIGATION BAR FOOTER (Aparelho de aplicativo) */}
      <div className="lg:hidden fixed bottom-1 left-2 right-2 z-50 bg-white/95 backdrop-blur-md border border-slate-100/85 rounded-2xl shadow-xl flex justify-around items-center py-2 px-3">
        
        {/* Tab 1 Indicator */}
        <button
          onClick={() => setActiveTab("dashboard")}
          className={`flex flex-col items-center gap-1 text-[10px] font-mono font-bold transition-all cursor-pointer ${
            activeTab === "dashboard" ? "text-purple-600 font-bold scale-105" : "text-slate-400 hover:text-slate-600"
          }`}
        >
          <Activity className={`w-5 h-5 ${activeTab === "dashboard" ? "text-purple-600" : "text-slate-400"}`} />
          <span>Monitor</span>
        </button>

        {/* Tab 1b Audit indicator */}
        <button
          onClick={() => {
            setActiveTab("audit");
            fetchAudits();
          }}
          className={`flex flex-col items-center gap-1 text-[10px] font-mono font-bold transition-all cursor-pointer ${
            activeTab === "audit" ? "text-purple-600 font-bold scale-105" : "text-slate-400 hover:text-slate-600"
          }`}
        >
          <ShieldCheck className={`w-5 h-5 ${activeTab === "audit" ? "text-purple-600" : "text-slate-400"}`} />
          <span>Laudos</span>
        </button>

        {/* Tab 2 Indicator */}
        <button
          onClick={() => {
            setActiveTab("history");
            fetchHistory();
          }}
          className={`flex flex-col items-center gap-1 text-[10px] font-mono font-bold transition-all cursor-pointer ${
            activeTab === "history" ? "text-purple-600 font-bold scale-105" : "text-slate-400 hover:text-slate-600"
          }`}
        >
          <History className={`w-5 h-5 ${activeTab === "history" ? "text-purple-600" : "text-slate-400"}`} />
          <span>Histórico</span>
        </button>

        {/* Tab 3 Indicator */}
        <button
          onClick={() => setActiveTab("docs")}
          className={`flex flex-col items-center gap-1 text-[10px] font-mono font-bold transition-all cursor-pointer ${
            activeTab === "docs" ? "text-purple-600 font-bold scale-105" : "text-slate-400 hover:text-slate-600"
          }`}
        >
          <BookOpen className={`w-5 h-5 ${activeTab === "docs" ? "text-purple-600" : "text-slate-400"}`} />
          <span>Doc</span>
        </button>

        {/* Tab 4 Indicator */}
        <button
          onClick={() => setActiveTab("profile")}
          className={`flex flex-col items-center gap-1 text-[10px] font-mono font-bold transition-all cursor-pointer ${
            activeTab === "profile" ? "text-purple-600 font-bold scale-105" : "text-slate-400 hover:text-slate-600"
          }`}
        >
          <User className={`w-5 h-5 ${activeTab === "profile" ? "text-purple-600" : "text-slate-400"}`} />
          <span>Perfil</span>
        </button>

      </div>

    </div>
  );
}

// Inline Mini-Icon to prevent importing issues / overhead
function SettingsIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={props.className}
      {...props}
    >
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
