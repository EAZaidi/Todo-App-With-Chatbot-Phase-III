"use client";

import Link from "next/link";
import { SignUpForm } from "@/components/auth/SignUpForm";
import { useLanguage } from "@/components/LanguageProvider";
import { Sparkles } from "lucide-react";

export default function SignUpPage() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen flex items-center justify-center gradient-bg-subtle py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-20 right-10 w-72 h-72 bg-purple-200/30 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-10 w-96 h-96 bg-indigo-200/30 rounded-full blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pink-100/20 rounded-full blur-3xl" />

      <div className="relative max-w-md w-full space-y-8">
        {/* Logo */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <span className="text-2xl font-bold text-slate-900 tracking-tight">
              Task<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Flow</span>
            </span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900">
            {t('authPage.createYourAccount')}
          </h1>
          <p className="mt-2 text-slate-500">
            {t('authPage.signUpSubtitle')}
          </p>
        </div>

        <div className="bg-white/80 backdrop-blur-sm py-8 px-6 shadow-xl shadow-slate-200/50 rounded-2xl border border-slate-100">
          <SignUpForm />
        </div>

        <p className="text-center text-sm text-slate-500">
          {t('authPage.haveAccount')}{" "}
          <Link
            href="/sign-in"
            className="font-semibold text-indigo-600 hover:text-indigo-500 transition-colors"
          >
            {t('authPage.signInLink')}
          </Link>
        </p>
      </div>
    </div>
  );
}
