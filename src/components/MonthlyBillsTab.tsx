/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { MonthlyBill } from '../types';
import { formatCurrency, formatDate, CATEGORIES_EXPENSES } from '../utils';
import {
  CalendarDays,
  Plus,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  X,
  CreditCard,
  DollarSign,
  Calendar,
  Layers,
  Trash2,
  BellRing
} from 'lucide-react';

interface MonthlyBillsTabProps {
  bills: MonthlyBill[];
  onAddBill: (bill: Omit<MonthlyBill, 'id' | 'profileId'>) => void;
  onToggleBillStatus: (id: string, isPaid: boolean) => void;
  onDeleteBill: (id: string) => void;
  currency: string;
}

export default function MonthlyBillsTab({
  bills,
  onAddBill,
  onToggleBillStatus,
  onDeleteBill,
  currency,
}: MonthlyBillsTabProps) {
  // UI states
  const [showAddForm, setShowAddForm] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid'>('all');
  const [deletingBillId, setDeletingId] = useState<string | null>(null);

  // Form states
  const [formDescription, setFormDescription] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formDueDate, setFormDueDate] = useState('');
  const [formCategory, setFormCategory] = useState(CATEGORIES_EXPENSES[1]); // Default Moradia
  const [formNotes, setFormNotes] = useState('');

  // Math totals
  const totals = useMemo(() => {
    let total = 0;
    let paid = 0;
    let pending = 0;
    bills.forEach((b) => {
      total += b.amount;
      if (b.isPaid) paid += b.amount;
      else pending += b.amount;
    });
    return { total, paid, pending };
  }, [bills]);

  // Date proximity check (Due in 3 days or overdue)
  const getProximityStatus = (dueDateStr: string, isPaid: boolean) => {
    if (isPaid) return 'paid';
    
    const today = new Date();
    today.setHours(0,0,0,0);
    const dueDate = new Date(dueDateStr + 'T00:00:00');
    dueDate.setHours(0,0,0,0);
    
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'overdue';
    if (diffDays <= 3) return 'near';
    return 'ok';
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = parseFloat(formAmount);
    if (!formDescription.trim()) return alert('Insira uma descrição!');
    if (isNaN(amountVal) || amountVal <= 0) return alert('Por favor, informe um valor correto.');
    if (!formDueDate) return alert('Selecione uma data de vencimento!');

    onAddBill({
      description: formDescription.trim(),
      amount: amountVal,
      dueDate: formDueDate,
      category: formCategory,
      isPaid: false,
      notes: formNotes.trim()
    });

    // Reset Form
    setFormDescription('');
    setFormAmount('');
    setFormDueDate('');
    setFormNotes('');
    setShowAddForm(false);
  };

  // Filter bills
  const filteredBills = useMemo(() => {
    return bills.filter((b) => {
      if (filter === 'pending') return !b.isPaid;
      if (filter === 'paid') return b.isPaid;
      return true;
    }).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [bills, filter]);

  return (
    <div className="space-y-6">
      {/* 1. Header Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Bills */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center justify-between hover:translate-y-[-1px] transition-all duration-150">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Compromissos Totais</span>
            <div className="text-xl font-bold text-slate-900 mt-1 font-sans">
              {formatCurrency(totals.total, currency)}
            </div>
            <span className="text-xs text-slate-400 mt-1 block">Apenas contas do mês ativo</span>
          </div>
          <div className="p-3 bg-slate-100 text-slate-800 rounded-xl">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        {/* Paid Bills */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center justify-between hover:translate-y-[-1px] transition-all duration-150">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Quitado</span>
            <div className="text-xl font-bold text-emerald-600 mt-1 font-sans">
              {formatCurrency(totals.paid, currency)}
            </div>
            <span className="text-xs text-emerald-500 font-medium mt-1 block">
              {bills.filter(b => b.isPaid).length} de {bills.length} contas liquidadas
            </span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Pending Bills */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center justify-between hover:translate-y-[-1px] transition-all duration-150">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Pendente</span>
            <div className="text-xl font-bold text-rose-500 mt-1 font-sans">
              {formatCurrency(totals.pending, currency)}
            </div>
            <span className="text-xs text-rose-400 mt-1 block">
              {bills.filter(b => !b.isPaid).length} parcelas abertas pendentes
            </span>
          </div>
          <div className="p-3 bg-rose-50 text-rose-500 rounded-xl">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 2. Control Row and Filter options */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
        {/* State filters */}
        <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
          <button
            id="bill-filter-all"
            onClick={() => setFilter('all')}
            className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all duration-150 ${
              filter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Todas ({bills.length})
          </button>
          <button
            id="bill-filter-pending"
            onClick={() => setFilter('pending')}
            className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all duration-150 ${
              filter === 'pending' ? 'bg-white text-rose-600 shadow-xs' : 'text-slate-500 hover:text-rose-900'
            }`}
          >
            Abertas ({bills.filter(b => !b.isPaid).length})
          </button>
          <button
            id="bill-filter-paid"
            onClick={() => setFilter('paid')}
            className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all duration-150 ${
              filter === 'paid' ? 'bg-white text-emerald-600 shadow-xs' : 'text-slate-500 hover:text-emerald-900'
            }`}
          >
            Pagas ({bills.filter(b => b.isPaid).length})
          </button>
        </div>

        {/* Quick Open Form Button */}
        <button
          id="btn-open-add-bill"
          onClick={() => setShowAddForm(true)}
          className="w-full sm:w-auto bg-[#0F172A] hover:bg-slate-800 text-white rounded-lg px-4 py-2.5 text-xs font-semibold flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-95 transition-transform"
        >
          <Plus className="w-4 h-4" />
          Adicionar Nova Conta
        </button>
      </div>

      {/* Add Bill Form Card */}
      {showAddForm && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 relative animate-fadeIn shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-150 pb-3 mb-5">
            <h3 className="font-bold text-slate-900 text-base">Nova Conta ou Assinatura Recorrente</h3>
            <button
              id="btn-close-bill-form"
              onClick={() => setShowAddForm(false)}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Descrição da Conta
                </label>
                <div id="wrapper-bill-desc" className="relative">
                  <input
                    id="bill-input-desc"
                    type="text"
                    required
                    maxLength={100}
                    placeholder="Ex: Aluguel, Luz, Netflix, Internet..."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 focus:bg-white text-xs rounded-xl pl-9 pr-3 py-2.5 text-slate-800 outline-none transition-all"
                  />
                  <CreditCard className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Valor ({currency})
                </label>
                <div id="wrapper-bill-amount" className="relative">
                  <input
                    id="bill-input-amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="Ex: 120.00"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 focus:bg-white text-xs rounded-xl pl-9 pr-3 py-2.5 text-slate-805 outline-none transition-all font-mono"
                  />
                  <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Vencimento
                </label>
                <div id="wrapper-bill-date" className="relative">
                  <input
                    id="bill-input-date"
                    type="date"
                    required
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 focus:bg-white text-xs rounded-xl pl-9 pr-3 py-2.5 text-slate-800 outline-none transition-all font-mono"
                  />
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Categoria da Conta
                </label>
                <select
                  id="bill-select-category"
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 focus:bg-white text-xs rounded-xl px-4 py-2.5 text-slate-800 outline-none transition-all cursor-pointer"
                >
                  {CATEGORIES_EXPENSES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Notes */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Observações de Cobrança (Opcional)
                </label>
                <input
                  id="bill-input-notes"
                  type="text"
                  placeholder="Ex: Pagar em boleto ou PIX DDA com desconto..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 focus:bg-white text-xs rounded-xl px-4 py-2.5 text-slate-800 outline-none transition-all"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                id="btn-bill-cancel"
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-500 border border-slate-200 hover:bg-slate-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                id="btn-bill-save"
                type="submit"
                className="px-4 py-2 bg-[#0F172A] hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer active:scale-95 transition-transform"
              >
                Salvar Conta
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Bills display layout - Board columns: Open versus Paid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Columns 1: Open / Overdue Bills */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-205 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-xs shadow-rose-200"></span>
              <h4 className="font-bold text-slate-900 text-sm">Contas em Aberto</h4>
            </div>
            <span className="text-xs bg-rose-50 text-rose-750 font-bold px-2 py-0.5 rounded-full">
              Pendente: {formatCurrency(totals.pending, currency)}
            </span>
          </div>

          {filteredBills.filter(b => !b.isPaid).length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400 shadow-xs">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-800">Tudo em dia!</p>
              <p className="text-xs text-slate-400 mt-1">Parabéns, você não possui contas pendentes no momento.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[480px] overflow-y-auto scrollbar-thin pr-1">
              {filteredBills.filter(b => !b.isPaid).map((bill) => {
                const prox = getProximityStatus(bill.dueDate, bill.isPaid);
                return (
                  <div
                    key={bill.id}
                    id={`bill-card-${bill.id}`}
                    className={`bg-white rounded-2xl p-4 shadow-xs border transition-all duration-200 flex items-center justify-between gap-4 ${
                      prox === 'overdue'
                        ? 'border-rose-200 bg-rose-50/20 hover:border-rose-300'
                        : prox === 'near'
                          ? 'border-amber-200 bg-amber-50/20 hover:border-amber-300'
                          : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h5 className="font-bold text-slate-900 text-xs sm:text-sm truncate">{bill.description}</h5>
                        {prox === 'overdue' && (
                          <span className="text-[10px] bg-rose-600 text-white font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                            <BellRing className="w-2.5 h-2.5" /> ATRASADO
                          </span>
                        )}
                        {prox === 'near' && (
                          <span className="text-[10px] bg-amber-500 text-white font-bold px-1.5 py-0.5 rounded flex items-center gap-1 animate-pulse">
                            VENCE LOGO
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-1 flex-wrap text-[10px] font-medium text-slate-500">
                        <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">{bill.category}</span>
                        <span className="text-slate-400 font-mono">Vence: {formatDate(bill.dueDate)}</span>
                      </div>

                      {bill.notes && <p className="text-[10px] text-slate-400 mt-1.5 italic">"{bill.notes}"</p>}
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right whitespace-nowrap">
                        <p className="font-bold text-slate-900 text-sm">{formatCurrency(bill.amount, currency)}</p>
                        <button
                          id={`btn-pay-bill-${bill.id}`}
                          onClick={() => onToggleBillStatus(bill.id, true)}
                          className="text-[10px] text-slate-800 font-semibold hover:underline mt-0.5 block ml-auto cursor-pointer"
                        >
                          Marcar como Pago
                        </button>
                      </div>

                      {deletingBillId === bill.id ? (
                        <div className="flex items-center justify-center gap-1 animate-fadeIn">
                          <button
                            id={`btn-confirm-bill-delete-${bill.id}`}
                            onClick={() => {
                              onDeleteBill(bill.id);
                              setDeletingId(null);
                            }}
                            className="bg-rose-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded hover:bg-rose-700 transition-colors cursor-pointer"
                          >
                            Sim
                          </button>
                          <button
                            id={`btn-cancel-bill-delete-${bill.id}`}
                            onClick={() => setDeletingId(null)}
                            className="bg-slate-100 text-slate-650 text-[10px] font-bold px-1.5 py-0.5 rounded hover:bg-slate-200 transition-colors cursor-pointer"
                          >
                            Não
                          </button>
                        </div>
                      ) : (
                        <button
                          id={`btn-delete-bill-${bill.id}`}
                          onClick={() => setDeletingId(bill.id)}
                          className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 hover:scale-110 active:scale-95 transition-all cursor-pointer outline-none focus:outline-none focus-visible:outline-none"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Columns 2: Paid Bills */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-205 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs shadow-emerald-200"></span>
              <h4 className="font-bold text-slate-900 text-sm">Contas Liquidadas</h4>
            </div>
            <span className="text-xs bg-emerald-50 text-emerald-705 font-bold px-2 py-0.5 rounded-full">
              Pagas: {formatCurrency(totals.paid, currency)}
            </span>
          </div>

          {filteredBills.filter(b => b.isPaid).length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400 shadow-xs">
              <CalendarDays className="w-8 h-8 text-slate-200 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-500">Nenhum pagamento registrado</p>
              <p className="text-xs text-slate-400 mt-1">Clique em "Marcar como Pago" na coluna de pendentes para registrar.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[480px] overflow-y-auto scrollbar-thin pr-1">
              {filteredBills.filter(b => b.isPaid).map((bill) => (
                <div
                  key={bill.id}
                  id={`bill-card-paid-${bill.id}`}
                  className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200 hover:border-slate-300 transition-all duration-200 flex items-center justify-between gap-4"
                >
                  <div className="min-w-0 flex-1 opacity-70">
                    <h5 className="font-bold text-slate-900 text-xs sm:text-sm truncate line-through">{bill.description}</h5>
                    <div className="flex items-center gap-2 mt-1 text-[10px] font-medium text-slate-500">
                      <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded">Pago</span>
                      <span className="bg-slate-100 px-1.5 py-0.5 rounded text-gray-600">{bill.category}</span>
                      <span className="font-mono text-slate-400">Venceu: {formatDate(bill.dueDate)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-bold text-emerald-600 text-sm">{formatCurrency(bill.amount, currency)}</p>
                      <button
                        id={`btn-unpay-bill-${bill.id}`}
                        onClick={() => onToggleBillStatus(bill.id, false)}
                        className="text-[10px] text-slate-450 font-semibold hover:text-rose-500 hover:underline mt-0.5 block ml-auto cursor-pointer"
                      >
                        Desfazer Pagamento
                      </button>
                    </div>

                    {deletingBillId === bill.id ? (
                      <div className="flex items-center justify-center gap-1 animate-fadeIn">
                        <button
                          id={`btn-confirm-paid-bill-delete-${bill.id}`}
                          onClick={() => {
                            onDeleteBill(bill.id);
                            setDeletingId(null);
                          }}
                          className="bg-rose-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded hover:bg-rose-700 transition-colors cursor-pointer"
                        >
                          Sim
                        </button>
                        <button
                          id={`btn-cancel-paid-bill-delete-${bill.id}`}
                          onClick={() => setDeletingId(null)}
                          className="bg-slate-100 text-slate-650 text-[10px] font-bold px-1.5 py-0.5 rounded hover:bg-slate-200 transition-colors cursor-pointer"
                        >
                          Não
                        </button>
                      </div>
                    ) : (
                      <button
                        id={`btn-delete-paid-bill-${bill.id}`}
                        onClick={() => setDeletingId(bill.id)}
                        className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 hover:scale-110 active:scale-95 transition-all cursor-pointer outline-none focus:outline-none focus-visible:outline-none"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
