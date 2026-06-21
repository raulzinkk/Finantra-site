/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Database, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';

interface DatabaseStatusProps {
  isCloudSync: boolean;
  onToggleSync: (val: boolean) => void;
  isConnected: boolean;
  testConnectionFn: () => Promise<void>;
  profileId: string;
}

export default function DatabaseStatus({
  isCloudSync,
  onToggleSync,
  isConnected,
  testConnectionFn,
  profileId,
}: DatabaseStatusProps) {
  const [testing, setTesting] = useState(false);

  const handleTest = async () => {
    setTesting(true);
    await testConnectionFn();
    setTesting(false);
  };

  return (
    <div id="database-status-card" className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs transition-all duration-300">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl border bg-emerald-50 text-emerald-700 border-emerald-100">
            <Database className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 tracking-tight text-base">
              Privacidade & Conexão de Dados em Nuvem (Supabase)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Seu aplicativo está configurado para salvar todos os dados de forma 100% online e automática no banco de dados.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto bg-slate-50 border border-slate-150 px-3 py-1.5 rounded-full shadow-2xs">
          <span className="flex h-2 w-2 relative">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isConnected ? 'bg-emerald-400' : 'bg-slate-400'}`}></span>
            <span className={`relative inline-flex rounded-full h-2 w-2 ${isConnected ? 'bg-emerald-500' : 'bg-slate-500'}`}></span>
          </span>
          <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider font-sans">
            {isConnected ? 'Nuvem Finantra Conectada' : 'Aguardando Banco'}
          </span>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50 rounded-2xl p-5 border border-slate-200">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider pb-1">
            <ShieldCheck className="w-4 h-4 text-emerald-600 font-bold" />
            <span>Garantia de Segurança Bancária</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed font-normal">
            Este site não solicita nem possui acesso a contas, limites, senhas ou extratos bancários pessoais. 
            Todo o preenchimento é feito de forma manual e segura, prevenindo vazamentos de carteiras bancárias reais.
          </p>
        </div>

        <div className="flex flex-col justify-between border-t md:border-t-0 md:border-l border-slate-200 pt-4 md:pt-0 md:pl-6">
          <div>
            <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider">Armazenamento Ativo</h4>
            <p className="text-xs text-slate-655 mt-1 leading-relaxed">
              Os lançamentos, despesas e investimentos deste perfil estão configurados para gravação na nuvem através do cliente de banco de dados integrado.
            </p>
          </div>

          <div className="mt-4 text-xs font-mono text-slate-600 bg-slate-100/70 p-2.5 rounded-lg border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-slate-400">Código da Carteira:</span>{' '}
              <span className="font-semibold text-slate-900">{profileId}</span>
            </div>
            <span className="text-[10px] text-slate-505 bg-white px-1.5 py-0.5 rounded border border-slate-200 font-sans font-bold">ID Exclusivo</span>
          </div>
        </div>
      </div>

      <div className="mt-5 border-t border-slate-200 pt-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {isConnected ? (
              <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-full text-xs font-semibold border border-emerald-100">
                <CheckCircle2 className="w-4 h-4 text-emerald-650" />
                Conexão ativa e tabelas prontas na Nuvem Online Finantra (Supabase)
              </div>
            ) : (
              <div className="flex items-center gap-1.5 bg-amber-50 text-amber-805 px-3 py-1.5 rounded-full text-xs font-semibold border border-amber-100">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                Sincronizando de forma segura na nuvem...
              </div>
            )}

            <button
              id="btn-test-connection"
              onClick={handleTest}
              disabled={testing}
              className="text-xs text-slate-800 hover:text-slate-950 hover:underline font-bold cursor-pointer disabled:text-gray-400 ml-1 bg-slate-100 hover:bg-slate-200 px-3 py-1 rounded-lg transition-all"
            >
              {testing ? 'Testando...' : 'Testar Conexão Novamente'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
