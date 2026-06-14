import React from "react";
import { RefreshCw, Download, Trash2 } from "lucide-react";
import { TestRun } from "../types";

interface HistoryPanelProps {
  historyList: TestRun[];
  fetchHistory: () => Promise<void>;
  deleteRun: (id: string) => Promise<void>;
  getStatusColor: (status: string) => string;
}

export default function HistoryPanel({
  historyList,
  fetchHistory,
  deleteRun,
  getStatusColor
}: HistoryPanelProps) {
  return (
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
          type="button"
          onClick={fetchHistory}
          className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-xs font-mono text-slate-600 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
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
            <div key={run.id} className="border border-slate-100 bg-white p-5 rounded-3xl space-y-4 shadow-sm relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 right-0 p-4">
                <span className={`inline-block text-[9px] font-mono font-bold uppercase p-1 px-2.5 rounded-full border ${getStatusColor(run.status)}`}>
                  {run.status}
                </span>
              </div>

              <div className="space-y-1">
                <div className="text-[9px] font-mono text-slate-400 uppercase">RUN ID: {run.id}</div>
                <h4 className="text-sm font-semibold text-slate-800 break-all font-mono">
                  {(run as any).targetUrl || `${run.targetIp}:${run.targetPort}`}
                </h4>
                <p className="text-[10px] text-slate-400 leading-none">
                  Disparado em: <strong className="font-mono">{new Date(run.createdAt).toLocaleString()}</strong>
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-2xl text-center font-mono text-[10px]">
                <div>
                  <span className="text-[9px] text-slate-400 block uppercase">Operadores</span>
                  <span className="text-slate-800 block font-bold mt-0.5">{run.workers}</span>
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
                  className="flex-1 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 font-mono text-[11px] rounded-lg transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer hover:shadow-xs font-medium"
                >
                  <Download className="w-3.5 h-3.5 text-purple-600" />
                  <span>Exportar CSV</span>
                </a>

                <button
                  type="button"
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
  );
}
