/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { UserPreferences, AppProfile } from '../types';
import { CATEGORIES_EXPENSES } from '../utils';
import {
  User,
  Sliders,
  DollarSign,
  TrendingDown,
  Sparkles,
  Info,
  Layers,
  KeyRound,
  Coins,
  Smile,
  ShieldCheck,
  Trash2,
  Database,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Server,
  Code
} from 'lucide-react';
interface ProfileSelectorProps {
  currentProfile: AppProfile;
  profiles: AppProfile[];
  preferences: UserPreferences;
  onUpdatePreferences: (prefs: Partial<UserPreferences>) => void;
  onSwitchProfile: (profileId: string) => void;
  onCreateProfile: (name: string, isCloudSync: boolean) => void;
  onClearProfileData: () => void;
}

export default function ProfileSelector({
  currentProfile,
  profiles,
  preferences,
  onUpdatePreferences,
  onSwitchProfile,
  onCreateProfile,
  onClearProfileData,
}: ProfileSelectorProps) {
  // Local states
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileSync, setNewProfileSync] = useState(true);
  const [customPasscode, setCustomPasscode] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Form handling
  const handleCreateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProfileName.trim()) return alert('Insira um nome válido para o perfil!');
    
    // Create new profile with clean custom passcodes/IDs if configured
    onCreateProfile(newProfileName.trim(), true);
    setNewProfileName('');
    setShowCreate(false);
  };

  const handlePreferencesSubmit = (key: keyof UserPreferences, value: number | string) => {
    onUpdatePreferences({ [key]: value });
  };

  const handleCategoryLimitChange = (category: string, value: number) => {
    const currentLimits = preferences.categoryLimits || {};
    const updatedLimits = { ...currentLimits, [category]: value };
    onUpdatePreferences({ categoryLimits: updatedLimits });
  };
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 1. Profile Switcher Panel */}
        <div id="profile-switcher-panel" className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <User className="w-5 h-5 text-slate-600" />
              <h3 className="font-bold text-slate-900 tracking-tight text-sm">Perfis de Carteira</h3>
            </div>
            <p className="text-xs text-slate-550 leading-relaxed mb-4">
              Crie perfis segregados para gerenciar finanças diferentes (ex: Pessoal, Familiar, Projetos), sem misturar os lançamentos.
            </p>

            <div className="space-y-2 max-h-[160px] overflow-y-auto scrollbar-thin pr-1">
              {profiles.map((prof) => (
                <button
                  id={`btn-profile-item-${prof.id}`}
                  key={prof.id}
                  onClick={() => onSwitchProfile(prof.id)}
                  className={`w-full px-4 py-3 rounded-xl text-xs font-semibold text-left transition-all duration-150 flex items-center justify-between cursor-pointer ${
                    currentProfile.id === prof.id
                      ? 'bg-[#0F172A] text-white shadow-xs'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="truncate">{prof.name}</span>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                    currentProfile.id === prof.id
                      ? 'bg-slate-800 text-slate-200'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {currentProfile.id === prof.id ? 'Ativo' : 'Nuvem'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 border-t border-slate-150 pt-4">
            {!showCreate ? (
              <button
                id="btn-trigger-new-profile"
                onClick={() => setShowCreate(true)}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-xl text-xs cursor-pointer text-center"
              >
                + Criar Outro Perfil / Carteira
              </button>
            ) : (
              <form onSubmit={handleCreateProfile} className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1">
                    Nome do Perfil
                  </label>
                  <input
                    id="new-profile-input-name"
                    type="text"
                    required
                    placeholder="Ex: Minhas Viagens, Casa, etc."
                    value={newProfileName}
                    onChange={(e) => setNewProfileName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-slate-800 focus:bg-white animate-fadeIn"
                  />
                </div>

                <div className="flex gap-2 text-xs">
                  <button
                    id="btn-new-profile-cancel"
                    type="button"
                    onClick={() => setShowCreate(false)}
                    className="flex-1 bg-white border border-slate-200 text-slate-600 py-1.5 rounded-lg font-medium cursor-pointer"
                  >
                    Voltar
                  </button>
                  <button
                    id="btn-new-profile-create"
                    type="submit"
                    className="flex-1 bg-[#0F172A] hover:bg-slate-800 text-white py-1.5 rounded-lg font-bold cursor-pointer"
                  >
                    Criar
                  </button>
                </div>
              </form>
            )}

            {showClearConfirm ? (
              <div id="clear-data-confirmation-box" className="mt-3 p-3 bg-rose-50 rounded-xl border border-rose-200/50 space-y-2 animate-fadeIn text-[11px]">
                <p className="text-rose-800 font-bold text-center">Tem certeza? Isso apagará todos os lançamentos, despesas e investimentos desta carteira para sempre!</p>
                <div className="flex gap-2">
                  <button
                    id="btn-confirm-clear"
                    onClick={() => {
                      onClearProfileData();
                      setShowClearConfirm(false);
                    }}
                    className="flex-1 bg-rose-600 hover:bg-rose-700 text-white py-1.5 rounded-lg font-bold cursor-pointer text-center text-[10px]"
                  >
                    Sim, Excluir Tudo!
                  </button>
                  <button
                    id="btn-cancel-clear"
                    onClick={() => setShowClearConfirm(false)}
                    className="flex-1 bg-slate-150 hover:bg-slate-200 text-slate-700 py-1.5 rounded-lg font-bold cursor-pointer text-center text-[10px]"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <button
                id="btn-delete-all-profile-data"
                onClick={() => setShowClearConfirm(true)}
                className="mt-3 w-full bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold py-2.5 rounded-xl text-[11px] cursor-pointer flex items-center justify-center gap-2 border border-rose-200/50 transition-all active:scale-95 shadow-2xs"
              >
                <Trash2 className="w-3.5 h-3.5 shrink-0" />
                Excluir Dados Permanente (Lixeira)
              </button>
            )}
          </div>
        </div>

        {/* 2. Visual Preference & Limit Configuration */}
        <div id="visual-limits-panel" className="bg-white rounded-2xl border border-slate-200 p-6 lg:col-span-2 space-y-5 shadow-xs">
          <div className="flex items-center gap-2 border-b border-slate-150 pb-3 mb-2">
            <Sliders className="w-5 h-5 text-slate-600" />
            <h3 className="font-bold text-slate-9 tracking-tight text-base">Configurações & Metas Mensais</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Currency settings */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Moeda Base de Exibição
              </label>
              <div className="flex gap-2">
                {[
                  { label: 'Real (R$ - BRL)', val: 'BRL' },
                  { label: 'Dólar ($ - USD)', val: 'USD' },
                  { label: 'Euro (€ - EUR)', val: 'EUR' }
                ].map((item) => (
                  <button
                    id={`btn-currency-${item.val}`}
                    key={item.val}
                    onClick={() => handlePreferencesSubmit('currency', item.val)}
                    className={`flex-1 py-12 rounded-xl text-xs font-semibold border cursor-pointer transition-all ${
                      preferences.currency === item.val
                        ? 'border-slate-800 bg-slate-100 text-slate-900 font-bold'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {item.label.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Target Monthly Income */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Objetivo de Ganho Mensal ({preferences.currency})</span>
                <span className="text-[10px] text-emerald-600 font-semibold">Meta de Entradas</span>
              </label>
              <div className="relative">
                <input
                  id="pref-input-gain"
                  type="number"
                  step="100"
                  value={preferences.monthlyIncomeGoal}
                  onChange={(e) => handlePreferencesSubmit('monthlyIncomeGoal', parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 focus:bg-white text-xs rounded-xl pl-9 pr-4 py-2.5 text-slate-800 outline-none transition-all font-mono"
                />
                <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Maximum Expense limit */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Teto Máximo de Gastos ({preferences.currency})</span>
                <span className="text-[10px] text-rose-500 font-semibold">Limite de Despesa</span>
              </label>
              <div className="relative">
                <input
                  id="pref-input-limit"
                  type="number"
                  step="100"
                  value={preferences.monthlyExpenseLimit}
                  onChange={(e) => handlePreferencesSubmit('monthlyExpenseLimit', parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 focus:bg-white text-xs rounded-xl pl-9 pr-4 py-2.5 text-slate-800 outline-none transition-all font-mono"
                />
                <TrendingDown className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Savings Goal */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Meta de Investimento / Poupança ({preferences.currency})</span>
                <span className="text-[10px] text-blue-500 font-semibold">Investimento Mensal</span>
              </label>
              <div className="relative">
                <input
                  id="pref-input-savings"
                  type="number"
                  step="100"
                  value={preferences.savingsGoal}
                  onChange={(e) => handlePreferencesSubmit('savingsGoal', parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 focus:bg-white text-xs rounded-xl pl-9 pr-4 py-2.5 text-slate-800 outline-none transition-all font-mono"
                />
                <Coins className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          </div>

          {/* New Category Specific Expense Limits */}
          <div className="border-t border-slate-150 pt-5 mt-5">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-slate-650" />
              Definir Limites por Categoria ({preferences.currency})
            </h4>
            <p className="text-[11px] text-slate-500 mb-4 leading-relaxed">
              Monitore de forma assertiva seus gastos. Alertas discretos te avisarão ao se aproximar de 80% ou ultrapassar 100% de cada teto abaixo.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {CATEGORIES_EXPENSES.map((cat) => {
                const limitsObject = preferences.categoryLimits || {};
                const currentLimitValue = limitsObject[cat] || '';
                
                return (
                  <div key={cat} className="space-y-1 bg-slate-50/50 p-3 rounded-xl border border-slate-150/60">
                    <label id={`label-limit-${cat}`} className="block text-[11px] font-bold text-slate-650 truncate">
                      {cat}
                    </label>
                    <div className="relative">
                      <input
                        id={`input-limit-${cat}`}
                        type="number"
                        placeholder="Sem limite"
                        min="0"
                        value={currentLimitValue}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          handleCategoryLimitChange(cat, isNaN(val) ? 0 : val);
                        }}
                        className="w-full bg-white border border-slate-200 focus:border-slate-800 text-xs rounded-lg pl-8 pr-2.5 py-1.5 text-slate-800 outline-none font-mono"
                      />
                      <DollarSign className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Privacy Information Banner */}
      <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 flex flex-col sm:flex-row items-start gap-4 shadow-xs">
        <div className="p-3 bg-white text-slate-750 border border-slate-150 rounded-xl shrink-0 shadow-xs">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div>
          <h4 className="font-bold text-slate-900 text-sm">Privacidade Total de Conta Bancária Garantida</h4>
          <p className="text-xs text-slate-605 mt-1 leading-relaxed">
            Nós acreditamos na autonomia financeira consciente. Este organizador foi construído de modo que você preenche
            manualmente seus créditos e débitos, eliminando qualquer necessidade de conectar APIs bancárias, expor tokens de contas
            ou vincular chaves PIX. Suas informações não podem ser compartilhadas ou monitoradas por instituições comerciais externas.
          </p>
          <div className="mt-2.5 flex items-center gap-1 text-[10px] font-bold text-slate-800">
            <Smile className="w-3.5 h-3.5 text-emerald-600" />
            <span>Seu bolso seguro, seus dados totalmente privados!</span>
          </div>
        </div>
      </div>
    </div>
  );
}
