/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Transaction, TransactionType } from '../types';
import {
  CATEGORIES_EARNINGS,
  CATEGORIES_EXPENSES,
  PAYMENT_METHODS,
  formatCurrency,
  formatDate
} from '../utils';
import {
  Search,
  Plus,
  Trash2,
  ListFilter,
  ArrowDownCircle,
  ArrowUpCircle,
  Calendar,
  DollarSign,
  Tag,
  CreditCard,
  FileText,
  X
} from 'lucide-react';

interface TransactionsTabProps {
  transactions: Transaction[];
  onAddTransaction: (trans: Omit<Transaction, 'id' | 'profileId'>) => void;
  onDeleteTransaction: (id: string) => void;
  currency: string;
}

export default function TransactionsTab({
  transactions,
  onAddTransaction,
  onDeleteTransaction,
  currency,
}: TransactionsTabProps) {
  // States
  const [filterType, setFilterType] = useState<'all' | 'earnings' | 'expenses'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form States
  const [formType, setFormType] = useState<TransactionType>('expenses');
  const [formDescription, setFormDescription] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().substring(0, 10));
  const [formPayment, setFormPayment] = useState(PAYMENT_METHODS[0]);
  const [formNotes, setFormNotes] = useState('');

  // Automatically match first category based on type selection to avoid invalid values
  const handleTypeToggle = (type: TransactionType) => {
    setFormType(type);
    setFormCategory(type === 'earnings' ? CATEGORIES_EARNINGS[0] : CATEGORIES_EXPENSES[0]);
  };

  // Populate first category on click open
  const startAddForm = () => {
    setFormCategory(formType === 'earnings' ? CATEGORIES_EARNINGS[0] : CATEGORIES_EXPENSES[0]);
    setShowAddForm(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = parseFloat(formAmount);
    if (!formDescription.trim()) return alert('Insira uma descrição válida!');
    if (isNaN(amountVal) || amountVal <= 0) return alert('Insira um valor maior que R$ 0,00!');
    
    onAddTransaction({
      type: formType,
      description: formDescription.trim(),
      amount: amountVal,
      category: formCategory || (formType === 'earnings' ? CATEGORIES_EARNINGS[0] : CATEGORIES_EXPENSES[0]),
      date: formDate,
      paymentMethod: formPayment,
      notes: formNotes.trim()
    });

    // Reset Form
    setFormDescription('');
    setFormAmount('');
    setFormNotes('');
    setShowAddForm(false);
  };

  // Categories list based on filter
  const allAvailableCategories = useMemo(() => {
    const list = new Set<string>();
    transactions.forEach(t => list.add(t.category));
    return Array.from(list);
  }, [transactions]);

  // Filter & Search Logic
  const filteredList = useMemo(() => {
    return transactions
      .filter((t) => {
        const matchesType = filterType === 'all' || t.type === filterType;
        const matchesQuery = t.description.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             (t.notes || '').toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || t.category === selectedCategory;
        return matchesType && matchesQuery && matchesCategory;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, filterType, searchQuery, selectedCategory]);

  return (
    <div className="space-y-6">
      {/* Search and Filters Strip */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col md:flex-row gap-4 items-center justify-between shadow-xs">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Quick Type Filter Selector */}
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              id="filter-type-all"
              onClick={() => setFilterType('all')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all duration-150 ${
                filterType === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Todos ({transactions.length})
            </button>
            <button
              id="filter-type-earnings"
              onClick={() => setFilterType('earnings')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all duration-150 ${
                filterType === 'earnings' ? 'bg-white text-emerald-600 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Ganhos ({transactions.filter(t => t.type === 'earnings').length})
            </button>
            <button
              id="filter-type-expenses"
              onClick={() => setFilterType('expenses')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all duration-150 ${
                filterType === 'expenses' ? 'bg-white text-rose-500 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Gastos ({transactions.filter(t => t.type === 'expenses').length})
            </button>
          </div>

          {/* Category Dropdown Selector */}
          <div className="relative shrink-0">
            <select
              id="category-filter-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="appearance-none bg-slate-50 border border-slate-200 text-xs rounded-xl px-4 py-2.5 pr-8 font-medium text-slate-700 outline-none hover:bg-slate-100/70 focus:border-slate-800 transition-colors cursor-pointer"
            >
              <option value="all">Ver todas categorias</option>
              {allAvailableCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <ListFilter className="w-3.5 h-3.5 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Search box input */}
          <div className="relative w-full md:w-64">
            <input
              id="transaction-search-input"
              type="text"
              placeholder="Buscar por descrição..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl pl-9 pr-4 py-2.5 text-slate-800 outline-none hover:bg-slate-100/70 focus:border-slate-800 focus:bg-white transition-all"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>

          {/* Quick trigger Add Transaction */}
          <button
            id="btn-open-add-transaction"
            onClick={startAddForm}
            className="shrink-0 bg-[#0F172A] hover:bg-slate-800 text-white rounded-lg px-4 py-2.5 text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors active:scale-95 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Lançar Transação
          </button>
        </div>
      </div>

      {/* Add Transaction Form Card */}
      {showAddForm && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 relative animate-fadeIn shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-150 pb-3 mb-5">
            <h3 className="font-bold text-slate-900 text-base">Novo Lançamento Financeiro</h3>
            <button
              id="btn-close-add-form"
              onClick={() => setShowAddForm(false)}
              className="text-slate-400 hover:text-slate-650 p-1 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-5">
            {/* Type selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Tipo da Transação
              </label>
              <div className="flex gap-4">
                <button
                  id="form-type-expense"
                  type="button"
                  onClick={() => handleTypeToggle('expenses')}
                  className={`flex-1 py-3 px-4 rounded-xl text-xs font-semibold border flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 ${
                    formType === 'expenses'
                      ? 'border-rose-450 bg-rose-50 text-rose-700 font-bold'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <ArrowDownCircle className="w-4 h-4" />
                  Gasto / Despesa
                </button>
                <button
                  id="form-type-earning"
                  type="button"
                  onClick={() => handleTypeToggle('earnings')}
                  className={`flex-1 py-3 px-4 rounded-xl text-xs font-semibold border flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 ${
                    formType === 'earnings'
                      ? 'border-emerald-450 bg-emerald-50 text-emerald-700 font-bold'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <ArrowUpCircle className="w-4 h-4" />
                  Ganho / Receita
                </button>
              </div>
            </div>

            {/* Inputs grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Descrição
                </label>
                <div id="wrapper-input-description" className="relative">
                  <input
                    id="input-desc"
                    type="text"
                    required
                    maxLength={100}
                    placeholder="Ex: Almoço self-service, Freelance, Pix etc..."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 focus:border-blue-500 focus:bg-white text-xs rounded-xl pl-9 pr-3 py-2.5 text-gray-800 outline-none transition-all"
                  />
                  <FileText className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Valor ({currency})
                </label>
                <div id="wrapper-input-amount" className="relative">
                  <input
                    id="input-amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="Ex: 50.00"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 focus:border-blue-500 focus:bg-white text-xs rounded-xl pl-9 pr-3 py-2.5 text-gray-800 outline-none transition-all font-mono"
                  />
                  <DollarSign className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Categoria
                </label>
                <div id="wrapper-input-category" className="relative">
                  <select
                    id="select-category"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 focus:border-blue-500 focus:bg-white text-xs rounded-xl pl-9 pr-3 py-2.5 text-gray-800 outline-none transition-all cursor-pointer appearance-none"
                  >
                    {formType === 'earnings'
                      ? CATEGORIES_EARNINGS.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))
                      : CATEGORIES_EXPENSES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                  </select>
                  <Tag className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Data
                </label>
                <div id="wrapper-input-date" className="relative">
                  <input
                    id="input-date"
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 focus:border-blue-500 focus:bg-white text-xs rounded-xl pl-9 pr-3 py-2.5 text-gray-800 outline-none transition-all font-mono"
                  />
                  <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Método de Pagamento
                </label>
                <div id="wrapper-input-payment" className="relative">
                  <select
                    id="select-payment"
                    value={formPayment}
                    onChange={(e) => setFormPayment(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 focus:border-blue-500 focus:bg-white text-xs rounded-xl pl-9 pr-3 py-2.5 text-gray-800 outline-none transition-all cursor-pointer appearance-none"
                  >
                    {PAYMENT_METHODS.map((method) => (
                      <option key={method} value={method}>
                        {method}
                      </option>
                    ))}
                  </select>
                  <CreditCard className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Observações (Opcional)
                </label>
                <input
                  id="input-notes"
                  type="text"
                  placeholder="Ex: Lanche da tarde no trabalho..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 focus:bg-white text-xs rounded-xl px-4 py-2.5 text-slate-800 outline-none transition-all"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                id="btn-form-cancel"
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-500 border border-slate-200 hover:bg-slate-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                id="btn-form-save"
                type="submit"
                className="px-4 py-2 bg-[#0F172A] hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer active:scale-95 transition-transform"
              >
                Salvar Transação
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Transactions Table / List view */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-slate-155 flex items-center justify-between">
          <h4 className="font-bold text-slate-900 text-sm">Histórico de Lançamentos</h4>
          <span className="text-xs font-medium text-slate-400 font-mono">
            Mostrando {filteredList.length} de {transactions.length} registros
          </span>
        </div>

        {filteredList.length === 0 ? (
          <div className="py-12 px-6 text-center text-slate-400 flex flex-col items-center justify-center">
            <Tag className="w-10 h-10 text-slate-200 mb-3" />
            <p className="text-sm font-medium">Nenhuma transação encontrada</p>
            <p className="text-xs text-slate-400 mt-1">Refine seus filtros acima ou clique em "Lançar Transação" para começar.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-150 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-6">Lançamento / Categoria</th>
                  <th className="py-3.5 px-4">Método</th>
                  <th className="py-3.5 px-4">Data</th>
                  <th className="py-3.5 px-4 text-right">Valor</th>
                  <th className="py-3.5 px-6 text-center w-16">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredList.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl shrink-0 ${
                          t.type === 'earnings' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'
                        }`}>
                          {t.type === 'earnings' ? (
                            <ArrowUpCircle className="w-4 h-4" />
                          ) : (
                            <ArrowDownCircle className="w-4 h-4" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p id={`trans-desc-${t.id}`} className="font-semibold text-gray-900 truncate">{t.description}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                              {t.category}
                            </span>
                            {t.notes && (
                              <span className="text-[10px] text-gray-400 truncate max-w-[150px] italic">
                                "{t.notes}"
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-gray-600 font-medium whitespace-nowrap">
                      {t.paymentMethod}
                    </td>
                    <td className="py-4 px-4 text-gray-500 font-mono whitespace-nowrap">
                      {formatDate(t.date)}
                    </td>
                    <td className="py-4 px-4 text-right font-bold whitespace-nowrap">
                      <span className={t.type === 'earnings' ? 'text-emerald-600' : 'text-rose-600'}>
                        {t.type === 'earnings' ? '+' : '-'} {formatCurrency(t.amount, currency)}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      {deletingId === t.id ? (
                        <div className="flex items-center justify-center gap-1.5 animate-fadeIn">
                          <button
                            id={`btn-confirm-delete-${t.id}`}
                            onClick={() => {
                              onDeleteTransaction(t.id);
                              setDeletingId(null);
                            }}
                            className="bg-rose-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg hover:bg-rose-700 transition-colors cursor-pointer"
                          >
                            Sim
                          </button>
                          <button
                            id={`btn-cancel-delete-${t.id}`}
                            onClick={() => setDeletingId(null)}
                            className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2.5 py-1 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
                          >
                            Não
                          </button>
                        </div>
                      ) : (
                        <button
                          id={`btn-delete-${t.id}`}
                          onClick={() => setDeletingId(t.id)}
                          className="text-gray-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 hover:scale-110 active:scale-95 transition-all cursor-pointer outline-none focus:outline-none focus-visible:outline-none"
                          title="Remover transação"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
