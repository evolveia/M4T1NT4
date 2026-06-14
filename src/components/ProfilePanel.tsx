import React from "react";
import { Sliders, Shield } from "lucide-react";
import { UserProfile, AuthUser } from "../types";

// Inline SettingsIcon to keep it isolated and responsive
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

interface ProfilePanelProps {
  profile: UserProfile | null;
  loadingProfile: boolean;
  user: AuthUser;
  profileMessage: string | null;
  profileError: string | null;
  onUpdateProfile: (updatedFields: Partial<UserProfile>) => Promise<void>;
  getAvatarBgClass: (colorName?: string) => string;
}

export default function ProfilePanel({
  profile,
  loadingProfile,
  user,
  profileMessage,
  profileError,
  onUpdateProfile,
  getAvatarBgClass
}: ProfilePanelProps) {
  return (
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
            <div className="w-full text-left font-sans">
              <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-2.5 text-center lg:text-left">
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
                    type="button"
                    onClick={() => onUpdateProfile({ avatarBg: item.key })}
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
              <div className="flex items-center gap-2 mb-1.5 font-bold text-slate-700">
                <Sliders className="w-3.5 h-3.5 text-purple-600" />
                <span>Controles de Banda Ativos</span>
              </div>
              <span>Simulações de Carga DoS limitadas a </span>
              <strong className="text-purple-600 font-bold">{profile?.concurrencyLimit || 1000} conexões/seg</strong>
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
                onUpdateProfile({
                  name: formData.get("name") as string,
                  email: formData.get("email") as string,
                  defaultSpawnRate: Number(formData.get("spawnRate")),
                  defaultDuration: Number(formData.get("duration")),
                  prometheusUrl: formData.get("prometheusUrl") as string,
                  notificationsEnabled: formData.get("notificationsEnabled") === "true"
                });
              }}
              className="space-y-4 text-xs font-sans"
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
                    defaultValue={profile?.defaultDuration || 60}
                    className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono focus:outline-none focus:border-purple-500 focus:bg-white transition-all shadow-inner"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Limite Limiar de Concorrência
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
                      defaultChecked={profile?.notificationsEnabled !== false}
                      className="accent-purple-600"
                    />
                    <span>Ativar Alertas Push & Banner</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                    <input
                      type="radio"
                      name="notificationsEnabled"
                      value="false"
                      defaultChecked={profile?.notificationsEnabled === false}
                      className="accent-purple-600"
                    />
                    <span>Silenciar Alertas Visuais</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl transition-all shadow-md shadow-purple-100 flex items-center gap-2 cursor-pointer text-xs"
                >
                  Salvar Preferências
                </button>
              </div>

            </form>
          </div>

        </div>
      )}

    </div>
  );
}
