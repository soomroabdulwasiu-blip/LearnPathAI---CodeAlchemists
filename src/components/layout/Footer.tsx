import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../../i18n';
import { Layers, ShieldCheck, Code2, BookOpen } from 'lucide-react';

export const Footer: React.FC = () => {
  const { t, isRtl } = useTranslation();

  return (
    <footer className="w-full border-t border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] mt-24 mb-16 lg:mb-0 transition-colors">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand & Mission */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#2D5BFF] flex items-center justify-center text-white">
                <Layers className="w-4 h-4" />
              </div>
              <span className="font-display font-extrabold text-lg text-[var(--ink)]">
                {t('app_name')}
              </span>
            </div>
            <p className="text-xs text-[var(--muted)] leading-relaxed">
              {isRtl
                ? 'پائتھون کا انکولی لرننگ پلیٹ فارم جو روایتی نصاب کی جگہ ذاتی نوعیت کا تعلیمی روڈ میپ فراہم کرتا ہے۔'
                : 'Adaptive Python learning platform replacing rigid curriculums with Bayesian knowledge tracing and dynamically re-ordered DAG roadmaps.'}
            </p>
            <div className="text-[11px] text-[var(--muted)] flex items-center gap-1.5 pt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>v2.4.0 (2026 Stable)</span>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="text-xs font-bold font-display uppercase tracking-wider text-[var(--muted)] mb-3">
              {isRtl ? 'پلیٹ فارم' : 'Platform'}
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/diagnostic" className="text-[var(--muted)] hover:text-[#2D5BFF] transition-colors">
                  {t('diagnostic')}
                </Link>
              </li>
              <li>
                <Link to="/roadmap" className="text-[var(--muted)] hover:text-[#2D5BFF] transition-colors">
                  {t('roadmap')}
                </Link>
              </li>
              <li>
                <Link to="/codelab" className="text-[var(--muted)] hover:text-[#2D5BFF] transition-colors">
                  {t('code_lab')}
                </Link>
              </li>
              <li>
                <Link to="/review" className="text-[var(--muted)] hover:text-[#2D5BFF] transition-colors">
                  {t('review')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Educators & Resources */}
          <div>
            <h4 className="text-xs font-bold font-display uppercase tracking-wider text-[var(--muted)] mb-3">
              {isRtl ? 'اساتذہ اور تحقیق' : 'Instructors & Research'}
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/instructor/classes" className="text-[var(--muted)] hover:text-[#2D5BFF] transition-colors">
                  {t('class_heatmap')}
                </Link>
              </li>
              <li>
                <Link to="/instructor/content" className="text-[var(--muted)] hover:text-[#2D5BFF] transition-colors">
                  {t('content')}
                </Link>
              </li>
              <li>
                <a
                  href="https://en.wikipedia.org/wiki/Bayesian_Knowledge_Tracing"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[var(--muted)] hover:text-[#2D5BFF] transition-colors inline-flex items-center gap-1"
                >
                  <BookOpen className="w-3 h-3" />
                  Corbett & Anderson (BKT Model)
                </a>
              </li>
            </ul>
          </div>

          {/* Accessibility & Standards */}
          <div>
            <h4 className="text-xs font-bold font-display uppercase tracking-wider text-[var(--muted)] mb-3">
              {isRtl ? 'معیارات اور رسائی' : 'Accessibility & Standards'}
            </h4>
            <div className="space-y-2 text-xs text-[var(--muted)]">
              <p className="flex items-center gap-1.5 text-[var(--ink)] font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-[#12C99B]" />
                WCAG 2.2 AA Compliant
              </p>
              <p className="text-[11px] leading-relaxed">
                Full keyboard navigation, dual RTL Urdu typography, color-independent mastery indicators, and screen-reader tested.
              </p>
              <div className="pt-2 text-[11px] text-[var(--muted)] border-t border-[var(--line)]">
                <span className="font-semibold text-[var(--ink)]">Curriculum:</span> Grounded directly in official Python documentation.
              </div>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-[var(--line)] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--muted)]">
          <p>
            © 2026 LearnPath AI. Built for students and instructors worldwide.
          </p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Code2 className="w-3.5 h-3.5 text-[#2D5BFF]" />
              React 19 + Python 3.12 Engine + XYFlow
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
