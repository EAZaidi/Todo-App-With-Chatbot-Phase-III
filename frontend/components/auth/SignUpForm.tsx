"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { useLanguage } from "../LanguageProvider";
import { Mail, Lock, ShieldCheck, UserPlus, Loader2 } from "lucide-react";

interface FormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
}

export function SignUpForm() {
  const router = useRouter();
  const { signUp } = useAuth();
  const { t } = useLanguage();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      newErrors.email = t("auth.emailRequired");
    } else if (!emailRegex.test(email)) {
      newErrors.email = t("auth.invalidEmail");
    }

    if (!password) {
      newErrors.password = t("auth.passwordRequired");
    } else if (password.length < 8) {
      newErrors.password = t("auth.passwordMinLength");
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = t("auth.confirmRequired");
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = t("auth.passwordsMismatch");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      await signUp(email, password);
      router.push("/");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Registration failed";

      if (
        message.toLowerCase().includes("email") &&
        message.toLowerCase().includes("exist")
      ) {
        setErrors({ email: t("auth.emailExists") });
      } else if (message.toLowerCase().includes("email")) {
        setErrors({ email: message });
      } else if (message.toLowerCase().includes("password")) {
        setErrors({ password: message });
      } else {
        setErrors({ general: message });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {errors.general && (
        <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-xl">
          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-red-600">{errors.general}</p>
        </div>
      )}

      <div>
        <label
          htmlFor="email"
          className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2"
        >
          <Mail className="w-4 h-4 text-indigo-500" />
          {t("auth.email")}
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={`w-full px-4 py-3.5 bg-slate-50 border-2 rounded-xl text-slate-900 placeholder-slate-400 transition-all duration-200 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 ${
            errors.email ? "border-red-300 bg-red-50/50" : "border-slate-200"
          }`}
          placeholder={t("auth.emailPlaceholder")}
          disabled={isLoading}
          autoComplete="email"
        />
        {errors.email && (
          <p className="mt-1.5 text-sm font-medium text-red-500">{errors.email}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="password"
          className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2"
        >
          <Lock className="w-4 h-4 text-indigo-500" />
          {t("auth.password")}
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={`w-full px-4 py-3.5 bg-slate-50 border-2 rounded-xl text-slate-900 placeholder-slate-400 transition-all duration-200 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 ${
            errors.password ? "border-red-300 bg-red-50/50" : "border-slate-200"
          }`}
          placeholder={t("auth.passwordPlaceholder")}
          disabled={isLoading}
          autoComplete="new-password"
        />
        {errors.password && (
          <p className="mt-1.5 text-sm font-medium text-red-500">{errors.password}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="confirmPassword"
          className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2"
        >
          <ShieldCheck className="w-4 h-4 text-indigo-500" />
          {t("auth.confirmPassword")}
        </label>
        <input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className={`w-full px-4 py-3.5 bg-slate-50 border-2 rounded-xl text-slate-900 placeholder-slate-400 transition-all duration-200 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 ${
            errors.confirmPassword ? "border-red-300 bg-red-50/50" : "border-slate-200"
          }`}
          placeholder={t("auth.confirmPlaceholder")}
          disabled={isLoading}
          autoComplete="new-password"
        />
        {errors.confirmPassword && (
          <p className="mt-1.5 text-sm font-medium text-red-500">{errors.confirmPassword}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none hover:shadow-xl hover:shadow-indigo-500/40 hover:-translate-y-0.5"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            {t("auth.creatingAccount")}
          </>
        ) : (
          <>
            <UserPlus className="w-5 h-5" />
            {t("auth.createAccount")}
          </>
        )}
      </button>
    </form>
  );
}
