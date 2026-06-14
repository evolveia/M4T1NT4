import React, { useState } from "react";
import { Lock, Mail, ServerCrash, Key, ShieldCheck, Cpu } from "lucide-react";
import { AuthUser } from "../types";

interface LoginProps {
  onLoginSuccess: (token: string, user: AuthUser) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [email, setEmail] = useState("evolve.eia@gmail.com");
  const [password, setPassword] = useState("S@nb4f6e");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await response.json();

        if (response.ok && data.success) {
          // Successful login
          localStorage.setItem("m4t1nt4_token", data.token);
          localStorage.setItem("m4t1nt4_user", JSON.stringify(data.user));
          onLoginSuccess(data.token, data.user);
        } else {
          setError(data.message || "Credenciais incompatíveis para este ambiente.");
        }
      } else {
        const text = await response.text();
        console.error("Non-JSON API response:", text);
        setError(`Resposta da API inválida (${response.status}). Detalhes no console de logs.`);
      }
    } catch (err: any) {
      console.error("Network error during login request:", err);
      setError(`Erro de conexão com o painel (${err.message || err.toString()}). Verifique a integridade do servidor.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f4f6fa] p-4 relative overflow-hidden font-sans">
      
      {/* Decorative corporate layout details */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-40 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_70%,transparent_100%)]" />

      {/* Corporate soft color accent rings */}
      <div className="absolute top-[10%] left-[10%] w-96 h-96 bg-purple-200/50 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[10%] w-96 h-96 bg-indigo-100/50 rounded-full blur-[80px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 bg-purple-600 rounded-2xl flex items-center justify-center mb-3 shadow-[0_4px_20px_rgba(124,58,237,0.25)]">
            <Cpu className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-display font-medium text-slate-900 tracking-tight">
            M4T1NT4<span className="text-purple-600 font-extrabold text-sm relative -top-3">.io</span>
          </h1>
          <p className="text-xs text-slate-500 uppercase tracking-wider mt-1 font-mono">
            Load Testing & DoS Simulation
          </p>
        </div>

        {/* Login Box */}
        <div className="border border-slate-100 bg-white/95 p-8 rounded-2xl shadow-xl backdrop-blur-sm">
          <div className="mb-6">
            <h2 className="text-xl font-display font-semibold text-slate-800">Acesse o Portal</h2>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              Ambiente de controle ativo com credenciais fornecidas abaixo
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600 flex items-start gap-2.5 animate-pulse">
              <ServerCrash className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-mono font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                E-mail Administrativo
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-purple-500 focus:bg-white font-sans transition-all"
                  placeholder="exemplo@email.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-mono font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Chave de Acesso (Senha)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-purple-500 focus:bg-white font-mono tracking-widest transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <div className="flex items-center gap-1.5 text-slate-500 font-mono text-[10px]">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>JWT Integrado</span>
              </div>
              <span className="text-slate-400 cursor-not-allowed font-sans select-none hover:text-slate-500 transition-colors">
                Esqueceu a chave?
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white font-sans font-medium rounded-xl text-xs shadow-md shadow-purple-200 hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Key className="w-4 h-4" />
                  <span>Autenticar Operador</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer info lockups */}
        <div className="flex justify-between items-center px-4 mt-6 text-[10px] font-mono text-slate-400">
          <span>PORT INGRESS: 3000</span>
          <span>SYSTEM ACCEL: SECURE</span>
        </div>
      </div>
    </div>
  );
}
