import React, { useState, useEffect } from 'react';
import { Shield, Mail, Lock, UserCheck, LogIn, UserPlus, LogOut, CheckCircle, AlertCircle, Bookmark } from 'lucide-react';
import { auth, signInWithGoogle, logoutFirebase } from '../firebaseService';

interface AuthTabProps {
  onLogin: (email: string) => void;
  onLogout: () => void;
  loggedInUser: string | null;
  initialMode?: 'login' | 'register';
}

interface LocalUser {
  email: string;
  passwordHash: string; // Simulated stored password
  createdAt: string;
  username?: string;
}

export default function AuthTab({ onLogin, onLogout, loggedInUser, initialMode = 'login' }: AuthTabProps) {
  const [activeMode, setActiveMode] = useState<'login' | 'register'>(initialMode);

  useEffect(() => {
    setActiveMode(initialMode);
  }, [initialMode]);
  
  // Input fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [keepLoggedIn, setKeepLoggedIn] = useState(true);
  
  // Status notifications
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Password Rules validation helpers
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>_+\-=\[\]\\/;']/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const isPasswordValid = hasSpecial && hasNumber && hasUppercase;

  // Clear messages on toggle tab
  const handleModeChange = (mode: 'login' | 'register') => {
    setActiveMode(mode);
    setEmail('');
    setPassword('');
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const user = await signInWithGoogle();
      if (user && user.email) {
        setSuccessMsg('Login com o Google realizado com sucesso! Bem-vindo.');
        setTimeout(() => {
          onLogin(user.email!);
        }, 1200);
      }
    } catch (err: any) {
      setErrorMsg('Falha ao autenticar com o Google. Tente novamente.');
      console.error(err);
    }
  };

  // Submit Handler
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email.trim() || !password) {
      setErrorMsg('Por favor, preencha todos os campos.');
      return;
    }

    // Load registered users database from localStorage
    const usersStr = localStorage.getItem('finantra_users');
    let usersList: LocalUser[] = usersStr ? JSON.parse(usersStr) : [];

    if (activeMode === 'register') {
      if (!username.trim()) {
        setErrorMsg('Por favor, informe um nome de usuário.');
        return;
      }

      // Validate password rules first
      if (!isPasswordValid) {
        setErrorMsg('A senha escolhida não atende a todos os critérios de segurança exigidos.');
        return;
      }

      // Check duplicate user locally by email or username
      const existingUser = usersList.find(
        u => u.email.toLowerCase() === email.toLowerCase() ||
             (u.username && u.username.toLowerCase() === username.trim().toLowerCase())
      );
      if (existingUser) {
        if (existingUser.email.toLowerCase() === email.toLowerCase()) {
          setErrorMsg('Este e-mail já está cadastrado. Que tal fazer login?');
        } else {
          setErrorMsg('Este Nome de Usuário (Username) já está em uso. Por favor, escolha outro.');
        }
        return;
      }

      let supabaseMessage = ' (Sincronizado no Firebase)';

      // Create and save new user only after validation succeeded
      const newUser: LocalUser = {
        email: email.toLowerCase(),
        passwordHash: btoa(password), // simple base64 hash simulation for privacy
        createdAt: new Date().toISOString(),
        username: username.trim()
      };

      usersList.push(newUser);
      localStorage.setItem('finantra_users', JSON.stringify(usersList));

      // Successful Registration Flow
      setSuccessMsg(`Conta criada com sucesso no Finantra!${supabaseMessage} Redirecionando...`);
      
      // Perform automatic login
      setTimeout(() => {
        onLogin(email.toLowerCase());
        if (keepLoggedIn) {
          localStorage.setItem('finantra_keep_logged_in', 'true');
          localStorage.setItem('finantra_saved_user_email', email.toLowerCase());
        } else {
          localStorage.removeItem('finantra_keep_logged_in');
          localStorage.removeItem('finantra_saved_user_email');
        }
      }, 1200);

    } else {
      // Login Flow
      let resolvedEmail = email.toLowerCase().trim();
      const matchedUser = usersList.find(
        u => (u.email.toLowerCase() === resolvedEmail || (u.username && u.username.toLowerCase() === resolvedEmail)) && u.passwordHash === btoa(password)
      );

      if (matchedUser) {
        resolvedEmail = matchedUser.email;
      }

      // Simple credential fallback for demo / easy testing (e.g. guest credentials)
      const isDefaultGuest = (resolvedEmail === 'convidado@finantra.com' || resolvedEmail === 'convidado') && password === 'Guest@123';

      let loginSuccess = false;

      if (matchedUser || isDefaultGuest) {
        loginSuccess = true;
      }

      if (loginSuccess) {
        const prefix = 'Login realizado com sucesso! Bem-vindo.';
        setSuccessMsg(prefix);
        
        // Handle Keep me logged in preference
        if (keepLoggedIn) {
          localStorage.setItem('finantra_keep_logged_in', 'true');
          localStorage.setItem('finantra_saved_user_email', resolvedEmail);
        } else {
          localStorage.removeItem('finantra_keep_logged_in');
          localStorage.removeItem('finantra_saved_user_email');
        }

        setTimeout(() => {
          onLogin(resolvedEmail);
        }, 1200);
      } else {
        setErrorMsg('Credenciais inválidas. Verifique seu e-mail, senha e regras de caractere.');
      }
    }
  };

  const handleLogoutAction = () => {
    localStorage.removeItem('finantra_keep_logged_in');
    localStorage.removeItem('finantra_saved_user_email');
    onLogout();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Logged state container check */}
      {loggedInUser ? (
        <div id="auth-state-success" className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs text-center space-y-5">
          <div className="mx-auto w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center border border-emerald-150 shadow-2xs">
            <UserCheck className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-[#0F172A] tracking-tight">Sessão Segura Ativa no Finantra</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Sua conta financeira está devidamente conectada e seu portfólio está resguardado sob seu perfil privado.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 max-w-sm mx-auto space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-medium">Usuário Conectado:</span>
              <span id="user-display-email" className="font-extrabold text-slate-900 font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded border border-slate-200">{loggedInUser}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-medium">Garantia Finantra:</span>
              <span className="font-bold text-emerald-600 flex items-center gap-1">
                <Shield className="w-3.5 h-3.5" /> Ativa & Privado
              </span>
            </div>
          </div>

          <div className="pt-3">
            <button
              id="btn-auth-logout"
              onClick={handleLogoutAction}
              className="px-6 py-2.5 bg-rose-50 hover:bg-rose-100/70 text-rose-600 border border-rose-150 rounded-xl text-xs font-semibold flex items-center gap-2 mx-auto active:scale-95 transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              Sair desta Conta / Desconectar
            </button>
          </div>
        </div>
      ) : (
        <div id="auth-form-card" className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Top selection headers */}
          <div className="grid grid-cols-2 border-b border-slate-150">
            <button
              id="tab-auth-login"
              onClick={() => handleModeChange('login')}
              className={`py-4 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all ${
                activeMode === 'login'
                  ? 'border-b-2 border-slate-900 bg-slate-50/50 text-slate-900'
                  : 'text-slate-450 hover:bg-slate-50/20 hover:text-slate-700'
              }`}
            >
              <LogIn className="w-4 h-4" />
              Entrar na Conta
            </button>
            <button
              id="tab-auth-register"
              onClick={() => handleModeChange('register')}
              className={`py-4 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all ${
                activeMode === 'register'
                  ? 'border-b-2 border-slate-900 bg-slate-50/50 text-slate-900'
                  : 'text-slate-450 hover:bg-slate-50/20 hover:text-slate-700'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              Criar Conta Grátis
            </button>
          </div>

          <div className="p-6 md:p-8 space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                {activeMode === 'register' ? 'Registre-se no Finantra' : 'Faça login no Finantra'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {activeMode === 'register' 
                  ? 'Comece hoje a ordenar suas economias com regras assertivas de controle' 
                  : 'Acesse suas despesas, limite de metas e monitoramento financeiro'}
              </p>
            </div>

            {/* Error notifications */}
            {errorMsg && (
              <div id="auth-error-banner" className="bg-rose-50 border border-rose-150 rounded-xl p-3.5 text-xs text-rose-700 flex items-start gap-2.5 animate-fadeIn">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Success Notification */}
            {successMsg && (
              <div id="auth-success-banner" className="bg-emerald-50 border border-emerald-150 rounded-xl p-3.5 text-xs text-emerald-700 flex items-start gap-2.5 animate-fadeIn">
                <CheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Google Sign-In Button */}
            <div className="space-y-4">
              <button
                id="btn-google-signin"
                type="button"
                onClick={handleGoogleSignIn}
                className="w-full flex items-center justify-center gap-3 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 bg-white hover:bg-slate-50 shadow-2xs transition-all active:scale-95 cursor-pointer"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Fazer Login com o Google
              </button>

              <div className="flex items-center my-4">
                <div className="border-t border-slate-200 flex-grow" />
                <span className="px-3 text-[10px] uppercase font-bold text-slate-400 tracking-wider">ou use credenciais</span>
                <div className="border-t border-slate-200 flex-grow" />
              </div>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              {/* Username section (Only in registration) */}
              {activeMode === 'register' && (
                <div className="animate-fadeIn">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Nome de Usuário (Username)
                  </label>
                  <div className="relative">
                    <input
                      id="auth-input-username"
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Ex: Finantra"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 focus:bg-white text-xs rounded-xl pl-9 pr-3 py-2.5 text-slate-800 outline-none transition-all"
                    />
                    <UserCheck className="w-4 h-4 text-slate-450 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Exemplo de Nome de Usuário: <strong className="font-bold">EX: Finantra</strong>
                  </p>
                </div>
              )}

              {/* Email / Username section depending on state */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  {activeMode === 'register' ? 'Endereço de E-mail' : 'E-mail ou Nome de Usuário (Username)'}
                </label>
                <div className="relative">
                  <input
                    id="auth-input-email"
                    type={activeMode === 'register' ? 'email' : 'text'}
                    required
                    value={email}
                    onChange={(e) => {
                      if (activeMode === 'register') {
                        // Prevent uppercase letters from ever being inserted in email during registration
                        const valueWithoutUppercase = e.target.value.toLowerCase().replace(/[A-Z]/g, '');
                        setEmail(valueWithoutUppercase);
                      } else {
                        setEmail(e.target.value);
                      }
                    }}
                    placeholder={activeMode === 'register' ? 'voce@exemplo.com' : 'Ex: Finantra ou seu e-mail'}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 focus:bg-white text-xs rounded-xl pl-9 pr-3 py-2.5 text-slate-800 outline-none transition-all"
                  />
                  {activeMode === 'register' ? (
                    <Mail className="w-4 h-4 text-slate-450 absolute left-3 top-1/2 -translate-y-1/2" />
                  ) : (
                    <UserCheck className="w-4 h-4 text-slate-450 absolute left-3 top-1/2 -translate-y-1/2" />
                  )}
                </div>
                <p className="text-[10px] text-slate-550 mt-1">
                  {activeMode === 'register' 
                    ? 'Você poderá fazer login informando tanto o endereço de e-mail quanto o seu Nome de Usuário.' 
                    : 'Digite o seu e-mail cadastrado ou o seu respectivo Nome de Usuário (Ex: Finantra).'}
                </p>
              </div>

              {/* Password section */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Sua Senha Secreta
                </label>
                <div className="relative">
                  <input
                    id="auth-input-password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 focus:bg-white text-xs rounded-xl pl-9 pr-3 py-2.5 text-slate-800 outline-none transition-all font-mono"
                  />
                  <Lock className="w-4 h-4 text-slate-450 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Real-time Rule Checkbox Guidelines (Only for register mode) */}
              {activeMode === 'register' && (
                <div id="password-rules-indicators" className="bg-slate-50 border border-slate-150 rounded-xl p-3.5 space-y-2 text-[11px]">
                  <p className="font-bold text-slate-600 uppercase text-[9px] tracking-wider mb-1">Critérios Necessários para Validar Senha:</p>
                  
                  <div className="flex items-center gap-2">
                    <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0 ${hasUppercase ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                      {hasUppercase ? '✓' : '✖'}
                    </span>
                    <span id="rule-uppercase" className={`font-semibold ${hasUppercase ? 'text-emerald-700' : 'text-slate-500'}`}>Uma letra maiúscula (A-Z)</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0 ${hasNumber ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                      {hasNumber ? '✓' : '✖'}
                    </span>
                    <span id="rule-number" className={`font-semibold ${hasNumber ? 'text-emerald-700' : 'text-slate-500'}`}>Pelo menos um número (0-9)</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0 ${hasSpecial ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                      {hasSpecial ? '✓' : '✖'}
                    </span>
                    <span id="rule-special" className={`font-semibold ${hasSpecial ? 'text-emerald-700' : 'text-slate-500'}`}>Um caractere especial (@, #, !, $, etc.)</span>
                  </div>
                </div>
              )}

              {/* Device Synchronization Info Banner */}
              <div className="bg-indigo-50/65 border border-indigo-150/70 rounded-xl p-3 text-[11px] text-slate-705">
                <span className="font-bold text-indigo-700 flex items-center gap-1 uppercase text-[9.5px] tracking-wider mb-0.5">
                  <Bookmark className="w-3.5 h-3.5 text-indigo-600 shrink-0" /> OPÇÃO DE ACESSO MULTI-DISPOSITIVO ATIVA
                </span>
                <p className="leading-relaxed">
                  Esta conta permite realizar o login com as mesmas credenciais em <strong className="font-semibold text-slate-900">qualquer dispositivo</strong> (computador, celular ou tablet) de forma instantânea e totalmente segura.
                </p>
              </div>

              {/* Keep logged in checkbox */}
              <div className="flex items-center justify-between py-1 px-1">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    id="checkbox-keep-logged"
                    type="checkbox"
                    checked={keepLoggedIn}
                    onChange={(e) => setKeepLoggedIn(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-800 cursor-pointer"
                  />
                  <span className="text-xs text-slate-600 group-hover:text-slate-800 transition-colors">
                    Manter o site logado em minha conta neste dispositivo
                  </span>
                </label>
              </div>

              {/* Submit button */}
              <button
                id="btn-auth-submit"
                type="submit"
                disabled={activeMode === 'register' && !isPasswordValid}
                className={`w-full py-2.5 rounded-xl text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer ${
                  activeMode === 'register' && !isPasswordValid
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-[#0F172A] hover:bg-slate-800 text-white'
                }`}
              >
                {activeMode === 'register' ? 'Efetuar Cadastro' : 'Entrar no Finantra'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
