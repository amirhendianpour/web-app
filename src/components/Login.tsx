import React, { useState } from 'react';
import { loginWithPassword, requestOtp } from '../services/authService';
import type { AuthResponse } from '../types/Auth';

interface LoginProps {
  onLoginSuccess: (auth: AuthResponse) => void;
  onSwitchToRegister: () => void;
  onOtpRequested: (identifier: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess, onSwitchToRegister, onOtpRequested }) => {
  const [mode, setMode] = useState<'password' | 'otp'>('password');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!identifier.trim() || !password) {
      setError('لطفاً همه فیلدها را پر کنید.');
      return;
    }
    setIsLoading(true);
    try {
      const auth: AuthResponse = await loginWithPassword(identifier.trim(), password);
      onLoginSuccess(auth);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!identifier.trim()) {
      setError('ایمیل یا شماره موبایل را وارد کنید.');
      return;
    }
    setIsLoading(true);
    try {
      await requestOtp(identifier.trim());
      onOtpRequested(identifier.trim());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-100 font-sans" dir="rtl">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-3xl shadow-lg">💬</div>
          <h1 className="text-2xl font-bold text-gray-800">ورود به پیام‌رسان</h1>
        </div>

        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => setMode('password')}
            className={`flex-1 py-2 text-sm font-semibold transition ${mode === 'password' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
          >
            ورود با رمز عبور
          </button>
          <button
            onClick={() => setMode('otp')}
            className={`flex-1 py-2 text-sm font-semibold transition ${mode === 'otp' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
          >
            ورود با کد یکبار مصرف
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={mode === 'password' ? handlePasswordLogin : handleOtpLogin} className="space-y-5">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">ایمیل یا شماره موبایل</label>
            <input
              type="text" value={identifier} onChange={(e) => setIdentifier(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-left"
              placeholder="+989120000000 یا you@example.com" dir="ltr"
            />
          </div>

          {mode === 'password' && (
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">رمز عبور</label>
              <input
                type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                dir="ltr"
              />
            </div>
          )}

          <button
            type="submit" disabled={isLoading}
            className={`w-full text-white font-bold py-3 px-4 rounded-lg transition-all ${
              isLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl'
            }`}
          >
            {isLoading ? 'در حال ارتباط با سرور...' : mode === 'password' ? 'ورود' : 'ارسال کد تایید'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          حساب کاربری ندارید؟{' '}
          <button onClick={onSwitchToRegister} className="text-blue-500 font-bold hover:underline focus:outline-none">
            ثبت‌نام کنید
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;