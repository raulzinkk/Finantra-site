/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient } from '@supabase/supabase-js';
import { Transaction, MonthlyBill, Investment } from './types';

// Supabase configuration - prefer localStorage, then environment variables, then default sandbox credentials
const getInitialUrl = (): string => {
  const localUrl = localStorage.getItem('finantra_supabase_url');
  if (localUrl) return localUrl.trim();
  const envUrl = ((import.meta as any).env.VITE_SUPABASE_URL || 'https://your-supabase-url.supabase.co').trim();
  return envUrl;
};

const getInitialAnonKey = (): string => {
  const localKey = localStorage.getItem('finantra_supabase_anon_key');
  if (localKey) return localKey.trim();
  return ((import.meta as any).env.VITE_SUPABASE_ANON_KEY || 'your-supabase-anon-key').trim();
};

function getCleanUrl(url: string): string {
  const trimmed = url.trim();
  return trimmed.endsWith('/rest/v1/') 
    ? trimmed.replace('/rest/v1/', '') 
    : trimmed.endsWith('/') 
      ? trimmed.slice(0, -1) 
      : trimmed;
}

export let supabase = createClient(getCleanUrl(getInitialUrl()), getInitialAnonKey());

/**
 * Checks if the configured anonymous key is the default/fallback sandbox key.
 */
export function isUsingDefaultSandboxKey(): boolean {
  const currentKey = localStorage.getItem('finantra_supabase_anon_key') || (import.meta as any).env.VITE_SUPABASE_ANON_KEY || 'your-supabase-anon-key';
  const trimmed = currentKey.trim();
  return trimmed === 'your-supabase-anon-key' || trimmed === 'sb_publishable_lOxCUSN6EtKBcLW1JYpK7w_LJAL4Ald' || trimmed === 'sb_secret_w_KYDWZGJ2CcseG02uLLpw_BDf6jxhq' || trimmed === '';
}

/**
 * Returns the current URL and Anon Key used by the client.
 */
export function getSavedSupabaseConfig(): { url: string; anonKey: string } {
  return {
    url: localStorage.getItem('finantra_supabase_url') || (import.meta as any).env.VITE_SUPABASE_URL || 'https://your-supabase-url.supabase.co',
    anonKey: localStorage.getItem('finantra_supabase_anon_key') || (import.meta as any).env.VITE_SUPABASE_ANON_KEY || 'your-supabase-anon-key'
  };
}

/**
 * Updates the Supabase configuration in localStorage and recreates the client.
 */
export function updateSupabaseConfig(url: string, key: string) {
  const trimmedUrl = url.trim();
  const trimmedKey = key.trim();
  localStorage.setItem('finantra_supabase_url', trimmedUrl);
  localStorage.setItem('finantra_supabase_anon_key', trimmedKey);
  
  // Update the live binding for the application to pick it up instantly
  supabase = createClient(getCleanUrl(trimmedUrl), trimmedKey);
}

/**
 * Resets the credentials to default sandbox, removing any saved configurations.
 */
export function resetSupabaseConfig() {
  localStorage.removeItem('finantra_supabase_url');
  localStorage.removeItem('finantra_supabase_anon_key');
  
  // Revert back live binding to original fallback keys
  const defaultUrl = ((import.meta as any).env.VITE_SUPABASE_URL || 'https://your-supabase-url.supabase.co').trim();
  const defaultKey = ((import.meta as any).env.VITE_SUPABASE_ANON_KEY || 'your-supabase-anon-key').trim();
  supabase = createClient(getCleanUrl(defaultUrl), defaultKey);
}

/**
 * SQL generation command to assist users in preparing their Nuvem Online Finantra database.
 */
export const SUPABASE_SQL_SETUP = `
-- Execute este script no SQL Editor do seu console de Nuvem Online Finantra para criar as tabelas necessárias:

-- 1. Tabela de Transações (Ganhos e Gastos)
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('earnings', 'expenses')),
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  category TEXT NOT NULL,
  date TEXT NOT NULL,
  payment_method TEXT NOT NULL,
  notes TEXT,
  profile_id TEXT NOT NULL
);

-- 2. Tabela de Contas Mensais
CREATE TABLE IF NOT EXISTS monthly_bills (
  id TEXT PRIMARY KEY,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  due_date TEXT NOT NULL,
  category TEXT NOT NULL,
  is_paid BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT,
  profile_id TEXT NOT NULL
);

-- 3. Tabela de Investimentos
CREATE TABLE IF NOT EXISTS investments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  amount_invested NUMERIC NOT NULL,
  current_amount NUMERIC NOT NULL,
  yield_rate NUMERIC,
  acquisition_date TEXT NOT NULL,
  broker TEXT NOT NULL,
  profile_id TEXT NOT NULL
);

-- Habilitar acesso público às tabelas (ou configurar RLS) para o CLIENT ANON KEY
-- Para simplicidade neste exemplo prático, desabilitaremos RLS ou liberaremos permissões:
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_bills DISABLE ROW LEVEL SECURITY;
ALTER TABLE investments DISABLE ROW LEVEL SECURITY;
`;

// Helper to check if a table is accessible or if Supabase is reachable
export async function testConnection(): Promise<boolean> {
  try {
    // Attempt a lightweight system query first
    const { error: authError } = await supabase.auth.getSession();
    if (authError && authError.message?.includes('FetchError')) {
      return false;
    }
    
    // Check if we can reach the transactions table or if we can make a lighter test
    const { data, error } = await supabase.from('transactions').select('id').limit(1);
    if (error) {
      // If error code is about missing relation/table, the server IS connected/reachable, but tables are just not built.
      if (error.code === '42P01' || error.message?.includes('does not exist') || error.code === 'PGRST116') {
        console.log('Supabase is connected, but transactions table does not exist yet.');
        return true; // The connection itself is alive!
      }
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase testConnection exception:', err);
    return false;
  }
}

// TRANSACTIONS
export async function fetchTransactions(profileId: string): Promise<Transaction[] | null> {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('profile_id', profileId);
    
    if (error) throw error;
    
    // Map database snake_case back to camelCase
    return (data || []).map((t: any) => ({
      id: t.id,
      type: t.type,
      description: t.description,
      amount: Number(t.amount),
      category: t.category,
      date: t.date,
      paymentMethod: t.payment_method || t.paymentMethod || 'Manual',
      notes: t.notes,
      profileId: t.profile_id
    }));
  } catch (err) {
    console.warn('Supabase fetchTransactions error, falling back to local: ', err);
    return null;
  }
}

export async function upsertTransaction(transaction: Transaction): Promise<boolean> {
  try {
    const dbObj = {
      id: transaction.id,
      type: transaction.type,
      description: transaction.description,
      amount: transaction.amount,
      category: transaction.category,
      date: transaction.date,
      payment_method: transaction.paymentMethod,
      notes: transaction.notes || '',
      profile_id: transaction.profileId
    };

    const { error } = await supabase
      .from('transactions')
      .upsert(dbObj, { onConflict: 'id' });

    if (error) throw error;
    return true;
  } catch (err) {
    console.warn('Supabase upsertTransaction error: ', err);
    return false;
  }
}

export async function deleteTransactionFromDb(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (err) {
    console.warn('Supabase deleteTransaction error: ', err);
    return false;
  }
}

// MONTHLY BILLS
export async function fetchMonthlyBills(profileId: string): Promise<MonthlyBill[] | null> {
  try {
    const { data, error } = await supabase
      .from('monthly_bills')
      .select('*')
      .eq('profile_id', profileId);

    if (error) throw error;

    return (data || []).map((b: any) => ({
      id: b.id,
      description: b.description,
      amount: Number(b.amount),
      dueDate: b.due_date || b.dueDate,
      category: b.category,
      isPaid: b.is_paid !== undefined ? b.is_paid : b.isPaid,
      notes: b.notes,
      profileId: b.profile_id
    }));
  } catch (err) {
    console.warn('Supabase fetchMonthlyBills error, falling back to local: ', err);
    return null;
  }
}

export async function upsertMonthlyBill(bill: MonthlyBill): Promise<boolean> {
  try {
    const dbObj = {
      id: bill.id,
      description: bill.description,
      amount: bill.amount,
      due_date: bill.dueDate,
      category: bill.category,
      is_paid: bill.isPaid,
      notes: bill.notes || '',
      profile_id: bill.profileId
    };

    const { error } = await supabase
      .from('monthly_bills')
      .upsert(dbObj, { onConflict: 'id' });

    if (error) throw error;
    return true;
  } catch (err) {
    console.warn('Supabase upsertMonthlyBill error: ', err);
    return false;
  }
}

export async function deleteMonthlyBillFromDb(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('monthly_bills')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (err) {
    console.warn('Supabase deleteMonthlyBill error: ', err);
    return false;
  }
}

// INVESTMENTS
export async function fetchInvestments(profileId: string): Promise<Investment[] | null> {
  try {
    const { data, error } = await supabase
      .from('investments')
      .select('*')
      .eq('profile_id', profileId);

    if (error) throw error;

    return (data || []).map((i: any) => ({
      id: i.id,
      name: i.name,
      type: i.type,
      amountInvested: Number(i.amount_invested || i.amountInvested),
      currentAmount: Number(i.current_amount || i.currentAmount),
      yieldRate: i.yield_rate !== null ? Number(i.yield_rate) : undefined,
      acquisitionDate: i.acquisition_date || i.acquisitionDate,
      broker: i.broker,
      profileId: i.profile_id
    }));
  } catch (err) {
    console.warn('Supabase fetchInvestments error, falling back to local: ', err);
    return null;
  }
}

export async function upsertInvestment(investment: Investment): Promise<boolean> {
  try {
    const dbObj = {
      id: investment.id,
      name: investment.name,
      type: investment.type,
      amount_invested: investment.amountInvested,
      current_amount: investment.currentAmount,
      yield_rate: investment.yieldRate || 0,
      acquisition_date: investment.acquisitionDate,
      broker: investment.broker,
      profile_id: investment.profileId
    };

    const { error } = await supabase
      .from('investments')
      .upsert(dbObj, { onConflict: 'id' });

    if (error) throw error;
    return true;
  } catch (err) {
    console.warn('Supabase upsertInvestment error: ', err);
    return false;
  }
}

export async function deleteInvestmentFromDb(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('investments')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (err) {
    console.warn('Supabase deleteInvestment error: ', err);
    return false;
  }
}
