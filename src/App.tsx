import React, { useState, useEffect, useRef } from "react";
import {
  Activity,
  ShieldAlert,
  Clock,
  Cpu,
  LogOut,
  Bell,
  Search,
  MoreHorizontal,
  ChevronRight,
  ShieldCheck,
  History,
  BookOpen,
  User,
  Play
} from "lucide-react";
import { AuthUser, TestRun, MetricPoint, UserProfile, AuditReport } from "./types";
import DocsPanel from "./components/DocsPanel";
import AuditPanel from "./components/AuditPanel";
import DashboardPanel from "./components/DashboardPanel";
import HistoryPanel from "./components/HistoryPanel";
import ProfilePanel from "./components/ProfilePanel";

export default function App() {
  const [token, setToken] = useState<string>(() => {
    const saved = localStorage.getItem("m4t1nt4_token");
    return saved || "m4t1nt4-simulated-jwt-token-xyz-1029";
  });
  const [user, setUser] = useState<AuthUser>(() => {
    const saved = localStorage.getItem("m4t1nt4_user");
    return saved ? JSON.parse(saved) : {
      email: "evolve.eia@gmail.com",
      name: "Evandro EIA Team",
      role: "M4t1nt4 Administrator",
      avatarBg: "indigo"
    };
  });

  const [activeTab, setActiveTab] = useState<"dashboard" | "history" | "docs" | "profile" | "audit">("dashboard");

  // Real-time states
  const [currentTest, setCurrentTest] = useState<TestRun | null>(null);
  const [historyList, setHistoryList] = useState<TestRun[]>([]);
  const [configuring, setConfiguring] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Configuration form fields
  const [targetIp, setTargetIp] = useState("127.0.0.1");
  const [targetPort, setTargetPort] = useState(80);
  const [workers, setWorkers] = useState(100);
  const [duration, setDuration] = useState(60);
  const [attackMode, setAttackMode] = useState<"http_flood" | "syn_flood" | "udp_flood">("http_flood");

  // Profile management states
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Audit Logs CRUD States
  const [auditsList, setAuditsList] = useState<AuditReport[]>([]);
  const [loadingAudits, setLoadingAudits] = useState(false);

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
    e.stopPropagation();
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

  const handleDeleteAudit = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir permanentemente este laudo de auditoria?")) return;
    try {
      const res = await fetch(`/api/audits/${id}`, { method: "DELETE" });
      if (res.ok) {
        setAuditsList(prev => prev.filter(a => a.id !== id));
      }
    } catch (err) {
      console.error("Erro ao deletar laudo:", err);
    }
  };

  // Ref to SSE connection
  const sseRef = useRef<EventSource | null>(null);

  const handleLogout = () => {
    localStorage.removeItem("m4t1nt4_token");
    localStorage.removeItem("m4t1nt4_user");
    setToken("m4t1nt4-simulated-jwt-token-xyz-1029");
    setUser({
      email: "evolve.eia@gmail.com",
      name: "Evandro EIA Team",
      role: "M4t1nt4 Administrator",
      avatarBg: "indigo"
    });
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
      const response = await fetch("/api/profile");
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        if (!currentTest) {
          setDuration(data.defaultDuration);
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
          configureTestDefault();
        }
      });

    fetchHistory();
    fetchUserProfile();
    fetchAudits();

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

  // Authentication bypass: platform is directly accessible by default

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

  const scrollToConfigurator = () => {
    const el = document.getElementById("target-configurator-block");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const testProgressPercent = currentTest && currentTest.status !== "idle"
    ? Math.min(100, Math.round((currentTest.elapsedSeconds / currentTest.duration) * 100))
    : 0;

  return (
    <div className="min-h-screen bg-[#f4f6fa] text-slate-800 flex font-sans antialiased selection:bg-purple-600 selection:text-white">
      
      {/* 1. LEFT SIDEBAR */}
      <aside className="w-68 bg-white border-r border-slate-100 flex-shrink-0 flex-col hidden lg:flex sticky top-0 h-screen z-40">
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

        <div className="p-4">
          <button
            type="button"
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

        <nav className="flex-1 px-3 py-2 space-y-1 text-xs">
          <button
            type="button"
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
            type="button"
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
            type="button"
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
            type="button"
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
            type="button"
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
              type="button"
              onClick={() => setActiveTab("docs")}
              className="text-[10px] font-bold text-purple-600 hover:text-purple-700 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Ver Códigos YAML</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </aside>

      {/* 2. MAIN VIEWPORT */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 lg:pb-0">
        
        {/* Header Top Bar */}
        <header className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
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

          <div className="flex items-center gap-2 lg:hidden">
            <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold text-slate-900 tracking-tight text-sm">
              M4T1NT4
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative p-1.5 bg-slate-50 hover:bg-slate-100 rounded-xl cursor-default text-slate-500">
              <Bell className="w-4.5 h-4.5" />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-purple-600 rounded-full animate-pulse" />
            </div>

            <div className="w-px h-6 bg-slate-100" />

            <div className="flex items-center gap-2.5 cursor-pointer animate-fade-in" onClick={() => setActiveTab("profile")}>
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

            <button
              type="button"
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
          
          {/* A. 4 KPI CARDS GRID */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Card 1: RPS */}
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

            {/* Card 2: Latency */}
            <div className="bg-white border border-slate-100 px-5 py-4 rounded-3xl flex items-center justify-between shadow-sm relative group overflow-hidden">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center shadow-inner">
                  <Clock className="w-5.5 h-5.5" />
                </div>
                <div>
                  <h3 className="text-xl md:text-2xl font-bold text-slate-900 leading-tight">
                    {latestMetric.avgLatency} <span className="text-xs font-normal text-slate-400 lowercase">ms</span>
                  </h3>
                  <p className="text-[10px] md:text-xs text-slate-400 font-medium">RTT (Tempo Médio)</p>
                </div>
              </div>
              <div className="text-slate-300 hover:text-slate-500 hidden md:block">
                <MoreHorizontal className="w-4 h-4" />
              </div>
            </div>

            {/* Card 3: Target CPU */}
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

            {/* Card 4: Incident/Error Rate */}
            <div className="bg-white border border-slate-100 px-5 py-4 rounded-3xl flex items-center justify-between shadow-sm relative group overflow-hidden">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner ${latestMetric.errorRate > 0 ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"}`}>
                  <ShieldAlert className="w-5.5 h-5.5" />
                </div>
                <div>
                  <h3 className="text-xl md:text-2xl font-bold text-slate-900 leading-tight">
                    {latestMetric.errorRate.toFixed(2)} %
                  </h3>
                  <p className="text-[10px] md:text-xs text-slate-400 font-medium font-sans">Taxa de Falhas</p>
                </div>
              </div>
              <div className="text-slate-300 hover:text-slate-500 hidden md:block">
                <MoreHorizontal className="w-4 h-4" />
              </div>
            </div>

          </div>

          {/* B. Tab Switcher router */}
          {activeTab === "dashboard" && (
            <DashboardPanel
              metricsList={metricsList}
              testProgressPercent={testProgressPercent}
              currentTest={currentTest}
              isAddingPreset={isAddingPreset}
              setIsAddingPreset={setIsAddingPreset}
              newPresetName={newPresetName}
              setNewPresetName={setNewPresetName}
              newPresetIp={newPresetIp}
              setNewPresetIp={setNewPresetIp}
              newPresetPort={newPresetPort}
              setNewPresetPort={setNewPresetPort}
              newPresetWorkers={newPresetWorkers}
              setNewPresetWorkers={setNewPresetWorkers}
              newPresetDuration={newPresetDuration}
              setNewPresetDuration={setNewPresetDuration}
              newPresetAttackMode={newPresetAttackMode}
              setNewPresetAttackMode={setNewPresetAttackMode}
              newPresetDesc={newPresetDesc}
              setNewPresetDesc={setNewPresetDesc}
              handleAddPreset={handleAddPreset}
              presetsList={presetsList}
              applyPreset={applyPreset}
              scrollToConfigurator={scrollToConfigurator}
              handleDeletePreset={handleDeletePreset}
              targetIp={targetIp}
              setTargetIp={setTargetIp}
              targetPort={targetPort}
              setTargetPort={setTargetPort}
              workers={workers}
              setWorkers={setWorkers}
              attackMode={attackMode}
              setAttackMode={setAttackMode}
              duration={duration}
              setDuration={setDuration}
              submitConfiguration={submitConfiguration}
              configuring={configuring}
              actionLoading={actionLoading}
              triggerControlAction={triggerControlAction}
              fetchError={fetchError}
              getStatusColor={getStatusColor}
            />
          )}

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

          {activeTab === "history" && (
            <HistoryPanel
              historyList={historyList}
              fetchHistory={fetchHistory}
              deleteRun={deleteRun}
              getStatusColor={getStatusColor}
            />
          )}

          {activeTab === "docs" && <DocsPanel />}

          {activeTab === "profile" && (
            <ProfilePanel
              profile={profile}
              loadingProfile={loadingProfile}
              user={user}
              profileMessage={profileMessage}
              profileError={profileError}
              onUpdateProfile={handleUpdateProfile}
              getAvatarBgClass={getAvatarBgClass}
            />
          )}

        </main>
      </div>

      {/* 3. MOBILE FOOTER TAB BAR BAR */}
      <footer className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-100 flex items-center justify-around px-4 z-40 shadow-lg">
        <button
          type="button"
          onClick={() => setActiveTab("dashboard")}
          className={`flex flex-col items-center gap-1 text-[9px] font-mono transition-all uppercase ${
            activeTab === "dashboard" ? "text-purple-600 font-bold scale-105" : "text-slate-400 hover:text-slate-600"
          }`}
        >
          <Activity className={`w-5 h-5 ${activeTab === "dashboard" ? "text-purple-600" : "text-slate-400"}`} />
          <span>Monitor</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("audit");
            fetchAudits();
          }}
          className={`flex flex-col items-center gap-1 text-[9px] font-mono transition-all uppercase ${
            activeTab === "audit" ? "text-purple-600 font-bold scale-105" : "text-slate-400 hover:text-slate-600"
          }`}
        >
          <ShieldCheck className={`w-5 h-5 ${activeTab === "audit" ? "text-purple-600" : "text-slate-400"}`} />
          <span>Laudos</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("history");
            fetchHistory();
          }}
          className={`flex flex-col items-center gap-1 text-[9px] font-mono transition-all uppercase ${
            activeTab === "history" ? "text-purple-600 font-bold scale-105" : "text-slate-400 hover:text-slate-600"
          }`}
        >
          <History className={`w-5 h-5 ${activeTab === "history" ? "text-purple-600" : "text-slate-400"}`} />
          <span>Histórico</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("docs")}
          className={`flex flex-col items-center gap-1 text-[9px] font-mono transition-all uppercase ${
            activeTab === "docs" ? "text-purple-600 font-bold scale-105" : "text-slate-400 hover:text-slate-600"
          }`}
        >
          <BookOpen className={`w-5 h-5 ${activeTab === "docs" ? "text-purple-600" : "text-slate-400"}`} />
          <span>DevOps</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("profile")}
          className={`flex flex-col items-center gap-1 text-[9px] font-mono transition-all uppercase ${
            activeTab === "profile" ? "text-purple-600 font-bold scale-105" : "text-slate-400 hover:text-slate-600"
          }`}
        >
          <User className={`w-5 h-5 ${activeTab === "profile" ? "text-purple-600" : "text-slate-400"}`} />
          <span>Perfil</span>
        </button>
      </footer>

    </div>
  );
}
