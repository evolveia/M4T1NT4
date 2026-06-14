import React from "react";
import {
  Layers,
  Terminal,
  RefreshCw,
  Play,
  Pause,
  Square,
  Globe,
  Flame,
  Zap,
  Trash2
} from "lucide-react";
import { MetricPoint, TestRun } from "../types";
import CustomChart from "./CustomChart";

interface DashboardPanelProps {
  metricsList: MetricPoint[];
  testProgressPercent: number;
  currentTest: TestRun | null;
  
  // Preset Controls
  isAddingPreset: boolean;
  setIsAddingPreset: (val: boolean) => void;
  newPresetName: string;
  setNewPresetName: (val: string) => void;
  newPresetIp: string;
  setNewPresetIp: (val: string) => void;
  newPresetPort: number;
  setNewPresetPort: (val: number) => void;
  newPresetWorkers: number;
  setNewPresetWorkers: (val: number) => void;
  newPresetDuration: number;
  setNewPresetDuration: (val: number) => void;
  newPresetAttackMode: "http_flood" | "syn_flood" | "udp_flood";
  setNewPresetAttackMode: (val: "http_flood" | "syn_flood" | "udp_flood") => void;
  newPresetDesc: string;
  setNewPresetDesc: (val: string) => void;
  handleAddPreset: (e: React.FormEvent) => void;
  presetsList: Array<{
    name: string;
    targetIp: string;
    targetPort: number;
    workers: number;
    duration: number;
    attackMode: "http_flood" | "syn_flood" | "udp_flood";
    desc: string;
    isCustom?: boolean;
  }>;
  applyPreset: (preset: any) => void;
  scrollToConfigurator: () => void;
  handleDeletePreset: (idx: number, e: React.MouseEvent) => void;
  
  // Manual Actions & Form Controls
  targetIp: string;
  setTargetIp: (val: string) => void;
  targetPort: number;
  setTargetPort: (val: number) => void;
  workers: number;
  setWorkers: (val: number) => void;
  attackMode: "http_flood" | "syn_flood" | "udp_flood";
  setAttackMode: (val: "http_flood" | "syn_flood" | "udp_flood") => void;
  duration: number;
  setDuration: (val: number) => void;
  submitConfiguration: (e: React.FormEvent) => void;
  configuring: boolean;
  actionLoading: boolean;
  triggerControlAction: (action: "start" | "pause" | "resume" | "stop") => void;
  fetchError: string | null;
  getStatusColor: (status: string) => string;
}

export default function DashboardPanel({
  metricsList,
  testProgressPercent,
  currentTest,

  isAddingPreset,
  setIsAddingPreset,
  newPresetName,
  setNewPresetName,
  newPresetIp,
  setNewPresetIp,
  newPresetPort,
  setNewPresetPort,
  newPresetWorkers,
  setNewPresetWorkers,
  newPresetDuration,
  setNewPresetDuration,
  newPresetAttackMode,
  setNewPresetAttackMode,
  newPresetDesc,
  setNewPresetDesc,
  handleAddPreset,
  presetsList,
  applyPreset,
  scrollToConfigurator,
  handleDeletePreset,

  targetIp,
  setTargetIp,
  targetPort,
  setTargetPort,
  workers,
  setWorkers,
  attackMode,
  setAttackMode,
  duration,
  setDuration,
  submitConfiguration,
  configuring,
  actionLoading,
  triggerControlAction,
  fetchError,
  getStatusColor
}: DashboardPanelProps) {
  return (
    <div className="space-y-6">
      
      {/* B1. PRESET GRID & LIVE CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Visualizer segment with Charts */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Main RPS chart container */}
          <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm relative space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 leading-tight">Histórico de Dispersão de RPS</h3>
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
              <span className="inline-block text-[9px] font-bold text-slate-400 font-mono csv-header uppercase tracking-wider">
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
              <span className="inline-block text-[9px] font-bold text-slate-400 font-mono csv-header uppercase tracking-wider">
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

        {/* Right side widgets */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Circular Progress Ring */}
          <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm relative text-center">
            <h3 className="text-sm font-semibold text-slate-900 mb-4 text-left">Progresso do Teste de Carga</h3>
            
            <div className="relative w-36 h-36 mx-auto flex items-center justify-center mb-4">
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
                  strokeDasharray={String(2 * Math.PI * 40)}
                  strokeDashoffset={String(2 * Math.PI * 40 * (1 - testProgressPercent / 100))}
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

            <div className="space-y-1.5 text-xs text-slate-500 font-mono border-t border-slate-55 border-slate-100 pt-4 flex flex-col justify-center items-center">
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${currentTest?.status === "running" ? "bg-emerald-400" : "bg-slate-300"}`} />
                <span>Status: <strong className="text-slate-800 uppercase">{currentTest?.status || "Inativo"}</strong></span>
              </div>
              <p className="text-[10px] text-slate-405 text-slate-400 font-medium">
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
                {currentTest ? currentTest.workers : "0"} <span className="text-xs font-normal text-purple-100 font-sans">threads</span>
              </h4>
              <p className="text-[11px] text-purple-100/80 mt-1 leading-relaxed">
                Inundação de requisições simulada via modulador {currentTest?.attackMode?.replace("_", " ") || "http flood"} de alto volume.
              </p>
            </div>

            <div className="border-t border-white/10 mt-6 pt-4 flex items-center justify-between text-[11px] font-mono text-purple-100">
              <span>Host Alvo:</span>
              <span className="font-bold underline truncate max-w-[160px]" title={currentTest ? `${currentTest.targetIp}:${currentTest.targetPort}` : "---"}>
                {currentTest ? `${currentTest.targetIp}:${currentTest.targetPort}` : "---"}
              </span>
            </div>
          </div>

          {/* Cluster log entries */}
          <div className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm relative">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Logs do Cluster (Por Divisão)</h3>
            
            <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
              {currentTest && currentTest.status !== "idle" && (
                <div className="flex items-center justify-between text-xs p-2 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                    <span className="font-semibold text-slate-700 font-mono text-[10px]">LOCUST_MASTER</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium font-mono">Spawn OK</span>
                </div>
              )}

              {metricsList.slice(-3).map((pt, index) => (
                <div key={index} className="flex flex-col gap-1 p-2 bg-slate-50/50 rounded-xl border border-slate-100 text-[11px] font-mono">
                  <div className="flex items-center justify-between text-slate-400 text-[9px]">
                    <span>[{new Date(pt.timestamp).toLocaleTimeString()}]</span>
                    <span className="text-purple-600 font-bold uppercase">STREAM_TELEMETROS</span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>RPS: <strong className="text-slate-950">{pt.rps.toFixed(1)}</strong></span>
                    <span>Err: <strong className={pt.errorRate > 0 ? "text-rose-600" : "text-emerald-600"}>{pt.errorRate}%</strong></span>
                  </div>
                </div>
              ))}

              <div className="flex items-center justify-between text-xs p-2 bg-slate-50/30 rounded-xl border border-slate-100/50 text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                  <span className="font-mono text-[10px]">PROMTQL_IO</span>
                </div>
                <span className="text-[9px] font-mono font-medium">Coleta Ativa</span>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* B2. PRESETS AND MANUAL FORM */}
      <div id="target-configurator-block" className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-2">
        
        {/* Presets Grid Panel */}
        <div className="md:col-span-6 bg-white border border-slate-100 p-6 rounded-3xl shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2 leading-tight">
                <Layers className="w-4 h-4 text-purple-600" />
                <span>Modelos de Tráfego (Presets)</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddingPreset(!isAddingPreset)}
                className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-600 font-bold text-[10px] rounded-lg border border-purple-100 transition-all cursor-pointer font-mono"
              >
                {isAddingPreset ? "Ver Lista" : "+ Novo Preset"}
              </button>
            </div>
            <p className="text-[11px] text-slate-540 text-slate-500 font-mono leading-none">Gerencie e dispare cargas personalizadas</p>

            {isAddingPreset ? (
              <form onSubmit={handleAddPreset} className="space-y-3 bg-slate-50/55 p-4 rounded-2xl border border-slate-100 text-xs animate-fade-in font-sans">
                <h4 className="font-bold text-slate-800 text-[10px] uppercase font-mono tracking-wider">Novo Preset de Carga</h4>
                
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
                  className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-all font-mono cursor-pointer text-xs"
                >
                  Salvar Novo Modelo Presets
                </button>
              </form>
            ) : (
              <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
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
                      className="w-full group text-left bg-slate-50/50 hover:bg-slate-50 border border-slate-100 hover:border-slate-350 p-3 rounded-xl transition-all flex items-start gap-3 cursor-pointer relative"
                    >
                      <div className="p-2 bg-white border border-slate-100 rounded-lg text-purple-600">
                        <IconComp className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0 pr-6">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800 font-mono block truncate pr-1">{preset.name}</span>
                          <span className="text-[9px] bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded-full border border-purple-100 font-bold font-mono uppercase whitespace-nowrap">
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
                        type="button"
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

        {/* Input Form and Commands Deck */}
        <div className="md:col-span-6 bg-white border border-slate-100 p-6 rounded-3xl shadow-sm space-y-4">
          <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <Terminal className="w-4 h-4 text-purple-600" />
            <span>Configurador e Mesa de Controle Locust</span>
          </h3>

          <form onSubmit={submitConfiguration} className="space-y-3 text-xs font-sans">
            <div className="grid grid-cols-2 gap-3 font-sans">
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
            <div className="pt-2 flex flex-col sm:flex-row gap-2 font-mono text-[11px] font-semibold">
              <button
                type="submit"
                disabled={configuring || (currentTest && currentTest.status === "running")}
                className="flex-grow py-2 px-3 bg-slate-105 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-850 text-slate-800 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${configuring ? "animate-spin" : ""}`} />
                <span>Aplicar Parâmetros</span>
              </button>

              {currentTest?.status === "paused" ? (
                <button
                  type="button"
                  onClick={() => triggerControlAction("resume")}
                  disabled={actionLoading}
                  className="flex-grow py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Retomar</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => triggerControlAction("start")}
                  disabled={actionLoading || currentTest?.status === "running"}
                  className="flex-grow py-2 px-3 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-100 disabled:text-slate-450 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Disparar Carga</span>
                </button>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => triggerControlAction("pause")}
                  disabled={actionLoading || currentTest?.status !== "running"}
                  className="py-2 px-3.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-center disabled:opacity-35 cursor-pointer flex items-center justify-center flex-1"
                  title="Pausar Carga"
                >
                  <Pause className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => triggerControlAction("stop")}
                  disabled={actionLoading || (currentTest?.status !== "running" && currentTest?.status !== "paused")}
                  className="py-2 px-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-center disabled:opacity-35 cursor-pointer flex items-center justify-center flex-1"
                  title="Parar e Salvar no Histórico"
                >
                  <Square className="w-3.5 h-3.5 fill-white" />
                </button>
              </div>
            </div>

            {fetchError && (
              <p className="text-[10px] text-red-650 bg-red-50 text-red-600 font-mono mt-1 text-center p-1.5 rounded-xl border border-red-100">
                {fetchError}
              </p>
            )}
          </form>
        </div>

      </div>

    </div>
  );
}
