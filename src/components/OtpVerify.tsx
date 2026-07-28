import React, { useState } from 'react';
import { verifyOtp, requestOtp } from '../services/authService';
import type { AuthResponse } from '../types/Auth';

interface Props {
  identifier: string;
  onVerified: (auth: AuthResponse) => void;
  onBack: () => void;
}

const OtpVerify: React.FC<Props> = ({ identifier, onVerified, onBack }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (code.trim().length !== 6) {
      setError('کد باید ۶ رقم باشد.');
      return;
    }
    setIsLoading(true);
    try {
      const auth: AuthResponse = await verifyOtp(identifier, code.trim());
      onVerified(auth);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setResendMessage('');
    setIsResending(true);
    try {
      await requestOtp(identifier);
      setResendMessage('کد جدید ارسال شد.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-100 font-sans" dir="rtl">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-3xl shadow-lg">🔐</div>
          <h1 className="text-2xl font-bold text-gray-800">تایید کد</h1>
          <p className="text-gray-500 mt-2 text-sm">کد ۶ رقمی ارسال‌شده به {identifier} را وارد کنید</p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 text-sm text-center">
            {error}
          </div>
        )}
        {resendMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4 text-sm text-center">
            {resendMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <input
            type="text" inputMode="numeric" maxLength={6}
            value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-center text-2xl tracking-[0.5em]"
            placeholder="------" dir="ltr"
          />

          <button
            type="submit" disabled={isLoading}
            className={`w-full text-white font-bold py-3 px-4 rounded-lg transition-all ${
              isLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl'
            }`}
          >
            {isLoading ? 'در حال بررسی...' : 'تایید'}
          </button>
        </form>

        <div className="mt-6 flex justify-between text-sm">
          <button onClick={onBack} className="text-gray-500 hover:underline">بازگشت</button>
          <button onClick={handleResend} disabled={isResending} className="text-blue-500 font-bold hover:underline disabled:text-gray-400">
            {isResending ? 'در حال ارسال...' : 'ارسال مجدد کد'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OtpVerify;