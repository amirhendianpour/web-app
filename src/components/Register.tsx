import React, { useState } from 'react';
import { register } from '../services/authService';

interface RegisterProps {
  onSwitchToLogin: () => void;
  onRegistered: (identifier: string) => void;
}

const Register: React.FC<RegisterProps> = ({ onSwitchToLogin, onRegistered }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!firstName.trim() || !lastName.trim()) {
      setError('نام و نام‌خانوادگی الزامی است.');
      return;
    }
    if (!email.trim() && !phoneNumber.trim()) {
      setError('وارد کردن حداقل ایمیل یا شماره موبایل الزامی است.');
      return;
    }
    if (password.length < 6) {
      setError('رمز عبور باید حداقل ۶ کاراکتر باشد.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await register({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim() || undefined,
        phoneNumber: phoneNumber.trim() || undefined,
        password
      });
      onRegistered(result.identifier);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-100 font-sans" dir="rtl">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-3xl shadow-lg">✨</div>
          <h1 className="text-2xl font-bold text-gray-800">ثبت‌نام در پیام‌رسان</h1>
          <p className="text-gray-500 mt-2 text-sm">حساب کاربری جدید خود را بسازید</p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-gray-700 text-sm font-bold mb-2">نام</label>
              <input
                type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all"
              />
            </div>
            <div className="flex-1">
              <label className="block text-gray-700 text-sm font-bold mb-2">نام‌خانوادگی</label>
              <input
                type="text" value={lastName} onChange={(e) => setLastName(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">شماره موبایل (اختیاری)</label>
            <input
              type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all text-left"
              placeholder="+989120000000" dir="ltr"
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">ایمیل (اختیاری)</label>
            <input
              type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all text-left"
              placeholder="you@example.com" dir="ltr"
            />
          </div>

          <p className="text-xs text-gray-400">* حداقل یکی از شماره موبایل یا ایمیل الزامی است.</p>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">رمز عبور</label>
            <input
              type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all"
              dir="ltr"
            />
          </div>

          <button
            type="submit" disabled={isLoading}
            className={`w-full text-white font-bold py-3 px-4 rounded-lg transition-all ${
              isLoading ? 'bg-green-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 shadow-lg hover:shadow-xl'
            }`}
          >
            {isLoading ? 'در حال ثبت اطلاعات...' : 'ثبت‌نام'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          قبلاً ثبت‌نام کرده‌اید؟{' '}
          <button onClick={onSwitchToLogin} className="text-blue-500 font-bold hover:underline focus:outline-none">
            وارد شوید
          </button>
        </div>
      </div>
    </div>
  );
};

export default Register;