/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Investment } from '../types';
import { INVESTMENT_TYPES, formatCurrency, formatDate } from '../utils';
import {
  Coins,
  Plus,
  TrendingUp,
  Percent,
  Calculator,
  Trash2,
  X,
  PiggyBank,
  ArrowUpRight,
  ShieldAlert,
  Building2,
  Briefcase
} from 'lucide-react';

interface InvestmentsTabProps {
  investments: Investment[];
  onAddInvestment: (inv: Omit<Investment, 'id' | 'profileId'>) => void;
  onUpdateInvestmentValue: (id: string, newAmount: number) => void;
  onDeleteInvestment: (id: string) => void;
  currency: string;
}

export default function InvestmentsTab({
  investments,
  onAddInvestment,
  onUpdateInvestmentValue,
  onDeleteInvestment,
  currency,
}: InvestmentsTabProps) {
  // Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<Investment['type']>('Renda Fixa');
  const [formAmountInvested, setFormAmountInvested] = useState('');
  const [formCurrentAmount, setFormCurrentAmount] = useState('');
  const [formYieldRate, setFormYieldRate] = useState('');
  const [formAcquisitionDate, setFormAcquisitionDate] = useState(new Date().toISOString().substring(0, 10));
  const [formBroker, setFormBroker] = useState('');

  // Future simulator state
  const [simMonthlyContribution, setSimMonthlyContribution] = useState('200');
  const [simAnnualYield, setSimAnnualYield] = useState('11');
  const [simYears, setSimYears] = useState('5');

  // Updating asset value inline state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [deletingInvId, setDeletingInvId] = useState<string | null>(null);

  // Math totals
  const portfolioStats = useMemo(() => {
    let totalInvested = 0;
    let totalCurrent = 0;
    investments.forEach((i) => {
      totalInvested += i.amountInvested;
      totalCurrent += i.currentAmount;
    });

    const netEarnings = totalCurrent - totalInvested;
    const percentageReturn = totalInvested > 0 ? (netEarnings / totalInvested) * 100 : 0;
    return { totalInvested, totalCurrent, netEarnings, percentageReturn };
  }, [investments]);

  // Handle forms submit
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const invested = parseFloat(formAmountInvested);
    const current = parseFloat(formCurrentAmount) || invested; // default current is invested if empty
    const rate = parseFloat(formYieldRate) || 0;

    if (!formName.trim()) return alert('Insira o nome do ativo!');
    if (isNaN(invested) || invested <= 0) return alert('Insira o montante investido inicial!');
    if (!formBroker.trim()) return alert('Informe a corretora/banco custodial!');

    onAddInvestment({
      name: formName.trim(),
      type: formType,
      amountInvested: invested,
      currentAmount: current,
      yieldRate: rate,
      acquisitionDate: formAcquisitionDate,
      broker: formBroker.trim()
    });

    // Reset Form
    setFormName('');
    setFormAmountInvested('');
    setFormCurrentAmount('');
    setFormYieldRate('');
    setFormBroker('');
    setShowAddForm(false);
  };

  // Inline current value updating
  const handleUpdateValueSubmit = (id: string) => {
    const newVal = parseFloat(editingValue);
    if (isNaN(newVal) || newVal < 0) return alert('Valor incorreto!');
    onUpdateInvestmentValue(id, newVal);
    setEditingId(null);
  };

  // Compute simulate details
  const simulationResult = useMemo(() => {
    const monthlyCont = parseFloat(simMonthlyContribution) || 0;
    const annualYield = parseFloat(simAnnualYield) || 0;
    const years = parseInt(simYears) || 0;
    
    if (years <= 0) return { totalContributed: 0, totalInterest: 0, finalSum: 0 };

    const monthlyRate = Math.pow(1 + annualYield / 100, 1 / 12) - 1;
    const months = years * 12;

    let totalContributed = portfolioStats.totalCurrent;
    let finalSum = portfolioStats.totalCurrent;

    // Compound interest calculation
    for (let m = 1; m <= months; m++) {
      finalSum = finalSum * (1 + monthlyRate) + monthlyCont;
      totalContributed += monthlyCont;
    }

    const totalInterest = finalSum - totalContributed;
    return {
      totalContributed: Math.round(totalContributed),
      totalInterest: Math.round(totalInterest),
      finalSum: Math.round(finalSum)
    };
  }, [simMonthlyContribution, simAnnualYield, simYears, portfolioStats.totalCurrent]);

  return (
    <div className="space-y-6">
      {/* 1. Investment Overview Panel */}
      <div className="bg-slate-900 rounded-2xl p-6 text-white border border-slate-800 shadow-xs flex flex-col md:flex-row justify-between gap-6">
        <div className="space-y-4">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Seu Patrimônio Multiplicado</span>
            <h3 className="text-3xl font-extrabold tracking-tight mt-1 font-sans text-white">
              {formatCurrency(portfolioStats.totalCurrent, currency)}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Custo total de aquisição dos ativos: {formatCurrency(portfolioStats.totalInvested, currency)}
            </p>
          </div>

          <div className="flex gap-4">
            <div className="bg-white/5 px-4 py-2 rounded-xl border border-white/10 backdrop-blur-xs">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Valorização Bruta</span>
              <p className={`text-base font-extrabold font-mono mt-0.5 ${portfolioStats.netEarnings >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {portfolioStats.netEarnings >= 0 ? '+' : ''}{formatCurrency(portfolioStats.netEarnings, currency)}
              </p>
            </div>
            <div className="bg-white/5 px-4 py-2 rounded-xl border border-white/10 backdrop-blur-xs">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Desempenho Geral</span>
              <p className={`text-base font-extrabold font-mono mt-0.5 ${portfolioStats.percentageReturn >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {portfolioStats.percentageReturn >= 0 ? '+' : ''}{portfolioStats.percentageReturn.toFixed(2)}%
              </p>
            </div>
          </div>
        </div>

        {/* Compound projection widget */}
        <div className="bg-white/5 rounded-xl border border-white/10 p-4 shrink-0 md:max-w-xs flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-2">
            <Calculator className="w-4 h-4 text-emerald-400" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">Simulador de Crescimento</span>
          </div>
          <p className="text-[11px] text-slate-300/80 leading-relaxed mb-3">
            Gostaria de ver quanto sua carteira atual renderá aportando todos os meses em juros compostos?
          </p>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[9px] text-slate-400 block font-semibold mb-0.5">Aporte Mês</label>
              <input
                id="sim-monthly-input"
                type="number"
                value={simMonthlyContribution}
                onChange={(e) => setSimMonthlyContribution(e.target.value)}
                className="w-full bg-white/10 rounded px-1.5 py-1 text-xs border border-white/10 text-white outline-none font-mono focus:border-slate-400"
              />
            </div>
            <div>
              <label className="text-[9px] text-slate-400 block font-semibold mb-0.5">Rend. Anual</label>
              <input
                id="sim-yield-input"
                type="number"
                value={simAnnualYield}
                onChange={(e) => setSimAnnualYield(e.target.value)}
                className="w-full bg-white/10 rounded px-1.5 py-1 text-xs border border-white/10 text-white outline-none font-mono focus:border-slate-400"
              />
            </div>
            <div>
              <label className="text-[9px] text-slate-400 block font-semibold mb-0.5">Prazo Anos</label>
              <input
                id="sim-years-input"
                type="number"
                value={simYears}
                onChange={(e) => setSimYears(e.target.value)}
                className="w-full bg-white/10 rounded px-1.5 py-1 text-xs border border-white/10 text-white outline-none font-mono focus:border-slate-400"
              />
            </div>
          </div>
          <div className="mt-4 border-t border-white/10 pt-3 flex items-center justify-between text-xs">
            <span className="font-semibold text-emerald-300">Total Projetado:</span>
            <span className="font-bold text-white font-mono bg-emerald-700/30 px-2 py-0.5 rounded border border-emerald-500/20">
              {formatCurrency(simulationResult.finalSum, currency)}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Header Controllers */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
        <div>
          <h4 className="font-bold text-slate-900 text-sm">Lista de Ativos Contemplados</h4>
          <p className="text-xs text-slate-500">Mantenha os custos e preços médios dos seus investimentos em carteiras manuais.</p>
        </div>

        <button
          id="btn-open-add-investment"
          onClick={() => setShowAddForm(true)}
          className="bg-[#0F172A] hover:bg-slate-800 text-white rounded-lg px-4 py-2.5 text-xs font-semibold flex items-center gap-2 shadow-xs cursor-pointer active:scale-95 transition-transform"
        >
          <Plus className="w-4 h-4" />
          Cadastrar Novo Ativo
        </button>
      </div>

      {/* Add Investment Form */}
      {showAddForm && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 relative animate-fadeIn shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-150 pb-3 mb-5">
            <h3 className="font-bold text-slate-900 text-base">Cadastrar Ativo de Investimento</h3>
            <button
              id="btn-close-investment-form"
              onClick={() => setShowAddForm(false)}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {/* Asset Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Nome do Ativo / Código (Ticker)
                </label>
                <div id="wrapper-inv-name" className="relative">
                  <input
                    id="inv-input-name"
                    type="text"
                    required
                    placeholder="Ex: Tesouro Selic, VALE3, FII MXRF11..."
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 focus:bg-white text-xs rounded-xl pl-9 pr-3 py-2.5 text-slate-800 outline-none transition-all"
                  />
                  <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Asset Type */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Classe de Ativo
                </label>
                <select
                  id="inv-select-type"
                  value={formType}
                  onChange={(e) => setFormType(e.target.value as Investment['type'])}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 focus:bg-white text-xs rounded-xl px-4 py-2.5 text-slate-800 outline-none transition-all cursor-pointer"
                >
                  {INVESTMENT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              {/* Capital Invested */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Preço Médio Pago / Total Investido
                </label>
                <input
                  id="inv-input-invested"
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="Ex: 1000.00"
                  value={formAmountInvested}
                  onChange={(e) => setFormAmountInvested(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 focus:bg-white text-xs rounded-xl px-4 py-2.5 text-slate-800 outline-none transition-all font-mono"
                />
              </div>

              {/* Current capital worth */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Valor Atual de Mercado (Opcional)
                </label>
                <input
                  id="inv-input-current"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="Ex: 5240.20 (Vazio = igual ao investido)"
                  value={formCurrentAmount}
                  onChange={(e) => setFormCurrentAmount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 focus:bg-white text-xs rounded-xl px-4 py-2.5 text-slate-800 outline-none transition-all font-mono"
                />
              </div>

              {/* Yield rate % */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Rentabilidade Estimada (% a.a. ou mensal)
                </label>
                <div id="wrapper-inv-rate" className="relative">
                  <input
                    id="inv-input-rate"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Ex: 10.75"
                    value={formYieldRate}
                    onChange={(e) => setFormYieldRate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 focus:bg-white text-xs rounded-xl pl-9 pr-3 py-2.5 text-slate-800 outline-none transition-all font-mono"
                  />
                  <Percent className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Broker Custodian */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Corretora ou Banco Custodiante
                </label>
                <div id="wrapper-inv-broker" className="relative">
                  <input
                    id="inv-input-broker"
                    type="text"
                    required
                    placeholder="Ex: Rico, XP, NuInvest, Binance..."
                    value={formBroker}
                    onChange={(e) => setFormBroker(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 focus:bg-white text-xs rounded-xl pl-9 pr-3 py-2.5 text-slate-800 outline-none transition-all"
                  />
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Data de Aquisição
                </label>
                <input
                  id="inv-input-date"
                  type="date"
                  required
                  value={formAcquisitionDate}
                  onChange={(e) => setFormAcquisitionDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 focus:bg-white text-xs rounded-xl px-4 py-2.5 text-slate-800 outline-none transition-all font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                id="btn-inv-cancel"
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-500 border border-slate-200 hover:bg-slate-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                id="btn-inv-save"
                type="submit"
                className="px-4 py-2 bg-[#0F172A] hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer active:scale-95 transition-transform"
              >
                Cadastrar Ativo
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Investments List Cards */}
      <div className="bg-white rounded-2xl border border-slate-205 overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-slate-150">
          <h4 className="font-bold text-slate-900 text-sm">Inventário de Ativos Cadastrados</h4>
        </div>

        {investments.length === 0 ? (
          <div className="py-12 px-6 text-center text-slate-400 flex flex-col items-center justify-center">
            <Coins className="w-10 h-10 text-slate-200 mb-3" />
            <p className="text-sm font-semibold text-slate-800">Nenhum ativo registrado</p>
            <p className="text-xs text-slate-400 mt-1">Sua carteira de investimentos está vazia. Adicione ativos acima para vê-los render.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-150 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-6">Ativo / Corretora</th>
                  <th className="py-3.5 px-4">Classe</th>
                  <th className="py-3.5 px-4">Aporte Inicial</th>
                  <th className="py-3.5 px-4">Ajuste Atual de Cotação</th>
                  <th className="py-3.5 px-4">Lucro / Perda</th>
                  <th className="py-3.5 px-6 text-center w-16">Deletar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {investments.map((inv) => {
                  const profit = inv.currentAmount - inv.amountInvested;
                  const profitRate = inv.amountInvested > 0 ? (profit / inv.amountInvested) * 100 : 0;
                  const isEditingThis = editingId === inv.id;

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-6">
                        <div>
                          <p id={`inv-name-${inv.id}`} className="font-bold text-slate-900 text-xs sm:text-sm">{inv.name}</p>
                          <span className="text-[10px] text-slate-500 font-medium font-mono">{inv.broker}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full whitespace-nowrap">
                          {inv.type}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-slate-600 font-semibold font-mono whitespace-nowrap">
                        {formatCurrency(inv.amountInvested, currency)}
                      </td>
                      <td className="py-4 px-4 font-mono">
                        {isEditingThis ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              id={`input-edited-value-${inv.id}`}
                              type="number"
                              step="0.01"
                              className="border border-slate-350 rounded px-1.5 py-0.5 text-xs w-24 text-slate-900 focus:outline-none focus:border-slate-800 font-mono"
                              value={editingValue}
                              onChange={(e) => setEditingValue(e.target.value)}
                            />
                            <button
                              id={`btn-save-edited-value-${inv.id}`}
                              onClick={() => handleUpdateValueSubmit(inv.id)}
                              className="text-xs bg-slate-900 text-white rounded px-2 py-0.5 hover:bg-slate-800 cursor-pointer font-bold shrink-0"
                            >
                              Sim
                            </button>
                            <button
                              id={`btn-cancel-edited-value-${inv.id}`}
                              onClick={() => setEditingId(null)}
                              className="text-xs bg-slate-100 text-slate-600 rounded px-2 py-0.5 hover:bg-slate-200 cursor-pointer shrink-0"
                            >
                              Não
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span id={`inv-current-value-${inv.id}`} className="text-slate-900 font-bold">
                              {formatCurrency(inv.currentAmount, currency)}
                            </span>
                            <button
                              id={`btn-edit-current-value-${inv.id}`}
                              onClick={() => {
                                setEditingId(inv.id);
                                setEditingValue(inv.currentAmount.toString());
                              }}
                              className="text-[10px] text-slate-500 hover:underline hover:text-slate-800 cursor-pointer whitespace-nowrap font-medium"
                            >
                              Editar
                            </button>
                          </div>
                        )}
                        {inv.yieldRate ? (
                          <p className="text-[9px] text-slate-400 mt-0.5">Indicador: {inv.yieldRate}% a.a.</p>
                        ) : null}
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className={`font-bold font-mono text-xs flex items-center gap-0.5 ${profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {profit >= 0 ? <ArrowUpRight className="w-3.5 h-3.5 shrink-0" /> : null}
                          {profit >= 0 ? '+' : ''}{formatCurrency(profit, currency)} ({profitRate.toFixed(1)}%)
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        {deletingInvId === inv.id ? (
                          <div className="flex items-center justify-center gap-1 animate-fadeIn">
                            <button
                              id={`btn-confirm-inv-delete-${inv.id}`}
                              onClick={() => {
                                onDeleteInvestment(inv.id);
                                setDeletingInvId(null);
                              }}
                              className="bg-rose-600 text-white text-[10px] font-bold px-2 py-1 rounded-lg hover:bg-rose-700 transition-colors cursor-pointer"
                            >
                              Sim
                            </button>
                            <button
                              id={`btn-cancel-inv-delete-${inv.id}`}
                              onClick={() => setDeletingInvId(null)}
                              className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-1 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
                            >
                              Não
                            </button>
                          </div>
                        ) : (
                          <button
                            id={`btn-delete-inv-${inv.id}`}
                            onClick={() => setDeletingInvId(inv.id)}
                            className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 hover:scale-110 active:scale-95 transition-all cursor-pointer outline-none focus:outline-none focus-visible:outline-none"
                            title="Remover ativo"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
