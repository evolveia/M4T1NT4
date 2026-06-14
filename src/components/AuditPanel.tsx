import React, { useState } from "react";
import { 
  ShieldCheck, 
  ShieldAlert, 
  Plus, 
  Trash2, 
  Edit3, 
  Download, 
  RefreshCw, 
  Calendar, 
  User, 
  Server, 
  AlertCircle, 
  Filter, 
  CheckCircle2, 
  FileText,
  Sliders,
  ChevronRight,
  Printer
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { AuditReport, TestRun } from "../types";

export interface AuditPanelProps {
  auditsList: AuditReport[];
  loadingAudits: boolean;
  user: any;
  currentTest: TestRun | null;
  onDelete: (id: string) => Promise<void>;
  onCreate: (auditData: Partial<AuditReport>) => Promise<void>;
  onUpdate: (id: string, auditData: Partial<AuditReport>) => Promise<void>;
  fetchAudits: () => Promise<void>;
}

export default function AuditPanel({
  auditsList,
  loadingAudits,
  user,
  currentTest,
  onDelete,
  onCreate,
  onUpdate,
  fetchAudits
}: AuditPanelProps) {
  // Tabs & Filters
  const [filter, setFilter] = useState<"all" | "compliant" | "vulnerable" | "critical" | "under_review">("all");
  
  // UI Panels State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAuditId, setEditingAuditId] = useState<string | null>(null);
  const [selectedAudit, setSelectedAudit] = useState<AuditReport | null>(null);

  // Form Field States
  const [formTitle, setFormTitle] = useState("");
  const [formTargetIp, setFormTargetIp] = useState("");
  const [formTargetPort, setFormTargetPort] = useState(80);
  const [formDuration, setFormDuration] = useState(60);
  const [formWorkers, setFormWorkers] = useState(100);
  const [formAttackMode, setFormAttackMode] = useState<"http_flood" | "syn_flood" | "udp_flood">("http_flood");
  const [formStatus, setFormStatus] = useState<"compliant" | "vulnerable" | "critical" | "under_review">("under_review");
  const [formScore, setFormScore] = useState(5.0);
  const [formSummary, setFormSummary] = useState("");
  const [formRecommendations, setFormRecommendations] = useState("");
  const [formVulnerabilities, setFormVulnerabilities] = useState<string[]>([]);
  const [newVuln, setNewVuln] = useState("");

  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Filtered audits
  const filteredAudits = auditsList.filter(audit => {
    if (filter === "all") return true;
    return audit.status === filter;
  });

  // Calculate statistics
  const totalReportsCount = auditsList.length;
  const criticalCount = auditsList.filter(a => a.status === "critical").length;
  const compliantCount = auditsList.filter(a => a.status === "compliant").length;
  
  const avgScore = totalReportsCount > 0 
    ? (auditsList.reduce((acc, curr) => acc + curr.score, 0) / totalReportsCount).toFixed(1)
    : "0.0";

  const complianceRate = totalReportsCount > 0
    ? Math.round((compliantCount / totalReportsCount) * 100)
    : 100;

  // Initialize Form for Creating
  const handleOpenCreate = () => {
    setFormTitle(`Laudo de Escaneamento de Infraestrutura - ${new Date().toLocaleDateString()}`);
    // Auto-prepopulate from current simulated test run configurations for awesome UX!
    if (currentTest) {
      setFormTargetIp(currentTest.targetIp || "127.0.0.1");
      setFormTargetPort(currentTest.targetPort || 80);
      setFormDuration(currentTest.duration || 60);
      setFormWorkers(currentTest.workers || 100);
      setFormAttackMode(currentTest.attackMode || "http_flood");
      setFormSummary(`Laudo de estresse realizado através do simulador integrado M4T1NT4 DoS Engine. Durante a simulação de ${currentTest.duration} segundos, utilizando modulador ${currentTest.attackMode}, coletamos métricas de vazão de pacotes e tempos de trânsito RTT para estabelecer o limiar de degradação do host.`);
    } else {
      setFormTargetIp("127.0.0.1");
      setFormTargetPort(80);
      setFormDuration(60);
      setFormWorkers(100);
      setFormAttackMode("http_flood");
      setFormSummary("Escaner de vulnerabilidade e simulador de carga efetuado contra o IP de destino para certificação de banda e resiliência.");
    }
    
    setFormStatus("under_review");
    setFormScore(5.0);
    setFormRecommendations("Recomenda-se configurar taxa limite de conexões por IP (IP rate limiting) nos firewalls corporativos e atenuar conexões malformadas no barramento do balanceador de carga.");
    setFormVulnerabilities(["Inundação de requisições de aplicação (HTTP Flood)", "Baixa atenuação de cabeçalhos no IP principal"]);
    setEditingAuditId(null);
    setFormMessage(null);
    setFormError(null);
    setIsFormOpen(true);
    setSelectedAudit(null);
  };

  // Initialize Form for Editing
  const handleOpenEdit = (audit: AuditReport) => {
    setFormTitle(audit.title);
    setFormTargetIp(audit.targetIp);
    setFormTargetPort(audit.targetPort);
    setFormDuration(audit.duration);
    setFormWorkers(audit.workers);
    setFormAttackMode(audit.attackMode);
    setFormStatus(audit.status);
    setFormScore(audit.score);
    setFormSummary(audit.summary);
    setFormRecommendations(audit.recommendations);
    setFormVulnerabilities(audit.vulnerabilities || []);
    setEditingAuditId(audit.id);
    setFormMessage(null);
    setFormError(null);
    setIsFormOpen(true);
    setSelectedAudit(null);
  };

  // Close form
  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingAuditId(null);
    setFormVulnerabilities([]);
    setNewVuln("");
  };

  // Vulnerability Array CRUD Helper
  const addVulnTag = () => {
    if (!newVuln.trim()) return;
    if (!formVulnerabilities.includes(newVuln.trim())) {
      setFormVulnerabilities([...formVulnerabilities, newVuln.trim()]);
    }
    setNewVuln("");
  };

  const removeVulnTag = (tag: string) => {
    setFormVulnerabilities(formVulnerabilities.filter(t => t !== tag));
  };

  // Handle Form Submit (Create/Update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError(null);
    setFormMessage(null);

    const dataPayload: Partial<AuditReport> = {
      title: formTitle,
      targetIp: formTargetIp,
      targetPort: Number(formTargetPort),
      duration: Number(formDuration),
      workers: Number(formWorkers),
      attackMode: formAttackMode,
      status: formStatus,
      score: Number(formScore),
      summary: formSummary,
      recommendations: formRecommendations,
      vulnerabilities: formVulnerabilities,
      responsible: user?.name || "Operador DevOps"
    };

    try {
      if (editingAuditId) {
        await onUpdate(editingAuditId, dataPayload);
        setFormMessage("Laudo de auditoria atualizado com sucesso!");
      } else {
        await onCreate(dataPayload);
        setFormMessage("Novo Laudo de auditoria emitido e registrado!");
      }
      setTimeout(() => {
        setIsFormOpen(false);
        setEditingAuditId(null);
      }, 1500);
    } catch (err: any) {
      setFormError(err.message || "Erro de submissão do formulário.");
    } finally {
      setFormSubmitting(false);
    }
  };

  // Trigger browser print for a highly stylized printable sheet!
  const handlePrint = (audit: AuditReport) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Por favor habilite popups para exibir a folha de impressão profissional de auditoria.");
      return;
    }
    
    // Convert status labels to friendly brazilian pt-br translation
    const getStatusLabelText = (st: string) => {
      switch (st) {
        case "compliant": return "CONFORME / SEGURO";
        case "vulnerable": return "Vulnerável";
        case "critical": return "ALERTA CRÍTICO DE RISCO (CVE)";
        case "under_review":
        default: return "SOB ANÁLISE / REVISÃO";
      }
    };

    const getStatusThemeColor = (st: string) => {
      switch (st) {
        case "compliant": return "#10b981";
        case "vulnerable": return "#f59e0b";
        case "critical": return "#ef4444";
        case "under_review":
        default: return "#64748b";
      }
    };

    const vulnListHtml = audit.vulnerabilities.map(v => `<li>${v}</li>`).join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>M4T1NT4 - Laudo Técnico ID ${audit.id.slice(0,8)}</title>
          <style>
            body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1e293b; padding: 40px; margin: 0; line-height: 1.6; }
            .header { border-bottom: 3px solid #7c3ade; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; }
            .header h1 { font-size: 26px; font-weight: bold; margin: 0; text-transform: uppercase; tracking-tight: -0.05em; }
            .header h2 { font-size: 11px; font-family: monospace; color: #64748b; margin: 5px 0 0; tracking: 0.1em; }
            .score-badge { background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px 25px; border-radius: 12px; text-align: center; }
            .score-num { font-size: 32px; font-weight: bold; color: #7c3ade; line-height: 1; }
            .score-label { font-size: 10px; text-transform: uppercase; color: #64748b; margin-top: 5px; font-weight: bold; }
            .badge-status { display: inline-block; padding: 6px 12px; border-radius: 6px; font-weight: bold; font-size: 11px; text-transform: uppercase; color: white; background: ${getStatusThemeColor(audit.status)}; }
            .section { margin-bottom: 30px; }
            .section-title { font-size: 14px; font-weight: bold; text-transform: uppercase; color: #475569; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 15px; font-family: monospace; }
            .meta-grid { display: grid; grid-template-cols: repeat(2, 1fr); gap: 15px; margin-bottom: 20px; background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #f1f5f9; font-size: 12px; }
            .meta-item { display: flex; flex-direction: column; }
            .meta-label { font-weight: bold; color: #64748b; text-transform: uppercase; font-size: 10px; font-family: monospace; margin-bottom: 3px; }
            .meta-val { font-size: 13px; font-family: monospace; }
            ul { padding-left: 20px; margin: 0; }
            li { margin-bottom: 8px; font-size: 12px; }
            .footer { border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 50px; text-align: center; font-size: 10px; color: #94a3b8; font-family: monospace; }
            @media print {
              body { padding: 20px; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="no-print" style="background: #f8fafc; padding: 15px; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size:12px; font-weight:500;">Folha de Relatório Pronta para Impressão Física ou PDF</span>
            <button onclick="window.print()" style="background:#7c3ade; color:white; border:none; padding:8px 16px; font-weight:bold; border-radius:8px; cursor:pointer; font-size:11px;">Imprimir / Salvar PDF</button>
          </div>

          <div class="header">
            <div>
              <h1>Plataforma M4t1nt4</h1>
              <h2>Relatório Oficial de Auditoria • ID: ${audit.id}</h2>
            </div>
            <div class="score-badge">
              <div class="score-num">${audit.score.toFixed(1)}</div>
              <div class="score-label">Pontuação de Risco</div>
            </div>
          </div>

          <div style="margin-bottom:20px; display:flex; justify-content:space-between; align-items:center;">
            <span style="font-size:18px; font-weight:bold; color:#0f172a;">${audit.title}</span>
            <span class="badge-status">${getStatusLabelText(audit.status)}</span>
          </div>

          <div class="meta-grid">
            <div class="meta-item">
              <span class="meta-label">IP do Servidor Alvo</span>
              <span class="meta-val">${audit.targetIp}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Porta Ativa</span>
              <span class="meta-val">${audit.targetPort}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Modo do Teste</span>
              <span class="meta-val">${audit.attackMode.toUpperCase()}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Threads / Workers</span>
              <span class="meta-val">${audit.workers}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Limiar de Tempo</span>
              <span class="meta-val">${audit.duration} Segundos</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Responsável DevOps</span>
              <span class="meta-val">${audit.responsible}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Data de Emissão</span>
              <span class="meta-val">${new Date(audit.createdAt).toLocaleString()}</span>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Resumo Analítico Executivo</div>
            <p style="font-size:12px; line-height:1.7; text-align:justify;">${audit.summary}</p>
          </div>

          <div class="section">
            <div class="section-title">Vulnerabilidades e Fragmentos Identificados</div>
            <ul>
              ${vulnListHtml || "<li>Nenhuma vulnerabilidade crítica cadastrada no mapeamento das portas.</li>"}
            </ul>
          </div>

          <div class="section">
            <div class="section-title">Recomendações e Diretrizes de Engenharia</div>
            <p style="font-size:12px; line-height:1.7; text-align:justify;">${audit.recommendations}</p>
          </div>

          <div class="footer">
            <span>M4T1NT4 • Plataforma Corporativa de Resiliência de Redes Contra Ataques DoS</span>
            <br>
            <span>Gerado em ${new Date().toLocaleString()} por ${audit.responsible} - Autenticado em Banco Persistente</span>
          </div>
          
          <script>
            window.onload = function() {
              // auto focus elements
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Header with metadata and filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 leading-tight">
            Laudo de Auditoria & Conformidade
          </h2>
          <p className="text-xs text-slate-400 font-mono">
            Módulo avançado de emissão, edição, arquivamento e relatórios de resiliência
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={fetchAudits}
            title="Sincronizar Laudos"
            className="p-2 bg-white border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-xl transition-all cursor-pointer shadow-sm flex items-center justify-center"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingAudits ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
            id="btn-new-audit-report"
          >
            <Plus className="w-4 h-4" />
            <span>Emitir Novo Laudo</span>
          </button>
        </div>
      </div>

      {/* 2. Micro Bento KPI Cards Grid on Audits */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white border border-slate-100 p-4 rounded-3xl shadow-sm">
          <span className="block text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider">Volume de Laudos</span>
          <div className="flex justify-between items-baseline mt-1.5">
            <span className="text-2xl font-bold text-slate-900 font-mono">{totalReportsCount}</span>
            <span className="text-[10px] text-slate-400 font-mono">cadastrados em banco</span>
          </div>
        </div>

        <div className="bg-white border border-slate-100 p-4 rounded-3xl shadow-sm">
          <span className="block text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider">Risco Médio da Infra</span>
          <div className="flex justify-between items-baseline mt-1.5">
            <span className={`text-2xl font-bold font-mono ${parseFloat(avgScore) > 7.0 ? "text-rose-600" : parseFloat(avgScore) > 4.5 ? "text-amber-500" : "text-emerald-600"}`}>
              {avgScore} <span className="text-xs text-slate-300">/ 10</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono">escala decrescente</span>
          </div>
        </div>

        <div className="bg-white border border-slate-100 p-4 rounded-3xl shadow-sm">
          <span className="block text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider">Taxa de Conformidade</span>
          <div className="flex justify-between items-baseline mt-1.5">
            <span className="text-2xl font-bold text-slate-900 font-mono text-emerald-600">{complianceRate}%</span>
            <span className="text-[10px] text-slate-400 font-mono">hosts blindados</span>
          </div>
        </div>

        <div className="bg-white border border-slate-100 p-4 rounded-3xl shadow-sm">
          <span className="block text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider">Laudos Críticos</span>
          <div className="flex justify-between items-baseline mt-1.5">
            <span className="text-2xl font-bold text-slate-900 font-mono text-rose-600">{criticalCount}</span>
            <span className="text-[10px] text-rose-400 font-mono font-bold uppercase">CVE urgente</span>
          </div>
        </div>

      </div>

      {/* 3. Filter Controls panel */}
      <div className="flex items-center gap-1.5 py-1 text-xs border-b border-slate-200/50 pb-2 flex-wrap">
        <span className="text-slate-400 font-mono font-semibold flex items-center gap-1 mr-2 bg-slate-100 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full">
          <Filter className="w-3 h-3" />
          <span>Filtro de Status</span>
        </span>
        
        {[
          { key: "all", label: "Todos os Laudos" },
          { key: "compliant", label: "Conformes" },
          { key: "vulnerable", label: "Vulneráveis" },
          { key: "critical", label: "Ataque Crítico" },
          { key: "under_review", label: "Em Análise" }
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => setFilter(item.key as any)}
            className={`px-3 py-1 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer border ${
              filter === item.key
                ? "bg-purple-600 text-white border-purple-600 shadow-sm"
                : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* 4. CRUD Master-Detail Form Modal / Panel Overlay */}
      <AnimatePresence>
        {isFormOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="bg-white border border-slate-100 rounded-3xl shadow-xl p-6 relative overflow-hidden"
            id="audit-crud-form-container"
          >
            <div className="absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-purple-500 to-indigo-600" />
            
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-purple-600" />
                  <span>{editingAuditId ? "Editar Relatório Técnico de Auditoria" : "Registrar Novo Laudo de Auditoria"}</span>
                </h3>
                <p className="text-[11px] text-slate-400 font-mono uppercase mt-0.5">Laudo ID: {editingAuditId || "Geraid automático no banco"}</p>
              </div>
              <button 
                onClick={handleCloseForm}
                className="text-xs font-bold text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 p-1.5 rounded-lg cursor-pointer"
              >
                Cancelar (X)
              </button>
            </div>

            {formMessage && (
              <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-100 text-xs rounded-xl font-medium mb-4 animate-fade-in flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <span>{formMessage}</span>
              </div>
            )}

            {formError && (
              <div className="p-3 bg-rose-50 text-rose-800 border border-rose-100 text-xs rounded-xl font-medium mb-4 animate-fade-in flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-700" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1.5">Título do Laudo de Auditoria</label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="Ex: Auditoria Geral de Resiliência Firewalls de Borda"
                    className="block w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-purple-500 focus:bg-white transition-all shadow-inner"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1.5">Status de Resiliência</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="block w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-purple-500 focus:bg-white transition-all"
                  >
                    <option value="compliant">Conforme (Blindado / Seguro)</option>
                    <option value="vulnerable">Vulnerabilidade Encontrada</option>
                    <option value="critical">Risco / Ataque Crítico</option>
                    <option value="under_review">Sob Análise / Em Revisão</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100/80">
                <div>
                  <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1.5">Endereço IP Alvo</label>
                  <input
                    type="text"
                    required
                    value={formTargetIp}
                    onChange={(e) => setFormTargetIp(e.target.value)}
                    placeholder="127.0.0.1"
                    className="block w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 font-mono focus:outline-none focus:border-purple-500 shadow-inner"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1.5">Porta</label>
                  <input
                    type="number"
                    required
                    value={formTargetPort}
                    onChange={(e) => setFormTargetPort(Number(e.target.value))}
                    placeholder="80"
                    className="block w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 font-mono focus:outline-none focus:border-purple-500 shadow-inner"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1.5">Workers / Segmentos</label>
                  <input
                    type="number"
                    required
                    value={formWorkers}
                    onChange={(e) => setFormWorkers(Number(e.target.value))}
                    className="block w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 font-mono focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1.5">Modo de Ataque Testado</label>
                  <select
                    value={formAttackMode}
                    onChange={(e) => setFormAttackMode(e.target.value as any)}
                    className="block w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 font-mono focus:outline-none focus:border-purple-500"
                  >
                    <option value="http_flood">HTTP flood</option>
                    <option value="syn_flood">SYN flood</option>
                    <option value="udp_flood">UDP flood</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1.5">Pontuação de Risco da Infraestrutura ({formScore.toFixed(1)} / 10.0)</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="0.1"
                      value={formScore}
                      onChange={(e) => setFormScore(Number(e.target.value))}
                      className="flex-1 accent-purple-600 h-1.5 bg-slate-100 rounded-lg cursor-pointer"
                    />
                    <span className={`font-mono text-sm font-bold px-2 py-0.5 rounded-lg border text-center min-w-[50px] ${formScore > 7.0 ? "bg-rose-50 border-rose-200 text-rose-600" : formScore > 4.0 ? "bg-amber-50 border-amber-200 text-amber-600" : "bg-emerald-50 border-emerald-200 text-emerald-600"}`}>
                      {formScore}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1.5">Duração do Teste (S)</label>
                  <input
                    type="number"
                    required
                    value={formDuration}
                    onChange={(e) => setFormDuration(Number(e.target.value))}
                    className="block w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1.5">Resumo Analítico Executivo</label>
                <textarea
                  rows={4}
                  required
                  value={formSummary}
                  onChange={(e) => setFormSummary(e.target.value)}
                  placeholder="Escreva um sumário focado sobre o comportamento dos loops na degradação de recursos..."
                  className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-sans focus:outline-none focus:border-purple-500 focus:bg-white transition-all shadow-inner leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1.5">Recomendações e Diretrizes Corporativas para Segurança</label>
                <textarea
                  rows={3}
                  required
                  value={formRecommendations}
                  onChange={(e) => setFormRecommendations(e.target.value)}
                  placeholder="Instruções para o time DevOps implantar no pipeline..."
                  className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-sans focus:outline-none focus:border-purple-500 focus:bg-white transition-all shadow-inner leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1.5">Mapear Vulnerabilidade / Anomalia</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newVuln}
                    onChange={(e) => setNewVuln(e.target.value)}
                    placeholder="Ex: Ataque DDoS de amplificação NTP na porta 123"
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-purple-500"
                  />
                  <button
                    type="button"
                    onClick={addVulnTag}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-mono font-bold rounded-xl active:scale-95 transition-all cursor-pointer"
                  >
                    Adicionar Tag
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  {formVulnerabilities.map((v, i) => (
                    <span 
                      key={i}
                      className="inline-flex items-center gap-1.5 bg-purple-50 hover:bg-rose-50 border border-purple-100 hover:border-rose-100 text-purple-700 hover:text-rose-700 px-2.5 py-1 rounded-full text-[10px] font-mono transition-colors font-bold cursor-pointer"
                      onClick={() => removeVulnTag(v)}
                      title="Clique para excluir vulnerabilidade"
                    >
                      <span>● {v}</span>
                      <span className="text-purple-400 hover:text-rose-600 font-extrabold ml-1">×</span>
                    </span>
                  ))}
                  {formVulnerabilities.length === 0 && (
                    <span className="text-[10px] text-slate-400 font-mono">Nenhuma vulnerabilidade ou anomalia listada para este host.</span>
                  )}
                </div>
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-mono font-bold rounded-xl shadow-md shadow-purple-100 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {formSubmitting ? "Gravando no Banco de Dados..." : "Gravar e Emitir Laudo"}
                </button>
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className="px-4 py-2.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 font-mono font-semibold rounded-xl transition-all cursor-pointer"
                >
                  Descartar
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 5. Master Audit Logs Card List / Table */}
      <div className="grid grid-cols-1 gap-4">
        {loadingAudits && auditsList.length === 0 ? (
          <div className="bg-white border border-slate-100 rounded-3xl p-12 text-center text-slate-400 font-mono text-xs shadow-sm">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4" />
            Buscando logs de laudos na infra de auditoria...
          </div>
        ) : filteredAudits.length === 0 ? (
          <div className="bg-white border border-slate-100 rounded-3xl border-dashed p-12 text-center text-slate-400 font-mono text-xs shadow-sm">
            Nenhum laudo correspondente ao filtro encontrado em nosso banco persistente.
          </div>
        ) : (
          filteredAudits.map((audit) => {
            const isWorstRisk = audit.score >= 7.0;
            const isMediumRisk = audit.score >= 4.0 && audit.score < 7.0;
            return (
              <div 
                key={audit.id}
                className="bg-white border border-slate-100/90 hover:border-slate-200 shadow-sm hover:shadow-md rounded-3xl p-5 transition-all text-slate-700"
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  
                  {/* Left Column: Identifiers, Status badges and details */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-flex items-center gap-1.5 text-[9px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                        audit.status === "compliant"
                          ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                          : audit.status === "vulnerable"
                            ? "bg-amber-50 text-amber-600 border-amber-200"
                            : audit.status === "critical"
                              ? "bg-rose-50 text-rose-600 border-rose-200"
                              : "bg-slate-50 text-slate-500 border-slate-200"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          audit.status === "compliant"
                            ? "bg-emerald-500"
                            : audit.status === "vulnerable"
                              ? "bg-amber-500"
                              : audit.status === "critical"
                                ? "bg-rose-500"
                                : "bg-slate-400"
                        }`} />
                        <span>
                          {audit.status === "compliant" ? "Conforme (Seguro)" : audit.status === "vulnerable" ? "Vulnerável" : audit.status === "critical" ? "Ataque Crítico" : "Em Revisão"}
                        </span>
                      </span>

                      <span className="text-[10px] font-mono text-slate-400">
                        Laudo Técnico #{audit.id.slice(0, 8)} • Disparado por <strong className="text-slate-600 font-bold">{audit.responsible}</strong>
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 leading-snug">
                      {audit.title}
                    </h3>

                    <div className="flex flex-wrap gap-y-1.5 gap-x-4 text-[11px] text-slate-500 font-mono">
                      <div className="flex items-center gap-1">
                        <Server className="w-3.5 h-3.5 text-purple-600" />
                        <span>Alvo: {audit.targetIp}:{audit.targetPort}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Sliders className="w-3.5 h-3.5 text-slate-400" />
                        <span>Modo: {audit.attackMode.toUpperCase()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>Emissão: {new Date(audit.createdAt).toLocaleString()}</span>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-500 font-sans leading-relaxed text-justify max-w-4xl bg-slate-50/40 p-3 rounded-2xl border border-slate-100">
                      <strong>Resumo Analítico:</strong> {audit.summary}
                    </p>

                    {/* Render vulnerable tags inside active reports */}
                    {audit.vulnerabilities && audit.vulnerabilities.length > 0 && (
                      <div className="pt-1 select-none">
                        <div className="text-[9px] font-mono text-slate-400 font-bold uppercase tracking-wider mb-1">Mapeamento de Vulnerabilidade:</div>
                        <div className="flex flex-wrap gap-1">
                          {audit.vulnerabilities.map((v, i) => (
                            <span 
                              key={i} 
                              className="inline-block bg-slate-50 text-slate-600 border border-slate-200/80 px-2 py-0.5 rounded-lg text-[9px] font-mono font-bold"
                            >
                              ☣ {v}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Score metrics and CRUD controls */}
                  <div className="flex lg:flex-col items-center lg:items-end justify-between lg:justify-start gap-4 p-4 lg:p-0 bg-slate-50/50 lg:bg-transparent rounded-2xl">
                    
                    {/* Visual concentric score indicator */}
                    <div className="text-center">
                      <div className={`w-14 h-14 rounded-2xl border flex flex-col items-center justify-center shadow-inner ${
                        isWorstRisk 
                          ? "bg-rose-50 border-rose-100 text-rose-600" 
                          : isMediumRisk 
                            ? "bg-amber-50 border-amber-100 text-amber-500" 
                            : "bg-emerald-50 border-emerald-100 text-emerald-600"
                      }`}>
                        <span className="text-lg font-bold font-mono">{audit.score.toFixed(1)}</span>
                        <span className="text-[7px] font-mono font-extrabold uppercase mt-0.5 tracking-wider leading-none">RISCO IP</span>
                      </div>
                    </div>

                    {/* Operational CRUD controls buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handlePrint(audit)}
                        title="Imprimir Laudo Técnico Corp"
                        className="p-2 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800 rounded-xl border border-slate-200 shadow-sm transition-all flex items-center justify-center cursor-pointer"
                        id={`btn-print-audit-${audit.id}`}
                      >
                        <Printer className="w-4.5 h-4.5" />
                      </button>

                      <button
                        onClick={() => handleOpenEdit(audit)}
                        title="Editar Laudo no Banco"
                        className="p-2 bg-white hover:bg-slate-50 text-purple-600 hover:text-purple-700 rounded-xl border border-slate-200 shadow-sm transition-all flex items-center justify-center cursor-pointer"
                        id={`btn-edit-audit-${audit.id}`}
                      >
                        <Edit3 className="w-4.5 h-4.5" />
                      </button>

                      <button
                        onClick={() => onDelete(audit.id)}
                        title="Excluir Laudo Permanentemente"
                        className="p-2 bg-white hover:bg-rose-50 text-rose-500 hover:text-rose-600 border border-slate-200 hover:border-rose-200 rounded-xl shadow-sm transition-all flex items-center justify-center cursor-pointer"
                        id={`btn-delete-audit-${audit.id}`}
                      >
                        <Trash2 className="w-4.5 h-4.5" />
                      </button>
                    </div>

                  </div>

                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
