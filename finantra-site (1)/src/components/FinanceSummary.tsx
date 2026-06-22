/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { Transaction, MonthlyBill, Investment, UserPreferences } from '../types';
import { formatCurrency } from '../utils';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  CalendarDays,
  Coins,
  ArrowUpRight,
  Sparkles,
  PieChart as PieIcon,
  Bell,
  AlertTriangle,
  CheckCircle2,
  Award,
  ShieldAlert,
  Info
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend
} from 'recharts';

interface FinanceSummaryProps {
  transactions: Transaction[];
  monthlyBills: MonthlyBill[];
  investments: Investment[];
  currency: string;
  preferences: UserPreferences;
}

const COLORS_EXPENSES = [
  '#0F172A', // Slate 900
  '#334155', // Slate 700
  '#475569', // Slate 600
  '#64748b', // Slate 500
  '#94a3b8', // Slate 400
  '#cbd5e1', // Slate 300
  '#1e293b', // Slate 800
  '#10B981', // Emerald 500
  '#EF4444'  // Rose 500
];

const COLORS_INVEST_TYPES = {
  'Renda Fixa': '#0F172A',       // Slate 900
  'Ações': '#475569',            // Slate 600
  'Fundos Imobiliários': '#94a3b8', // Slate 400
  'Cripto': '#10B981',           // Emerald
  'Outros': '#cbd5e1'            // Slate 300
};

export default function FinanceSummary({
  transactions,
  monthlyBills,
  investments,
  currency,
  preferences,
}: FinanceSummaryProps) {
  // 1. Math Calculation
  const totalEarnings = useMemo(() => {
    return transactions
      .filter((t) => t.type === 'earnings')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const totalExpenses = useMemo(() => {
    return transactions
      .filter((t) => t.type === 'expenses')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const totalInvestedAmount = useMemo(() => {
    return investments.reduce((sum, i) => sum + i.currentAmount, 0);
  }, [investments]);

  const totalInvestedCost = useMemo(() => {
    return investments.reduce((sum, i) => sum + i.amountInvested, 0);
  }, [investments]);

  // Yield math
  const totalYieldPercentage = useMemo(() => {
    if (totalInvestedCost === 0) return 0;
    return ((totalInvestedAmount - totalInvestedCost) / totalInvestedCost) * 100;
  }, [totalInvestedAmount, totalInvestedCost]);

  const unpaidBillsAmount = useMemo(() => {
    return monthlyBills
      .filter((b) => !b.isPaid)
      .reduce((sum, b) => sum + b.amount, 0);
  }, [monthlyBills]);

  const paidBillsAmount = useMemo(() => {
    return monthlyBills
      .filter((b) => b.isPaid)
      .reduce((sum, b) => sum + b.amount, 0);
  }, [monthlyBills]);

  const totalBillsAmount = useMemo(() => {
    return monthlyBills.reduce((sum, b) => sum + b.amount, 0);
  }, [monthlyBills]);

  const completedBillsRatio = useMemo(() => {
    if (monthlyBills.length === 0) return 0;
    const paidCount = monthlyBills.filter((b) => b.isPaid).length;
    return Math.round((paidCount / monthlyBills.length) * 100);
  }, [monthlyBills]);

  // Overall liquidity balance = earnings - expenses - paid recursive bills
  // (Let's make a beautiful math balance cards)
  const availableLiquidity = useMemo(() => {
    return totalEarnings - totalExpenses - paidBillsAmount;
  }, [totalEarnings, totalExpenses, paidBillsAmount]);

  const totalNetWorth = useMemo(() => {
    return availableLiquidity + totalInvestedAmount;
  }, [availableLiquidity, totalInvestedAmount]);

  // Compute total spent per category and verify limits
  const categoryBudgets = useMemo(() => {
    const limits = preferences?.categoryLimits || {};
    
    // Calculate total spent for each category
    const spentMap: Record<string, number> = {};
    
    transactions
      .filter((t) => t.type === 'expenses')
      .forEach((t) => {
        spentMap[t.category] = (spentMap[t.category] || 0) + t.amount;
      });
    
    monthlyBills
      .filter((b) => b.isPaid)
      .forEach((b) => {
        spentMap[b.category] = (spentMap[b.category] || 0) + b.amount;
      });

    return Object.keys(limits)
      .filter(cat => limits[cat] > 0)
      .map(cat => {
        const limit = limits[cat];
        const spent = spentMap[cat] || 0;
        const ratio = limit > 0 ? spent / limit : 0;
        const percent = Math.round(ratio * 100);
        return {
          category: cat,
          limit,
          spent,
          percent,
          isExceeded: spent >= limit,
          isApproaching: spent >= 0.8 * limit && spent < limit
        };
      });
  }, [transactions, monthlyBills, preferences]);

  // Dynamic milestone and limit alert notifications
  const notifications = useMemo(() => {
    const list: Array<{
      id: string;
      type: 'success' | 'warning' | 'danger';
      title: string;
      message: string;
    }> = [];

    // 1. Income Milestone Progress
    if (preferences?.monthlyIncomeGoal > 0) {
      const incomeRatio = totalEarnings / preferences.monthlyIncomeGoal;
      if (incomeRatio >= 1.0) {
        list.push({
          id: 'goal-income-100',
          type: 'success',
          title: 'Meta de Ganhos: 100% Alcançada 🏆',
          message: `Objetivo batido! Você atingiu ${Math.round(incomeRatio * 100)}% do seu plano de recebimentos, capitaneando ${formatCurrency(totalEarnings, currency)}.`
        });
      } else if (incomeRatio >= 0.5) {
        list.push({
          id: 'goal-income-50',
          type: 'success',
          title: 'Meta de Ganhos: 50% Alcançada 🎯',
          message: `Sensacional! A metade do seu objetivo de ganho de ${formatCurrency(preferences.monthlyIncomeGoal, currency)} já foi ultrapassada (${formatCurrency(totalEarnings, currency)} acumulados).`
        });
      }
    }

    // 2. Savings Milestone Progress
    if (preferences?.savingsGoal > 0) {
      const savingsRatio = totalInvestedCost / preferences.savingsGoal;
      if (savingsRatio >= 1.0) {
        list.push({
          id: 'goal-savings-100',
          type: 'success',
          title: 'Meta de Poupança: Batida! 🏆',
          message: `Parabéns estruturais! Seu aporte planejado de ${formatCurrency(preferences.savingsGoal, currency)} atingiu ${Math.round(savingsRatio * 100)}% de consolidação celular.`
        });
      } else if (savingsRatio >= 0.5) {
        list.push({
          id: 'goal-savings-50',
          type: 'success',
          title: 'Meta de Poupança: 50% Aportado 🎯',
          message: `Estamos avançando bem. Seus investimentos mensais já acumulam mais de metade do objetivo (${formatCurrency(totalInvestedCost, currency)} de ${formatCurrency(preferences.savingsGoal, currency)}).`
        });
      }
    }

    // 3. Category limits check
    categoryBudgets.forEach(b => {
      if (b.isExceeded) {
        list.push({
          id: `limit-exceeded-${b.category}`,
          type: 'danger',
          title: `Teto Estourado! • ${b.category} 🚨`,
          message: `Os gastos acumulados em ${b.category} bateram ${formatCurrency(b.spent, currency)} ultrapassando os ${formatCurrency(b.limit, currency)} estipulados (${b.percent}% do limite).`
        });
      } else if (b.isApproaching) {
        list.push({
          id: `limit-approaching-${b.category}`,
          type: 'warning',
          title: `Limite Alerta • ${b.category} ⚠️`,
          message: `Sinal amarelo discreto: Seus custos em ${b.category} beiram ${b.percent}% da meta (Você gastou ${formatCurrency(b.spent, currency)} de ${formatCurrency(b.limit, currency)}).`
        });
      }
    });

    return list;
  }, [totalEarnings, totalInvestedCost, preferences, categoryBudgets, currency]);

  // 2. Charts Data Modeling
  const expenseCategoryData = useMemo(() => {
    const categoriesMap: Record<string, number> = {};
    transactions
      .filter((t) => t.type === 'expenses')
      .forEach((t) => {
        categoriesMap[t.category] = (categoriesMap[t.category] || 0) + t.amount;
      });
    
    // Also add paid monthly bills as Moradia / Saúde categories
    monthlyBills
      .filter((b) => b.isPaid)
      .forEach((b) => {
        categoriesMap[b.category] = (categoriesMap[b.category] || 0) + b.amount;
      });

    return Object.entries(categoriesMap)
      .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
      .sort((a, b) => b.value - a.value);
  }, [transactions, monthlyBills]);

  const investmentTypeData = useMemo(() => {
    const typesMap: Record<string, number> = {
      'Renda Fixa': 0,
      'Ações': 0,
      'Fundos Imobiliários': 0,
      'Cripto': 0,
      'Outros': 0
    };
    investments.forEach((i) => {
      const type = i.type || 'Outros';
      typesMap[type] = (typesMap[type] || 0) + i.currentAmount;
    });

    return Object.entries(typesMap)
      .map(([name, value]) => ({ name, value }))
      .filter((item) => item.value > 0);
  }, [investments]);

  // Monthly inflow vs outflow comparisons
  const balanceFlowData = useMemo(() => {
    return [
      {
        name: 'Resumo Mensal',
        Entradas: Math.round(totalEarnings),
        Saídas: Math.round(totalExpenses + paidBillsAmount),
        Investido: Math.round(totalInvestedCost)
      }
    ];
  }, [totalEarnings, totalExpenses, paidBillsAmount, totalInvestedCost]);

  return (
    <div className="space-y-6">
      {/* 1. Main Stats Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Available Liquidity Card */}
        <div id="liquidity-card" className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:translate-y-[-1px] transition-all duration-150">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Saldo em Conta</span>
            <div className="p-2 bg-slate-100 text-slate-800 rounded-xl">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className={`text-2xl font-bold tracking-tight ${availableLiquidity >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
              {formatCurrency(availableLiquidity, currency)}
            </h3>
            <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1">
              Ganhos (-) Gastos (-) Contas Pagas
            </p>
          </div>
        </div>

        {/* Dynamic Earnings Card */}
        <div id="earnings-card" className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:translate-y-[-1px] transition-all duration-150">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Ganhos do Mês</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
              {formatCurrency(totalEarnings, currency)}
            </h3>
            <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1">
              <span className="text-emerald-500 font-medium">+{transactions.filter(t => t.type === 'earnings').length}</span> lançamentos ativos
            </p>
          </div>
        </div>

        {/* Dynamic Expenses Card */}
        <div id="expenses-card" className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:translate-y-[-1px] transition-all duration-150">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Gastos Registrados</span>
            <div className="p-2 bg-rose-50 text-rose-500 rounded-xl">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
              {formatCurrency(totalExpenses, currency)}
            </h3>
            <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1">
              <span className="text-rose-500 font-medium">-{transactions.filter(t => t.type === 'expenses').length}</span> compras manuais
            </p>
          </div>
        </div>

        {/* Dynamic Net Investments Card */}
        <div id="investments-summary-card" className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:translate-y-[-1px] transition-all duration-150">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Investimentos Ativos</span>
            <div className="p-2 bg-slate-100 text-slate-700 rounded-xl">
              <Coins className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
              {formatCurrency(totalInvestedAmount, currency)}
            </h3>
            <p className="text-xs text-slate-500 mt-1.5 flex items-center flex-wrap gap-1">
              {totalYieldPercentage >= 0 ? (
                <span className="text-emerald-500 font-medium bg-emerald-50 px-1 py-0.2 rounded flex items-center gap-0.5">
                  <ArrowUpRight className="w-3 h-3" />+{totalYieldPercentage.toFixed(1)}%
                </span>
              ) : (
                <span className="text-rose-500 font-medium bg-rose-50 px-1 py-0.2 rounded flex items-center gap-0.5">
                  {totalYieldPercentage.toFixed(1)}%
                </span>
              )}
              <span>rendimento total estimado</span>
            </p>
          </div>
        </div>
      </div>

      {/* 2. Secondary Mini progress Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Bill payment tracking progress */}
        <div id="bills-progress-summary" className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-slate-400" />
                <h4 className="text-sm font-semibold text-slate-800">Contas do Mês</h4>
              </div>
              <span className="text-xs font-medium text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded-full">
                {completedBillsRatio}% Pagas
              </span>
            </div>
            
            <p className="text-xs text-slate-500 leading-relaxed mb-4 font-normal">
              Gerencie suas despesas recorrentes do mês. Você pagou {' '}
              <span className="font-semibold text-slate-800">{formatCurrency(paidBillsAmount, currency)}</span> de um total de{' '}
              <span className="font-semibold text-slate-800">{formatCurrency(totalBillsAmount, currency)}</span>.
            </p>
          </div>

          <div className="space-y-2">
            <div className="w-full bg-slate-150 rounded-full h-2 overflow-hidden">
              <div
                className="bg-[#0F172A] h-2 rounded-full transition-all duration-300"
                style={{ width: `${completedBillsRatio}%` }}
              ></div>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
              <span>Resta para quitar: {formatCurrency(unpaidBillsAmount, currency)}</span>
              <span>{monthlyBills.filter(b => b.isPaid).length} de {monthlyBills.length} Contas</span>
            </div>
          </div>
        </div>

        {/* Savings Rate Card */}
        <div id="savings-rate-summary" className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-500 animate-pulse" />
                <h4 className="text-sm font-semibold text-slate-800">Taxa de Aporte</h4>
              </div>
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                {totalEarnings > 0 ? Math.round((totalInvestedCost / totalEarnings) * 100) : 0}% Gerado
              </span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              Porcentagem de receitas investida em investimentos ou poupança neste mês.
            </p>
          </div>

          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-slate-905">
                {totalEarnings > 0 ? ((totalInvestedCost / totalEarnings) * 100).toFixed(1) : '0'}%
              </span>
              <span className="text-xs text-slate-400">da sua renda mensal total</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden mt-2">
              <div
                className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, totalEarnings > 0 ? (totalInvestedCost / totalEarnings) * 100 : 0)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Total Wealth Calculator Card */}
        <div id="wealth-summary" className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-semibold text-slate-850 mb-2">Patrimônio Líquido</h4>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              Seu saldo em conta somado ao valor de mercado de todas as suas aplicações ativas hoje.
            </p>
          </div>

          <div className="bg-[#0F172A] rounded-xl p-4 text-white">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Patrimônio Consolidado</span>
            <div className="text-xl font-bold tracking-tight mt-0.5 font-sans">
              {formatCurrency(totalNetWorth, currency)}
            </div>
            <div className="text-[10px] text-slate-350 mt-1 flex items-center gap-1.5 font-mono">
              <span>Saldo: {formatCurrency(availableLiquidity, currency)}</span>
              <span>•</span>
              <span>Aplicações: {formatCurrency(totalInvestedAmount, currency)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2.5. Alerts, Milestones & Category Limits Dashboard Pane */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Central de Alertas e Notificações */}
        <div id="alerts-and-notifications-card" className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-slate-800 animate-swing" />
                <h4 className="text-sm font-bold text-slate-900">Central de Alertas & Notificações</h4>
              </div>
              {notifications.length > 0 && (
                <span className="text-[10px] font-bold uppercase tracking-wider bg-red-50 text-red-650 px-2 py-0.5 rounded-full border border-red-100 flex items-center gap-1 animate-pulse">
                  {notifications.length} {notifications.length === 1 ? 'Aviso' : 'Avisos'}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Informativos automáticos e discretos sobre suas metas domésticas e tetos de gastos ativos.
            </p>

            <div className="space-y-2.5 max-h-[250px] overflow-y-auto scrollbar-thin pr-1 pb-1">
              {notifications.length === 0 ? (
                <div className="text-center py-8 text-slate-400 space-y-2">
                  <div className="mx-auto w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center border border-slate-150">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  </div>
                  <p className="text-xs font-semibold text-slate-700">Tudo sob controle!</p>
                  <p className="text-[10px] leading-relaxed max-w-xs mx-auto text-slate-550">Sua saúde financeira está em equilíbrio. Cadastre metas e limites de gastos para ver notificações aqui.</p>
                </div>
              ) : (
                notifications.map((note) => {
                  const isSuccess = note.type === 'success';
                  const isWarning = note.type === 'warning';
                  
                  return (
                    <div
                      key={note.id}
                      className={`p-3 rounded-xl border flex gap-3 transition-colors ${
                        isSuccess
                          ? 'bg-emerald-50/40 border-emerald-100 text-emerald-950'
                          : isWarning
                          ? 'bg-amber-50/40 border-amber-100 text-amber-950'
                          : 'bg-rose-50/40 border-rose-100 text-rose-950'
                      }`}
                    >
                      <div className="shrink-0 mt-0.5">
                        {isSuccess ? (
                          <Award className="w-4 h-4 text-emerald-600" />
                        ) : isWarning ? (
                          <AlertTriangle className="w-4 h-4 text-amber-600" />
                        ) : (
                          <ShieldAlert className="w-4 h-4 text-rose-600" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <strong className="text-[11px] font-extrabold block truncate leading-tight tracking-tight">
                          {note.title}
                        </strong>
                        <p className="text-[10px] leading-relaxed text-slate-600 mt-0.5">
                          {note.message}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Teto de Gastos por Categoria */}
        <div id="category-limits-dashboard-card" className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-1.5">
              <Coins className="w-4 h-4 text-indigo-500" />
              Teto de Gastos Ativos por Categoria
            </h4>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Progresso do seu limite planejado por categoria neste mês (gastos + contas quitadas).
            </p>

            <div className="space-y-4 max-h-[250px] overflow-y-auto scrollbar-thin pr-1 pb-1">
              {categoryBudgets.length === 0 ? (
                <div className="text-center py-8 text-slate-400 space-y-2">
                  <div className="mx-auto w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center border border-slate-150">
                    <Info className="w-5 h-5 text-slate-400" />
                  </div>
                  <p className="text-xs font-semibold text-slate-700">Nenhum limite cadastrado</p>
                  <p className="text-[10px] leading-relaxed max-w-sm mx-auto text-slate-550">
                    Você pode planejar um teto para Alimentação, Lazer e outras categorias diretamente na aba de <strong>Ajustes & Banco</strong>.
                  </p>
                </div>
              ) : (
                categoryBudgets.map((b) => {
                  const limitValue = b.limit;
                  const spentValue = b.spent;
                  const pct = b.percent;
                  
                  return (
                    <div key={b.category} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-extrabold text-slate-800">{b.category}</span>
                        <div className="text-[11px] font-mono text-slate-500">
                          <strong className="text-slate-950 font-bold">{formatCurrency(spentValue, currency)}</strong>
                          <span> de </span>
                          <span>{formatCurrency(limitValue, currency)}</span>
                          <span className={`ml-1 px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider ${
                            b.isExceeded
                              ? 'bg-rose-50 text-rose-600'
                              : b.isApproaching
                              ? 'bg-amber-50 text-amber-600'
                              : 'bg-slate-50 text-slate-600'
                          }`}>
                            {pct}%
                          </span>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-1.5 rounded-full transition-all duration-300 ${
                            b.isExceeded
                              ? 'bg-rose-500'
                              : b.isApproaching
                              ? 'bg-amber-500 animate-pulse'
                              : 'bg-slate-900'
                          }`}
                          style={{ width: `${Math.min(100, pct)}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Recharts Graphics Rows */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expenses by category Pie Chart */}
        <div id="expenses-category-chart" className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between min-h-[380px]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <PieIcon className="w-4 h-4 text-slate-600" />
              <h4 className="text-sm font-bold text-slate-900">Distribuição de Saídas por Categoria</h4>
            </div>
            <p className="text-xs text-slate-500">
              Despesas manuais unidas às faturas do mês dadas como quitadas. do mês dadas como quitadas.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 items-center gap-4 mt-4 flex-1">
            <div className="sm:col-span-7 h-[220px] w-full relative">
              {expenseCategoryData.length === 0 ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-gray-400 p-4">
                  <span className="text-xs font-medium">Nenhuma despesa para exibir</span>
                  <span className="text-[11px] text-gray-400 mt-1">Insira gastos na aba correspondente para gerar gráficos</span>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expenseCategoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {expenseCategoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS_EXPENSES[index % COLORS_EXPENSES.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: any) => `${formatCurrency(Number(value), currency)}`}
                      contentStyle={{ fontFamily: 'sans-serif', fontSize: '12px', borderRadius: '8px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="sm:col-span-5 flex flex-col gap-2.5 max-h-[220px] overflow-y-auto scrollbar-thin text-xs pr-1">
              {expenseCategoryData.map((item, idx) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: COLORS_EXPENSES[idx % COLORS_EXPENSES.length] }}
                    />
                    <span className="text-gray-700 truncate font-medium">{item.name}</span>
                  </div>
                  <span className="text-gray-900 font-semibold font-mono whitespace-nowrap">
                    {formatCurrency(item.value, currency)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Investment Distribution Chart */}
        <div id="investments-distribution-chart" className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between min-h-[380px]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Coins className="w-4 h-4 text-emerald-500" />
              <h4 className="text-sm font-bold text-gray-900">Alocação de Investimentos</h4>
            </div>
            <p className="text-xs text-gray-500">
              Valor de mercado estimado dos ativos segmentados por classe.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 items-center gap-4 mt-4 flex-1">
            <div className="sm:col-span-7 h-[220px] w-full relative">
              {investmentTypeData.length === 0 ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-gray-400 p-4">
                  <span className="text-xs font-medium">Nenhum investimento cadastrado</span>
                  <span className="text-[11px] text-gray-400 mt-1">Aplique na aba de investimentos para mapear o portfólio</span>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={investmentTypeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {investmentTypeData.map((entry) => (
                        <Cell
                          key={`cell-${entry.name}`}
                          fill={COLORS_INVEST_TYPES[entry.name as keyof typeof COLORS_INVEST_TYPES] || '#64748b'}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: any) => `${formatCurrency(Number(value), currency)}`}
                      contentStyle={{ fontFamily: 'sans-serif', fontSize: '12px', borderRadius: '8px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="sm:col-span-5 flex flex-col gap-2.5 text-xs">
              {Object.keys(COLORS_INVEST_TYPES).map((type) => {
                const item = investmentTypeData.find((d) => d.name === type);
                const value = item ? item.value : 0;
                return (
                  <div key={type} className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: COLORS_INVEST_TYPES[type as keyof typeof COLORS_INVEST_TYPES] }}
                      />
                      <span className="text-gray-700 font-medium truncate">{type}</span>
                    </div>
                    <span className="text-gray-900 font-semibold font-mono whitespace-nowrap">
                      {formatCurrency(value, currency)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Cashflow Bar Overview */}
      <div id="cashflow-bar-chart-container" className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div>
          <h4 className="text-sm font-bold text-slate-900 mb-1">Métricas de Fluxo Geral</h4>
          <p className="text-xs text-slate-500 mb-4">
            Comparativo entre suas Entradas Totais obtidas, as Saídas consolidadas (gastos + contas quitadas) e o Aporte Total em investimentos.
          </p>
        </div>

        <div className="h-[240px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={balanceFlowData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" fontSize={11} stroke="#94a3b8" axisLine={false} tickLine={false} />
              <YAxis fontSize={11} stroke="#94a3b8" axisLine={false} tickLine={false} tickFormatter={(v) => `${formatCurrency(v, currency).slice(0, 7)}`} />
              <Tooltip formatter={(value: any) => `${formatCurrency(Number(value), currency)}`} />
              <Legend verticalAlign="bottom" height={36} />
              <Bar dataKey="Entradas" fill="#10B981" radius={[8, 8, 0, 0]} barSize={50} />
              <Bar dataKey="Saídas" fill="#EF4444" radius={[8, 8, 0, 0]} barSize={50} />
              <Bar dataKey="Investido" fill="#475569" radius={[8, 8, 0, 0]} barSize={50} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
