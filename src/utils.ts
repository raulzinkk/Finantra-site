/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Transaction, MonthlyBill, Investment } from './types';

export function formatCurrency(amount: number, currency: string = 'BRL'): string {
  let cleanCurrency = currency;
  if (cleanCurrency === 'R$') cleanCurrency = 'BRL';
  else if (cleanCurrency === '$') cleanCurrency = 'USD';
  else if (cleanCurrency === '€') cleanCurrency = 'EUR';

  // Normalize currency to uppercase and trim
  cleanCurrency = (cleanCurrency || 'BRL').trim().toUpperCase();

  const locale = cleanCurrency === 'BRL' ? 'pt-BR' : cleanCurrency === 'USD' ? 'en-US' : 'de-DE';
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: cleanCurrency,
    }).format(amount);
  } catch (err) {
    // Graceful fallback for any other invalid currency inputs
    try {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(amount);
    } catch {
      return `R$ ${amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
  }
}

export function formatDate(dateString: string): string {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-');
  if (!day) return dateString;
  return `${day}/${month}/${year}`;
}

export const CATEGORIES_EXPENSES = [
  'Alimentação',
  'Moradia',
  'Transporte',
  'Saúde',
  'Educação',
  'Lazer',
  'Vestuário',
  'Automóvel',
  'Outros'
];

export const CATEGORIES_EARNINGS = [
  'Salário',
  'Freelance / Projetos',
  'Investimentos',
  'Prêmios',
  'Reembolsos',
  'Outros'
];

export const PAYMENT_METHODS = [
  'Cartão de Crédito',
  'Cartão de Débito',
  'PIX',
  'Dinheiro',
  'Boleto',
  'Transferência Bancária'
];

export const INVESTMENT_TYPES = [
  'Renda Fixa',
  'Ações',
  'Fundos Imobiliários',
  'Cripto',
  'Outros'
];

// High quality initial preview sample data for a beautiful initial experience (saved to localStorage for first-time visits)
export const SEED_TRANSACTIONS = (profileId: string): Transaction[] => [];

export const SEED_BILLS = (profileId: string): MonthlyBill[] => [];

export const SEED_INVESTMENTS = (profileId: string): Investment[] => [];
