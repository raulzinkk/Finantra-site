/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  AppProfile,
  Transaction,
  MonthlyBill,
  Investment,
  UserPreferences,
  SupabaseStatus
} from './types';
import {
  SEED_TRANSACTIONS,
  SEED_BILLS,
  SEED_INVESTMENTS
} from './utils';
import {
  testConnection,
  fetchTransactions,
  upsertTransaction,
  deleteTransactionFromDb,
  fetchMonthlyBills,
  upsertMonthlyBill,
  deleteMonthlyBillFromDb,
  fetchInvestments,
  upsertInvestment,
  deleteInvestmentFromDb
} from './supabaseService';

// Subcomponents
import DatabaseStatus from './components/DatabaseStatus';
import FinanceSummary from './components/FinanceSummary';
import TransactionsTab from './components/TransactionsTab';
import MonthlyBillsTab from './components/MonthlyBillsTab';
import InvestmentsTab from './components/InvestmentsTab';
import ProfileSelector from './components/ProfileSelector';
import AuthTab from './components/AuthTab';
import PresentationLanding from './components/PresentationLanding';

// Icons
import {
  LayoutDashboard,
  ArrowRightLeft,
  CalendarCheck2,
  TrendingUp,
  Settings,
  ShieldCheck,
  CloudLightning,
  CloudCheck,
  HelpCircle,
  Lightbulb,
  X,
  RefreshCw,
  Wallet,
  LogIn,
  Sun,
  Moon
} from 'lucide-react';

const TIPS = [
  "A regra dos 50/30/20 indica: 50% de ganhos para necessidades, 30% desejos pessoais e 20% guardados ou investidos.",
  "Tenha uma Reserva de Emergência equivalendo a pelo menos 6 meses das suas despesas básicas mensais estruturadas.",
  "Evite comprar parcelado itens de consumo imediato. Se não cabe no seu orçamento hoje, melhor adiar e pagar à vista.",
  "Revise as assinaturas ativas mensalmente. Serviços que você não utiliza drenam discretamente seu saldo poupador.",
  "A inflação corrói o poder de compra do dinheiro físico. Aplique suas reservas para obter rendimentos reais.",
  "Antes de fazer uma compra maior, aguarde 24 horas. Muitas vezes a necessidade passa e era apenas desejo momentâneo."
];

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'bills' | 'investments' | 'config' | 'auth'>('dashboard');

  // Core States
  const [profiles, setProfiles] = useState<AppProfile[]>([]);
  const [currentProfileId, setCurrentProfileId] = useState<string>('');
  const [loggedInUser, setLoggedInUser] = useState<string | null>(null);
  const [landingMode, setLandingMode] = useState<'presentation' | 'auth_login' | 'auth_register'>('presentation');
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [monthlyBills, setMonthlyBills] = useState<MonthlyBill[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);

  const [preferences, setPreferences] = useState<UserPreferences>({
    currency: 'BRL',
    monthlyIncomeGoal: 6500,
    monthlyExpenseLimit: 3500,
    savingsGoal: 1500
  });

  // DB Sync Status
  const [dbStatus, setDbStatus] = useState<SupabaseStatus>({
    isConnected: true,
    isSynced: true
  });

  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [showTip, setShowTip] = useState<boolean>(true);
  const [tipIndex, setTipIndex] = useState<number>(0);

  // Force light mode theme
  const theme = 'light';

  useEffect(() => {
    document.body.classList.remove('dark');
    document.documentElement.classList.remove('dark');
    localStorage.setItem('finantra_theme', 'light');
  }, []);

  // Computed Current Profile
  const currentProfile = useMemo(() => {
    const found = profiles.find(p => p.id === currentProfileId);
    if (found) {
      return { ...found, isCloudSync: true };
    }
    return {
      id: 'p-default',
      name: 'Minha Carteira',
      isCloudSync: true
    };
  }, [profiles, currentProfileId]);

  // Load Tip on first run
  useEffect(() => {
    setTipIndex(Math.floor(Math.random() * TIPS.length));
  }, []);

  // 1. Initial Session Restoration
  useEffect(() => {
    const keepLogged = localStorage.getItem('finantra_keep_logged_in') === 'true';
    const savedEmail = localStorage.getItem('finantra_saved_user_email');
    if (keepLogged && savedEmail) {
      setLoggedInUser(savedEmail.toLowerCase());
    } else {
      // Load public / guest profile configurations
      const storedActiveId = localStorage.getItem('fin_active_id') || 'p-default';
      setCurrentProfileId(storedActiveId);

      const storedProfilesStr = localStorage.getItem('fin_profiles');
      let loadedProfiles: AppProfile[] = [];
      if (storedProfilesStr) {
        try { loadedProfiles = JSON.parse(storedProfilesStr); } catch { loadedProfiles = []; }
      }
      if (loadedProfiles.length === 0) {
        loadedProfiles = [
          { id: 'p-default', name: 'Minha Carteira', isCloudSync: true }
        ];
        localStorage.setItem('fin_profiles', JSON.stringify(loadedProfiles));
      }
      setProfiles(loadedProfiles);

      const storedPrefs = localStorage.getItem('fin_preferences');
      if (storedPrefs) {
        try { setPreferences(JSON.parse(storedPrefs)); } catch {}
      }
    }
  }, []);

  // 1.5. Dynamic User Data Isolation Switcher
  useEffect(() => {
    if (loggedInUser) {
      const safeKey = loggedInUser.toLowerCase().replace(/[^a-zA-Z0-9]/g, '_');
      
      const storedProfilesStr = localStorage.getItem(`fin_profiles_${safeKey}`);
      let loadedProfiles: AppProfile[] = [];
      if (storedProfilesStr) {
        try { loadedProfiles = JSON.parse(storedProfilesStr); } catch { loadedProfiles = []; }
      }

      if (loadedProfiles.length === 0) {
        loadedProfiles = [
          { id: `p-${safeKey}`, name: `Minha Carteira • ${loggedInUser.split('@')[0]}`, isCloudSync: true }
        ];
        localStorage.setItem(`fin_profiles_${safeKey}`, JSON.stringify(loadedProfiles));
      }
      setProfiles(loadedProfiles);

      const storedActiveId = localStorage.getItem(`fin_active_id_${safeKey}`) || `p-${safeKey}`;
      setCurrentProfileId(storedActiveId);

      const storedPrefs = localStorage.getItem(`fin_preferences_${safeKey}`);
      if (storedPrefs) {
        try { setPreferences(JSON.parse(storedPrefs)); } catch {}
      } else {
        setPreferences({
          currency: 'BRL',
          monthlyIncomeGoal: 5000,
          monthlyExpenseLimit: 3000,
          savingsGoal: 1000,
          categoryLimits: {}
        });
      }
    }
  }, [loggedInUser]);

  // Sync / Load data when current profile OR sync state changes
  const loadProfileData = useCallback(async (profId: string, isCloud: boolean) => {
    if (!profId) return;
    setIsSyncing(true);

    // A. Always load from LocalStorage first to guarantee visual speed and offline survival
    const localT = localStorage.getItem(`fin_trans_${profId}`);
    const localB = localStorage.getItem(`fin_bills_${profId}`);
    const localI = localStorage.getItem(`fin_invests_${profId}`);

    let transList: Transaction[] = localT ? JSON.parse(localT) : [];
    let billsList: MonthlyBill[] = localB ? JSON.parse(localB) : [];
    let investsList: Investment[] = localI ? JSON.parse(localI) : [];

    // Filter out previous seed/mock data elements containing hyphens in ID (e.g. t-1, b-1, i-1)
    transList = transList.filter(t => t && t.id && !t.id.includes('-'));
    billsList = billsList.filter(b => b && b.id && !b.id.includes('-'));
    investsList = investsList.filter(i => i && i.id && !i.id.includes('-'));

    // If completely new local profile with no data, seed with realistic mock values
    const freshProfileVisit = !localT && !localB && !localI;
    if (freshProfileVisit) {
      // If we have a loggedInUser, start completely empty! Mostre apenas o que o usuário colocou
      if (loggedInUser && loggedInUser !== 'convidado@finantra.com') {
        transList = [];
        billsList = [];
        investsList = [];
      } else {
        transList = SEED_TRANSACTIONS(profId);
        billsList = SEED_BILLS(profId);
        investsList = SEED_INVESTMENTS(profId);
      }
      
      // Save newly seeded values locally
      localStorage.setItem(`fin_trans_${profId}`, JSON.stringify(transList));
      localStorage.setItem(`fin_bills_${profId}`, JSON.stringify(billsList));
      localStorage.setItem(`fin_invests_${profId}`, JSON.stringify(investsList));
    }

    setTransactions(transList);
    setMonthlyBills(billsList);
    setInvestments(investsList);

    // B. If Cloud Sync enabled, try to fetch from Supabase
    if (isCloud) {
      const isConnected = await testConnection();
      if (isConnected) {
        // Fetch tables
        const remoteT = await fetchTransactions(profId);
        const remoteB = await fetchMonthlyBills(profId);
        const remoteI = await fetchInvestments(profId);

        if (remoteT !== null && remoteB !== null && remoteI !== null) {
          // Success! Sync our state
          setTransactions(remoteT);
          setMonthlyBills(remoteB);
          setInvestments(remoteI);

          // Overwrite local copy with up-to-date cloud copy
          localStorage.setItem(`fin_trans_${profId}`, JSON.stringify(remoteT));
          localStorage.setItem(`fin_bills_${profId}`, JSON.stringify(remoteB));
          localStorage.setItem(`fin_invests_${profId}`, JSON.stringify(remoteI));

          setDbStatus({ isConnected: true, isSynced: true });
        } else {
          // Failure fetching tables, supabase exists but schema is probably missing
          setDbStatus({ isConnected: false, isSynced: false, errorMsg: 'Tabelas do banco não encontradas ou desconfiguradas.' });
        }
      } else {
        // Connection offline or backend unprovisioned 
        setDbStatus({ isConnected: false, isSynced: false, errorMsg: 'Falha ao conectar na API da Nuvem Online Finantra.' });
      }
    } else {
      setDbStatus({ isConnected: false, isSynced: false });
    }

    setIsSyncing(false);
  }, []);

  // Monitor Profile activation switches
  useEffect(() => {
    if (currentProfileId) {
      loadProfileData(currentProfileId, true);
    }
  }, [currentProfileId, loadProfileData]);

  // Method to check connections programmatically
  const verifySupabaseConnection = async () => {
    setIsSyncing(true);
    const alive = await testConnection();
    if (alive) {
      setDbStatus({ isConnected: true, isSynced: true });
      await loadProfileData(currentProfileId, true);
    } else {
      setDbStatus({ isConnected: false, isSynced: false, errorMsg: 'Sem resposta do banco de dados.' });
    }
    setIsSyncing(false);
  };

  // Toggle cloud sync parameter on the active profile
  const handleToggleSync = (isSyncEnabled: boolean) => {
    const updated = profiles.map(p => {
      if (p.id === currentProfileId) {
        return { ...p, isCloudSync: isSyncEnabled };
      }
      return p;
    });
    setProfiles(updated);
    localStorage.setItem('fin_profiles', JSON.stringify(updated));
    
    if (isSyncEnabled) {
      loadProfileData(currentProfileId, true);
    } else {
      setDbStatus({ isConnected: false, isSynced: false });
    }
  };

  // WRITE OPERATIONS
  
  // A. Transactions
  const handleAddTransaction = async (newT: Omit<Transaction, 'id' | 'profileId'>) => {
    const transObj: Transaction = {
      ...newT,
      id: `t_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      profileId: currentProfileId
    };

    const updated = [transObj, ...transactions];
    setTransactions(updated);
    localStorage.setItem(`fin_trans_${currentProfileId}`, JSON.stringify(updated));

    if (currentProfile.isCloudSync) {
      await upsertTransaction(transObj);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    const updated = transactions.filter(t => t.id !== id);
    setTransactions(updated);
    localStorage.setItem(`fin_trans_${currentProfileId}`, JSON.stringify(updated));

    if (currentProfile.isCloudSync) {
      await deleteTransactionFromDb(id);
    }
  };

  // B. Monthly Bills
  const handleAddBill = async (newB: Omit<MonthlyBill, 'id' | 'profileId'>) => {
    const billObj: MonthlyBill = {
      ...newB,
      id: `b_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      profileId: currentProfileId
    };

    const updated = [...monthlyBills, billObj];
    setMonthlyBills(updated);
    localStorage.setItem(`fin_bills_${currentProfileId}`, JSON.stringify(updated));

    if (currentProfile.isCloudSync) {
      await upsertMonthlyBill(billObj);
    }
  };

  const handleToggleBillStatus = async (id: string, isPaid: boolean) => {
    const updated = monthlyBills.map(b => {
      if (b.id === id) {
        const mod = { ...b, isPaid };
        // Sync modified bill to Cloud
        if (currentProfile.isCloudSync) {
          upsertMonthlyBill(mod);
        }
        return mod;
      }
      return b;
    });

    setMonthlyBills(updated);
    localStorage.setItem(`fin_bills_${currentProfileId}`, JSON.stringify(updated));
  };

  const handleDeleteBill = async (id: string) => {
    const updated = monthlyBills.filter(b => b.id !== id);
    setMonthlyBills(updated);
    localStorage.setItem(`fin_bills_${currentProfileId}`, JSON.stringify(updated));

    if (currentProfile.isCloudSync) {
      await deleteMonthlyBillFromDb(id);
    }
  };

  // C. Investments
  const handleAddInvestment = async (newI: Omit<Investment, 'id' | 'profileId'>) => {
    const investObj: Investment = {
      ...newI,
      id: `i_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      profileId: currentProfileId
    };

    const updated = [...investments, investObj];
    setInvestments(updated);
    localStorage.setItem(`fin_invests_${currentProfileId}`, JSON.stringify(updated));

    if (currentProfile.isCloudSync) {
      await upsertInvestment(investObj);
    }
  };

  const handleUpdateInvestmentValue = async (id: string, newAmount: number) => {
    const updated = investments.map(i => {
      if (i.id === id) {
        const mod = { ...i, currentAmount: newAmount };
        if (currentProfile.isCloudSync) {
          upsertInvestment(mod);
        }
        return mod;
      }
      return i;
    });

    setInvestments(updated);
    localStorage.setItem(`fin_invests_${currentProfileId}`, JSON.stringify(updated));
  };

  const handleDeleteInvestment = async (id: string) => {
    const updated = investments.filter(i => i.id !== id);
    setInvestments(updated);
    localStorage.setItem(`fin_invests_${currentProfileId}`, JSON.stringify(updated));

    if (currentProfile.isCloudSync) {
      await deleteInvestmentFromDb(id);
    }
  };

  // D. Profile Setup
  const handleCreateProfile = (name: string, isCloudSync: boolean) => {
    const newId = `p_${Date.now()}`;
    const newProf: AppProfile = { id: newId, name, isCloudSync };
    const updatedProfiles = [...profiles, newProf];
    
    setProfiles(updatedProfiles);
    const safeKey = loggedInUser ? loggedInUser.toLowerCase().replace(/[^a-zA-Z0-9]/g, '_') : 'default';
    localStorage.setItem(loggedInUser ? `fin_profiles_${safeKey}` : 'fin_profiles', JSON.stringify(updatedProfiles));
    
    setCurrentProfileId(newId);
    localStorage.setItem(loggedInUser ? `fin_active_id_${safeKey}` : 'fin_active_id', newId);
    
    setActiveTab('config');
  };

  const handleClearProfileData = useCallback(async () => {
    // Zero native confirms needed here because ProfileSelector bereits has a perfect, non-blocking 2-stage visual confirm flow!
    setTransactions([]);
    setMonthlyBills([]);
    setInvestments([]);

    // To prevent re-seeding mockup data, write empty array strings instead of deleting keys!
    localStorage.setItem(`fin_trans_${currentProfileId}`, '[]');
    localStorage.setItem(`fin_bills_${currentProfileId}`, '[]');
    localStorage.setItem(`fin_invests_${currentProfileId}`, '[]');

    try {
      // Delete old records sequentially in case cloud is active
      for (const t of transactions) {
        await deleteTransactionFromDb(t.id);
      }
      for (const b of monthlyBills) {
        await deleteMonthlyBillFromDb(b.id);
      }
      for (const i of investments) {
        await deleteInvestmentFromDb(i.id);
      }
    } catch (e) {
      console.warn("Could not delete from DB:", e);
    }
  }, [currentProfileId, transactions, monthlyBills, investments]);

  const handleSwitchProfile = (id: string) => {
    setCurrentProfileId(id);
    const safeKey = loggedInUser ? loggedInUser.toLowerCase().replace(/[^a-zA-Z0-9]/g, '_') : 'default';
    localStorage.setItem(loggedInUser ? `fin_active_id_${safeKey}` : 'fin_active_id', id);
  };

  const handleUpdatePreferences = (updatedPref: Partial<UserPreferences>) => {
    const newPref = { ...preferences, ...updatedPref };
    setPreferences(newPref);
    const safeKey = loggedInUser ? loggedInUser.toLowerCase().replace(/[^a-zA-Z0-9]/g, '_') : 'default';
    localStorage.setItem(loggedInUser ? `fin_preferences_${safeKey}` : 'fin_preferences', JSON.stringify(newPref));
  };

  return (
    <>
      {!loggedInUser ? (
        <div className="min-h-screen bg-[#F8FAFC] text-[#1E293B] flex flex-col font-sans transition-colors antialiased selection:bg-indigo-100 animate-scaleUp">
          {/* Landing Top Header */}
          <header className="bg-white border-b border-slate-200/80 px-6 py-4 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <div className="bg-[#0F172A] p-2 rounded-xl text-white">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-extrabold text-[#0F172A] tracking-tighter text-lg leading-tight">FINANTRA</h1>
                <p className="text-[10px] text-slate-450 font-medium">Controle Financeiro Autônomo</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {landingMode !== 'presentation' ? (
                <button
                  onClick={() => setLandingMode('presentation')}
                  className="px-4 py-2 text-xs font-bold text-indigo-600 hover:text-indigo-850 transition-colors uppercase tracking-wider cursor-pointer"
                >
                  ← Apresentação
                </button>
              ) : (
                <button
                  onClick={() => setLandingMode('auth_login')}
                  className="px-4 py-2 bg-[#0F172A] hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-all cursor-pointer"
                >
                  Entrar
                </button>
              )}
            </div>
          </header>

          {/* Content Body */}
          <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 md:p-8 flex flex-col justify-center">
            {landingMode === 'presentation' ? (
              <PresentationLanding
                onProceedToAuth={(mode) => {
                  setLandingMode(mode === 'register' ? 'auth_register' : 'auth_login');
                }}
              />
            ) : (
              <div className="space-y-6 max-w-lg mx-auto w-full py-6 animate-fadeIn">
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-extrabold text-slate-950 tracking-tight">
                    {landingMode === 'auth_register' ? 'Abra sua Conta Segura' : 'Faça Logon Seguramente'}
                  </h2>
                  <p className="text-xs text-slate-550 max-w-xs mx-auto leading-relaxed">
                    Sem taxas temporárias, cadastros complexos ou perda de privacidade. Sua soberania financeira.
                  </p>
                </div>

                <AuthTab
                  loggedInUser={loggedInUser}
                  initialMode={landingMode === 'auth_register' ? 'register' : 'login'}
                  onLogin={(email) => {
                    setLoggedInUser(email);
                    setActiveTab('dashboard');
                  }}
                  onLogout={() => {
                    setLoggedInUser(null);
                  }}
                />
              </div>
            )}
          </div>

          {/* Footer */}
          <footer className="bg-white border-t border-slate-150 py-6 text-center text-xs text-slate-450 mt-auto">
            <div className="max-w-4xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-3">
              <p>© 2026 Finantra • Software Próprio de Controle Manual Independente.</p>
              <div className="flex gap-4 font-bold text-[11px] text-slate-400">
                <span>Privacidade Assegurada</span>
                <span>•</span>
                <span>Nuvem Online Finantra</span>
              </div>
            </div>
          </footer>
        </div>
      ) : (
        <div className="min-h-screen bg-[#F1F5F9] text-[#1E293B] flex flex-col font-sans transition-colors antialiased selection:bg-slate-300 animate-fadeIn">
          
          {/* 1. Header Banner & Branding Workspace */}
          <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-8 py-3.5 flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-[#0F172A] p-2.5 rounded-xl text-white shadow-sm">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-extrabold text-[#0F172A] tracking-tighter text-lg sm:text-xl">FINANTRA</h1>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <ShieldCheck className="w-3" /> Privado
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium font-sans">Controle total manual de receitas, despesas, teto de gastos e investimentos.</p>
              </div>
            </div>

            {/* User profile selection fast header bubble */}
            <div className="flex items-center gap-3 flex-wrap">
              {loggedInUser && (
                <div id="header-user-badge" className="bg-slate-900 text-white text-[10px] font-extrabold px-3 py-1.5 rounded-xl border border-slate-800 flex items-center gap-2" title={`Conectado como ${loggedInUser}`}>
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></span>
                  <span className="truncate max-w-[130px] font-mono text-[9px] uppercase tracking-wider">{loggedInUser.split('@')[0]}</span>
                </div>
              )}

              <div className="bg-slate-50 text-[11px] text-slate-700 font-bold px-3.5 py-1.5 rounded-xl border border-slate-200/50 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Perfil: <strong className="text-slate-950 font-extrabold">{currentProfile.name}</strong></span>
              </div>

              {currentProfile.isCloudSync ? (
                dbStatus.isConnected ? (
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-3 py-1.5 rounded-xl border border-emerald-100 flex items-center gap-1">
                    <CloudCheck className="w-3.5 h-3.5" /> Nuvem Sincronizada
                  </span>
                ) : (
                  <span className="text-[10px] bg-amber-50 text-amber-700 font-bold px-3 py-1.5 rounded-xl border border-amber-100 flex items-center gap-1">
                    <CloudLightning className="w-3.5 h-3.5" /> Nuvem Desconectada
                  </span>
                )
              ) : (
                <span className="text-[10px] bg-sky-50 text-sky-700 font-bold px-3 py-1.5 rounded-xl border border-sky-100 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Modo Local (100% Offline)
                </span>
              )}

              {currentProfile.isCloudSync && (
                <button
                   id="btn-header-sync"
                   onClick={() => loadProfileData(currentProfileId, true)}
                   disabled={isSyncing}
                   className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 border border-slate-200 cursor-pointer active:rotate-45 transition-transform"
                   title="Sincronizar agora"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-slate-800' : ''}`} />
                </button>
              )}
            </div>
          </header>

          {/* 2. Educational tips strip helper */}
          {showTip && (
            <div id="financial-tip-bar" className="bg-amber-50/50 border-b border-amber-100/60 py-2.5 px-4 sm:px-8 flex items-center justify-between text-xs text-amber-900 transition-all">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-500 shrink-0" />
                <p className="leading-relaxed">
                  <strong>Dica Financeira:</strong> {TIPS[tipIndex]}
                </p>
              </div>
              <button
                id="btn-close-tip"
                onClick={() => setShowTip(false)}
                className="text-amber-500 hover:text-amber-700 p-0.5 rounded hover:bg-amber-100 cursor-pointer shrink-0 ml-3"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

      {/* 3. Main Workspace Navigation & Content Body */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 md:p-8 flex flex-col lg:flex-row gap-6">
        
        {/* Navigation Sidebar panel */}
        <aside className="lg:w-64 h-fit shrink-0 bg-white rounded-2xl shadow-xs border border-slate-200 p-4">
          <div className="text-[10px] font-bold text-slate-400 tracking-wider uppercase px-3.5 mb-2">
            Navegação Principal
          </div>

          <nav className="space-y-1">
            {[
              { id: 'dashboard', name: 'Painel Geral', icon: LayoutDashboard },
              { id: 'transactions', name: 'Ganhos & Gastos', icon: ArrowRightLeft },
              { id: 'bills', name: 'Contas do Mês', icon: CalendarCheck2 },
              { id: 'investments', name: 'Investimentos', icon: TrendingUp },
              { id: 'auth', name: loggedInUser ? 'Minha Conta' : 'Acesso & Login', icon: LogIn },
              { id: 'config', name: 'Ajustes & Banco', icon: Settings }
            ].map((tab) => {
              const IconComp = tab.icon;
              return (
                <button
                  id={`nav-link-${tab.id}`}
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-semibold tracking-tight transition-all cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-slate-100 text-slate-900 shadow-xs border border-slate-200'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <IconComp className="w-4.5 h-4.5 shrink-0" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Active view window container */}
        <main className="flex-1 min-w-0">
          
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-extrabold text-gray-950 tracking-tight">Painel de Resumo Consolidado</h2>
                  <p className="text-xs text-gray-500">Acompanhe de forma prática todos os capitais alocados, custos recorrentes e balanços de caixa.</p>
                </div>

                <div className="hidden sm:block text-right">
                  <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block">Meta Saldo Mês</span>
                  <span className="text-xs font-bold text-gray-900">{preferences.currency} {preferences.monthlyIncomeGoal}</span>
                </div>
              </div>

              <FinanceSummary
                transactions={transactions}
                monthlyBills={monthlyBills}
                investments={investments}
                currency={preferences.currency}
                preferences={preferences}
              />
            </div>
          )}

          {/* Transactions Tab */}
          {activeTab === 'transactions' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-extrabold text-gray-950 tracking-tight">Gerenciar Ganhos & Gastos</h2>
                <p className="text-xs text-gray-500">Mapeie individualmente as despesas eventuais do cotidiano e recebimentos pontuais de freelance ou salário comercial.</p>
              </div>

              <TransactionsTab
                transactions={transactions}
                onAddTransaction={handleAddTransaction}
                onDeleteTransaction={handleDeleteTransaction}
                currency={preferences.currency}
              />
            </div>
          )}

          {/* Monthly Bills Tab */}
          {activeTab === 'bills' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-extrabold text-gray-950 tracking-tight">Agenda de Contas do Mês</h2>
                <p className="text-xs text-gray-500">Gerencie seguros, convênios de saúde, faturas de concessionárias residenciais e serviços recorrentes sem sobressaltos.</p>
              </div>

              <MonthlyBillsTab
                bills={monthlyBills}
                onAddBill={handleAddBill}
                onToggleBillStatus={handleToggleBillStatus}
                onDeleteBill={handleDeleteBill}
                currency={preferences.currency}
              />
            </div>
          )}

          {/* Investments Tab */}
          {activeTab === 'investments' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-extrabold text-gray-950 tracking-tight">Monitor de Investimentos Manuais</h2>
                <p className="text-xs text-gray-500">Acompanhe cotas de ações, fundos imobiliários aportados, tesouro ou renda fixa, valorizando seu dinheiro sem integradores terceirizados.</p>
              </div>

              <InvestmentsTab
                investments={investments}
                onAddInvestment={handleAddInvestment}
                onUpdateInvestmentValue={handleUpdateInvestmentValue}
                onDeleteInvestment={handleDeleteInvestment}
                currency={preferences.currency}
              />
            </div>
          )}

          {/* Registration and Authentication Tab */}
          {activeTab === 'auth' && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h2 className="text-xl font-extrabold text-gray-950 tracking-tight">Acesso de Usuário Finantra</h2>
                <p className="text-xs text-gray-500">Autentique sua conta Finantra com regras de segurança completas contra fraudes ou perdas locais.</p>
              </div>

              <AuthTab
                loggedInUser={loggedInUser}
                onLogin={(email) => {
                  setLoggedInUser(email);
                  // Dynamic feedback alert
                  setActiveTab('dashboard');
                }}
                onLogout={() => {
                  setLoggedInUser(null);
                }}
              />
            </div>
          )}

          {/* Settings / Configuration database Tab */}
          {activeTab === 'config' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-extrabold text-gray-950 tracking-tight">Propriedades do Perfil & Nuvem</h2>
                <p className="text-xs text-gray-500">Altere limites planejados, simule carteiras, e configure a sincronização com seu banco de dados na Nuvem Online Finantra.</p>
              </div>

              <ProfileSelector
                currentProfile={currentProfile}
                profiles={profiles}
                preferences={preferences}
                onUpdatePreferences={handleUpdatePreferences}
                onSwitchProfile={handleSwitchProfile}
                onCreateProfile={handleCreateProfile}
                onClearProfileData={handleClearProfileData}
              />

              {/* DatabaseStatus has been removed as requested */}
            </div>
          )}

        </main>
      </div>

      {/* Footer information copyright */}
      <footer className="bg-white border-t border-gray-100 py-6 text-xs text-gray-500 mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p>© 2026 Finantra • Software Próprio de Controle Manual de despesas e investimentos.</p>
          <div className="flex flex-wrap items-center gap-4 font-medium text-gray-400">
            <span>Privacidade Assegurada</span>
            <span>•</span>
            <span>Sem Conexões Extras de Terceiros</span>
          </div>
        </div>
      </footer>
    </div>
   )}
  </>
  );
}
