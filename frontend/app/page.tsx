'use client';

import { TaskListContainer } from '@/components/TaskListContainer';
import { Navbar } from '@/components/Navbar';
import { useLanguage } from '@/components/LanguageProvider';
import { Poppins } from 'next/font/google';
import { CheckCircle2, Shield, Zap, Clock } from 'lucide-react';

const poppins = Poppins({ subsets: ['latin'], weight: ['700'] });

function FeatureCard({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) {
  return (
    <div className="flex items-start gap-4 p-5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
      <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
      </div>
      <div>
        <h3 className="font-semibold text-slate-900 dark:text-white text-sm">{title}</h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-xs text-white/60 mt-1">{label}</div>
    </div>
  );
}

export default function Home() {
  const { t } = useLanguage();

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 relative">
        <Navbar />

        {/* Stats bar */}
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="flex justify-center gap-12 py-6">
            <StatCard value={t('home.fast')} label={t('home.realtimeSync')} />
            <StatCard value={t('home.secure')} label={t('home.jwtProtected')} />
            <StatCard value={t('home.free')} label={t('home.openSource')} />
          </div>
        </div>
      </div>

      {/* Task Management Section */}
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <TaskListContainer />
      </div>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-12 max-w-5xl">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t('home.whyTaskFlow')}</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2">{t('home.whySubtitle')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FeatureCard
            icon={CheckCircle2}
            title={t('home.smartTitle')}
            description={t('home.smartDesc')}
          />
          <FeatureCard
            icon={Shield}
            title={t('home.secureTitle')}
            description={t('home.secureDesc')}
          />
          <FeatureCard
            icon={Zap}
            title={t('home.fastTitle')}
            description={t('home.fastDesc')}
          />
          <FeatureCard
            icon={Clock}
            title={t('home.dueDateTitle')}
            description={t('home.dueDateDesc')}
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-12 max-w-3xl">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-center">
          <h2 className="text-xl font-bold text-white mb-2">{t('home.ctaTitle')}</h2>
          <p className="text-white/70 text-sm mb-6">{t('home.ctaSubtitle')}</p>
          <div className="flex justify-center gap-3">
            <a href="/sign-up" className="px-6 py-2.5 bg-white text-indigo-600 font-semibold rounded-lg text-sm hover:bg-white/90 transition-colors shadow-lg">
              {t('home.createFreeAccount')}
            </a>
            <a href="/sign-in" className="px-6 py-2.5 bg-white/10 text-white font-medium rounded-lg text-sm hover:bg-white/20 transition-colors border border-white/20">
              {t('home.signIn')}
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 mt-8">
        <div className="w-full px-6 md:px-10 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                  <span className="text-amber-300 text-lg">&#10024;</span>
                </div>
                <span className={`text-lg font-bold text-white ${poppins.className}`}>
                  Task<span className="text-amber-400">Flow</span>
                </span>
              </div>
              <p className="text-white/70 text-sm leading-relaxed max-w-xs">
                {t('footer.description')}
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">{t('footer.product')}</h4>
              <ul className="space-y-2">
                <li><a href="/sign-up" className="text-sm text-white/70 hover:text-white transition-colors">{t('footer.getStarted')}</a></li>
                <li><a href="/sign-in" className="text-sm text-white/70 hover:text-white transition-colors">{t('footer.signIn')}</a></li>
                <li><a href="#" className="text-sm text-white/70 hover:text-white transition-colors">{t('footer.features')}</a></li>
              </ul>
            </div>

            {/* Tech Stack */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">{t('footer.builtWith')}</h4>
              <ul className="space-y-2">
                <li className="text-sm text-white/70">Next.js 16</li>
                <li className="text-sm text-white/70">FastAPI</li>
                <li className="text-sm text-white/70">Tailwind CSS</li>
                <li className="text-sm text-white/70">PostgreSQL</li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-10 pt-6 border-t border-white/20 text-center">
            <p className="text-xs text-white/60">{t('footer.copyright')}</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
