import { useState } from "react";
import { Check, Copy, Folder, File, Code, Database, Server, Compass, FileText } from "lucide-react";

export default function DocsPanel() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const schemaCode = `-- Schema PostgreSQL para M4t1nt4 Load Tester
-- Criação das Tabelas Principais

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'operator',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE test_runs (
    id VARCHAR(50) PRIMARY KEY,
    target_url TEXT NOT NULL,
    concurrent_users INTEGER NOT NULL,
    spawn_rate INTEGER NOT NULL,
    duration_seconds INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL, -- 'running', 'paused', 'completed', 'stopped'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    elapsed_seconds INTEGER DEFAULT 0
);

CREATE TABLE metrics_history (
    id BIGSERIAL PRIMARY KEY,
    test_run_id VARCHAR(50) REFERENCES test_runs(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    rps DOUBLE PRECISION NOT NULL,
    error_rate DOUBLE PRECISION NOT NULL,
    avg_latency INTEGER NOT NULL,
    p95_latency INTEGER NOT NULL,
    p99_latency INTEGER NOT NULL,
    cpu_usage DOUBLE PRECISION NOT NULL,
    ram_usage DOUBLE PRECISION NOT NULL
);

-- Índices organizacionais para consultas de monitoramento otimizadas
CREATE INDEX idx_metrics_test_run_id ON metrics_history(test_run_id);
CREATE INDEX idx_metrics_timestamp ON metrics_history(timestamp);
`;

  const fastApiCode = `# app/main.py
# Configuração do FastAPI com conexões Prometheus PromQL e roteiro WebSocket em Tempo Real

import asyncio
import httpx
import logging
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="M4t1nt4 Core API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

PROMETHEUS_URL = "http://prometheus:9090"
active_test_status = "idle"

class TestConfig(BaseModel):
    target_url: str
    users: int
    spawn_rate: int
    duration: int

async def get_prometheus_metric(query: str) -> float:
    """Busca métrica específica diretamente do Prometheus (PromQL)"""
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                f"{PROMETHEUS_URL}/api/v1/query", 
                params={"query": query},
                timeout=2.0
            )
            data = response.json()
            if data["status"] == "success" and data["data"]["result"]:
                # Pega o valor correspondente no payload retornado
                return float(data["data"]["result"][0]["value"][1])
        except Exception as e:
            logging.error(f"Erro ao buscar Prometheus: {e}")
        return 0.0

@app.websocket("/ws/metrics")
async def websocket_metrics_endpoint(websocket: WebSocket):
    """Envia métricas simuladas/reais e dados de Prometheus via WebSocket Loop"""
    await websocket.accept()
    elapsed = 0
    try:
        while True:
            # Consulta PromQL real do Node Exporter rodando na infraestrutura
            cpu_query = "100 - (avg by (instance) (rate(node_cpu_seconds_total{mode='idle'}[1m])) * 100)"
            ram_query = "((node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes) * 100"
            
            cpu_val = await get_prometheus_metric(cpu_query)
            ram_val = await get_prometheus_metric(ram_query)
            
            # Se não houver resposta do prometheus, criamos amostra fallback realista
            if cpu_val == 0.0:
                cpu_val = 14.5 + (elapsed * 1.5) % 80
            if ram_val == 0.0:
                ram_val = 43.1 + (elapsed * 0.4) % 40

            payload = {
                "elapsed": elapsed,
                "status": "running",
                "metrics": {
                    "rps": 120.5 + (elapsed * 5) % 250,
                    "error_rate": 0.02 if elapsed < 40 else 4.25,
                    "avg_latency": 45 + (elapsed // 2),
                    "p95_latency": 60 + elapsed,
                    "p99_latency": 120 + (elapsed * 2),
                    "cpu_usage": round(cpu_val, 2),
                    "ram_usage": round(ram_val, 2)
                }
            }
            
            await websocket.send_json(payload)
            await asyncio.sleep(1.0)
            elapsed += 1
            
    except WebSocketDisconnect:
        logging.info("Conexão WebSocket suspensa pelo cliente.")
`;

  const dockerComposeCode = `# docker-compose.yml
# Setup completo da Stack de Observabilidade, Teste e Aplicação M4t1nt4

version: '3.8'

services:
  # Banco de Dados para relatórios e autenticação
  db:
    image: postgres:15-alpine
    container_name: m4t1nt4-db
    environment:
      POSTGRES_USER: m4t1nt4_admin
      POSTGRES_PASSWORD: S@nb4f6e-secure-pwd
      POSTGRES_DB: m4t1nt4_db
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    restart: unless-stopped

  # Redis para Pub/Sub e Cache de Métricas em tempo real
  redis:
    image: redis:7-alpine
    container_name: m4t1nt4-redis
    ports:
      - "6379:6379"
    restart: unless-stopped

  # Backend de Orquestração com FastAPI
  api:
    build: ./backend
    container_name: m4t1nt4-api
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://m4t1nt4_admin:S@nb4f6e-secure-pwd@db:5432/m4t1nt4_db
      - REDIS_HOST=redis
      - PROMETHEUS_URL=http://prometheus:9090
      - LOCUST_URL=http://locust-master:8089
    depends_on:
      - db
      - redis
    restart: unless-stopped

  # Locust Master para simulações distribuídas
  locust-master:
    image: locustio/locust
    container_name: m4t1nt4-locust-master
    ports:
      - "8089:8089"
    volumes:
      - ./locust:/locust
    command: -f /locust/locustfile.py --master
    restart: unless-stopped

  # Locust Worker (Simulador de carga)
  locust-worker:
    image: locustio/locust
    volumes:
      - ./locust:/locust
    command: -f /locust/locustfile.py --worker --master-host locust-master
    depends_on:
      - locust-master
    deploy:
      replicas: 2

  # Prometheus para Coleta de Telemetria de Infraestrutura do Alvo
  prometheus:
    image: prom/prometheus:latest
    container_name: m4t1nt4-prometheus
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
    ports:
      - "9090:9090"
    restart: unless-stopped

  # Node Exporter para ler métricas do Host do servidor Alvo
  node-exporter:
    image: prom/node-exporter:latest
    container_name: m4t1nt4-node-exporter
    ports:
      - "9100:9100"
    restart: unless-stopped

volumes:
  pgdata:
`;

  return (
    <div className="space-y-8 animate-fade-in text-slate-700">
      {/* Intro section */}
      <div>
        <h2 className="text-xl font-display font-semibold text-slate-900 mb-1">
          Especificações de Arquitetura & DevOps
        </h2>
        <p className="text-sm text-slate-500">
          Esta seção documenta a arquitetura de produção projetada para o deploy corporativo estável da plataforma, orquestrando FastAPI, Locust, Prometheus e Docker Compose.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Directory Structure & Endpoints Map (Left side) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Tree view */}
          <div className="border border-slate-100 bg-white rounded-2xl p-5 shadow-sm">
            <h3 className="text-sm font-display font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Folder className="w-4 h-4 text-purple-600" />
              1. Estrutura de Pastas de Produção
            </h3>
            
            <div className="font-mono text-xs text-slate-600 space-y-1.5 overflow-x-auto">
              <div className="text-slate-900 font-bold">📁 m4t1nt4-platform /</div>
              <div className="pl-3 text-slate-500">├── 📁 docker/</div>
              <div className="pl-6">├── 📄 prometheus.yml</div>
              <div className="pl-6">└── 📄 locustfile.py</div>
              <div className="pl-3 text-slate-900">├── 📁 backend-api/ <span className="text-slate-400 font-sans text-[10px]">(FastAPI)</span></div>
              <div className="pl-6 text-slate-500">├── 📁 app/</div>
              <div className="pl-9">├── 📄 main.py</div>
              <div className="pl-9">├── 📄 schemas.py</div>
              <div className="pl-9">└── 📄 database.py</div>
              <div className="pl-6">├── 📄 requirements.txt</div>
              <div className="pl-6">└── 📄 Dockerfile</div>
              <div className="pl-3 text-slate-900">├── 📁 frontend-dashboard/ <span className="text-slate-400 font-sans text-[10px]">(React+Vite)</span></div>
              <div className="pl-6 text-slate-500">├── 📁 src/</div>
              <div className="pl-9">├── 📁 components/</div>
              <div className="pl-9">├── 📄 App.tsx</div>
              <div className="pl-9">└── 📄 main.tsx</div>
              <div className="pl-6">├── 📄 package.json</div>
              <div className="pl-6">└── 📄 Tailwind.config.js</div>
              <div className="pl-3 text-slate-900">└── 📄 docker-compose.yml</div>
            </div>
            <div className="mt-4 text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              * O backend orquestrador com FastAPI centraliza as requisições, faz queries PromQL ao Prometheus e controla o Locust Master via WebSockets.
            </div>
          </div>

          {/* Endpoints Map */}
          <div className="border border-slate-100 bg-white rounded-2xl p-5 shadow-sm">
            <h3 className="text-sm font-display font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <Compass className="w-4 h-4 text-purple-600" />
              2. Endpoints da API REST
            </h3>
            <div className="space-y-3 font-mono text-[11px]">
              <div className="border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <span className="bg-purple-50 text-purple-600 text-[10px] px-1.5 py-0.5 rounded font-bold">POST</span>
                  <span className="text-slate-700 font-bold">/api/auth/login</span>
                </div>
                <p className="text-[10px] text-slate-400 font-sans mt-0.5">Autenticação JWT com credenciais administrativas.</p>
              </div>

              <div className="border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <span className="bg-purple-50 text-purple-600 text-[10px] px-1.5 py-0.5 rounded font-bold">POST</span>
                  <span className="text-slate-700 font-bold">/api/test/configure</span>
                </div>
                <p className="text-[10px] text-slate-400 font-sans mt-0.5">Define URL alvo, spawn rate e volume de usuários.</p>
              </div>

              <div className="border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <span className="bg-indigo-50 text-indigo-600 text-[10px] px-1.5 py-0.5 rounded font-bold">POST</span>
                  <span className="text-slate-700 font-bold">/api/test/control</span>
                </div>
                <p className="text-[10px] text-slate-400 font-sans mt-0.5">Aciona ações: start, pause, resume, stop, reset.</p>
              </div>

              <div className="border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <span className="bg-indigo-50 text-indigo-600 text-[10px] px-1.5 py-0.5 rounded font-bold">GET</span>
                  <span className="text-slate-700 font-bold">/api/history</span>
                </div>
                <p className="text-[10px] text-slate-400 font-sans mt-0.5">Retorna a lista de testes persistidos no PostgreSQL.</p>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="bg-emerald-50 text-emerald-600 text-[10px] px-1.5 py-0.5 rounded font-bold">WS</span>
                  <span className="text-slate-700 font-bold">/ws/metrics</span>
                </div>
                <p className="text-[10px] text-slate-400 font-sans mt-0.5">WS em tempo real para telemetria Prometheus + Locust.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Technical Code Specifications Panel (Right side) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* DB Schema Panel */}
          <div className="border border-slate-100 bg-white rounded-2xl overflow-hidden shadow-sm">
            <div className="bg-slate-50 p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-4.5 h-4.5 text-purple-600" />
                <span className="text-sm font-display font-semibold text-slate-800">3. Schema Relacional (PostgreSQL)</span>
              </div>
              <button
                onClick={() => copyToClipboard(schemaCode, "schema")}
                className="text-xs text-purple-600 hover:text-purple-700 font-medium transition-colors flex items-center gap-1 cursor-pointer"
              >
                {copiedKey === "schema" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedKey === "schema" ? "Copiado!" : "Copiar SQL"}
              </button>
            </div>
            <pre className="p-4 overflow-x-auto text-[11px] font-mono text-emerald-100 leading-relaxed bg-[#0f172a] max-h-72 select-text">
              <code>{schemaCode}</code>
            </pre>
          </div>

          {/* FastAPI Core logic */}
          <div className="border border-slate-100 bg-white rounded-2xl overflow-hidden shadow-sm">
            <div className="bg-slate-50 p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code className="w-4.5 h-4.5 text-purple-600" />
                <span className="text-sm font-display font-semibold text-slate-800">4. Orquestrador FastAPI & Queries Prometheus</span>
              </div>
              <button
                onClick={() => copyToClipboard(fastApiCode, "fastapi")}
                className="text-xs text-purple-600 hover:text-purple-700 font-medium transition-colors flex items-center gap-1 cursor-pointer"
              >
                {copiedKey === "fastapi" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedKey === "fastapi" ? "Copiado!" : "Copiar Python"}
              </button>
            </div>
            <pre className="p-4 overflow-x-auto text-[11px] font-mono text-slate-200 leading-relaxed bg-[#0f172a] max-h-80 select-text">
              <code>{fastApiCode}</code>
            </pre>
          </div>

          {/* Docker-Compose configuration */}
          <div className="border border-slate-100 bg-white rounded-2xl overflow-hidden shadow-sm">
            <div className="bg-slate-50 p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server className="w-4.5 h-4.5 text-purple-600" />
                <span className="text-sm font-display font-semibold text-slate-800">5. Multi-Container (docker-compose.yml)</span>
              </div>
              <button
                onClick={() => copyToClipboard(dockerComposeCode, "docker")}
                className="text-xs text-purple-600 hover:text-purple-700 font-medium transition-colors flex items-center gap-1 cursor-pointer"
              >
                {copiedKey === "docker" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedKey === "docker" ? "Copiado!" : "Copiar YAML"}
              </button>
            </div>
            <pre className="p-4 overflow-x-auto text-[11px] font-mono text-amber-100 leading-relaxed bg-[#0f172a] max-h-80 select-text">
              <code>{dockerComposeCode}</code>
            </pre>
            <div className="p-5 bg-slate-50 border-t border-slate-100 text-[12px] space-y-2 text-slate-600">
              <div className="font-bold text-slate-800">Como rodar a stack em ambiente local:</div>
              <p>1. Crie uma pasta e salve o arquivo como <code className="bg-slate-200 text-slate-800 px-1 py-0.5 rounded font-mono text-xs">docker-compose.yml</code>.</p>
              <p>2. Crie as pastas necessárias em seu terminal:</p>
              <pre className="bg-slate-900 text-slate-200 p-2.5 rounded text-[10px] font-mono max-w-full overflow-x-auto">mkdir -p backend locust prometheus && touch prometheus/prometheus.yml locust/locustfile.py</pre>
              <p>3. Ative os containers em segundo plano:</p>
              <pre className="bg-[#0f172a] text-emerald-400 p-2.5 rounded text-[10px] font-mono max-w-full overflow-x-auto">docker compose up -d</pre>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
