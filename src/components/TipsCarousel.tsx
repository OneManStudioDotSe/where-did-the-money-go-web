import { useState, useEffect, useMemo, useRef } from 'react';
import { CAROUSEL_AUTO_PLAY_INTERVAL, CAROUSEL_RESUME_DELAY } from '../constants/timing';

export interface TipsCarouselProps {
  stats: { categorized: number; uncategorized: number };
  totalIncome: number;
  totalExpenses: number;
}

interface Tip {
  id: string;
  icon: string;
  title: string;
  description: string;
  gradient: string;
  iconBg: string;
}

export function TipsCarousel({ stats, totalIncome, totalExpenses }: TipsCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const autoPlayTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Build tips array based on user data
  const tips = useMemo<Tip[]>(() => {
    const allTips: Tip[] = [];

    // Dynamic tips based on data
    if (stats.uncategorized > 0) {
      allTips.push({
        id: 'categorize',
        icon: '🏷️',
        title: 'Categorize Your Transactions',
        description: `You have ${stats.uncategorized} uncategorized transaction${stats.uncategorized !== 1 ? 's' : ''}. Adding categories helps you understand your spending patterns better.`,
        gradient: 'from-amber-400 to-orange-500',
        iconBg: 'bg-amber-100 dark:bg-amber-900/40',
      });
    }

    if (totalIncome - totalExpenses < 0) {
      allTips.push({
        id: 'overspend',
        icon: '📉',
        title: 'Watch Your Spending',
        description: `Your expenses exceed your income by ${Math.abs(totalIncome - totalExpenses).toLocaleString('sv-SE', { maximumFractionDigits: 0 })} kr. Check the Overview tab to identify top expense categories.`,
        gradient: 'from-rose-400 to-pink-500',
        iconBg: 'bg-rose-100 dark:bg-rose-900/40',
      });
    } else if (totalIncome > 0) {
      const savingsRate = ((totalIncome - totalExpenses) / totalIncome * 100);
      allTips.push({
        id: 'savings',
        icon: '✨',
        title: 'Great Savings Rate!',
        description: `You're saving ${savingsRate.toFixed(0)}% of your income. Keep it up! Consider setting aside more for emergency funds or investments.`,
        gradient: 'from-emerald-400 to-teal-500',
        iconBg: 'bg-emerald-100 dark:bg-emerald-900/40',
      });
    }

    // Static helpful tips
    allTips.push(
      {
        id: 'timefilter',
        icon: '📊',
        title: 'Filter by Time Period',
        description: 'Use the time period selector to analyze your finances by day, week, month, or quarter. Great for tracking monthly budgets!',
        gradient: 'from-blue-400 to-indigo-500',
        iconBg: 'bg-blue-100 dark:bg-blue-900/40',
      },
      {
        id: 'subscriptions',
        icon: '🔄',
        title: 'Track Subscriptions',
        description: 'We automatically detect recurring payments. Review them in the Subscriptions tab to stay on top of monthly costs.',
        gradient: 'from-violet-400 to-purple-500',
        iconBg: 'bg-violet-100 dark:bg-violet-900/40',
      },
      {
        id: 'export',
        icon: '📑',
        title: 'Export Your Data',
        description: 'Need your data elsewhere? Use the Reports tab to export your analysis in CSV format for spreadsheets or tax purposes.',
        gradient: 'from-cyan-400 to-sky-500',
        iconBg: 'bg-cyan-100 dark:bg-cyan-900/40',
      },
      {
        id: 'insights',
        icon: '💡',
        title: 'AI-Powered Insights',
        description: 'Check the Insights tab for AI-generated analysis of your spending habits and personalized recommendations.',
        gradient: 'from-fuchsia-400 to-pink-500',
        iconBg: 'bg-fuchsia-100 dark:bg-fuchsia-900/40',
      }
    );

    return allTips;
  }, [stats.uncategorized, totalIncome, totalExpenses]);

  // Auto-advance carousel
  useEffect(() => {
    if (!isAutoPlaying || tips.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % tips.length);
    }, CAROUSEL_AUTO_PLAY_INTERVAL);

    return () => clearInterval(interval);
  }, [isAutoPlaying, tips.length]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (autoPlayTimeoutRef.current) {
        clearTimeout(autoPlayTimeoutRef.current);
      }
    };
  }, []);

  const pauseAutoPlay = () => {
    setIsAutoPlaying(false);
    if (autoPlayTimeoutRef.current) {
      clearTimeout(autoPlayTimeoutRef.current);
    }
    autoPlayTimeoutRef.current = setTimeout(() => setIsAutoPlaying(true), CAROUSEL_RESUME_DELAY);
  };

  const goToSlide = (index: number) => {
    if (index === currentIndex) return;
    setCurrentIndex(index);
    pauseAutoPlay();
  };

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + tips.length) % tips.length);
    pauseAutoPlay();
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % tips.length);
    pauseAutoPlay();
  };

  const currentTip = tips[currentIndex];

  return (
    <div className="lg:col-span-2 relative overflow-hidden rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 h-fit">
      {/* Animated gradient background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${currentTip.gradient} opacity-10 dark:opacity-20 transition-all duration-700`} />

      {/* Decorative animated shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/20 dark:bg-white/5 rounded-full blur-xl animate-pulse" style={{ animationDuration: '3s' }} />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/15 dark:bg-white/5 rounded-full blur-2xl animate-pulse" style={{ animationDuration: '4s', animationDelay: '1s' }} />
        <div className="absolute top-1/2 right-1/4 w-16 h-16 bg-white/10 dark:bg-white/5 rounded-full blur-lg animate-bounce" style={{ animationDuration: '6s' }} />
      </div>

      {/* Content */}
      <div className="relative z-10 p-5 bg-white/80 dark:bg-slate-800/90 backdrop-blur-sm">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${currentTip.gradient} flex items-center justify-center shadow-lg`}>
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tips & Insights</span>
          </div>

          {/* Navigation arrows */}
          <div className="flex items-center gap-1">
            <button
              onClick={goToPrev}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
              aria-label="Previous tip"
            >
              <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={goToNext}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
              aria-label="Next tip"
            >
              <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Carousel content with smooth sliding */}
        <div ref={carouselRef} className="relative min-h-[140px] overflow-hidden">
          <div
            className="flex transition-transform duration-400 ease-out"
            style={{
              transform: `translateX(-${currentIndex * 100}%)`,
              transitionDuration: '400ms',
              transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            {tips.map((tip) => (
              <div
                key={tip.id}
                className="w-full flex-shrink-0"
              >
                {/* Icon */}
                <div className={`w-14 h-14 rounded-2xl ${tip.iconBg} flex items-center justify-center mb-4 shadow-sm`}>
                  <span className="text-3xl">{tip.icon}</span>
                </div>

                {/* Title */}
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 leading-tight">
                  {tip.title}
                </h3>

                {/* Description */}
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                  {tip.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Dot indicators */}
        <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-slate-700">
          {tips.map((tip, index) => (
            <button
              key={tip.id}
              onClick={() => goToSlide(index)}
              className={`transition-all duration-300 ${
                index === currentIndex
                  ? `w-6 h-2 rounded-full bg-gradient-to-r ${currentTip.gradient}`
                  : 'w-2 h-2 rounded-full bg-gray-300 dark:bg-slate-600 hover:bg-gray-400 dark:hover:bg-slate-500'
              }`}
              aria-label={`Go to tip ${index + 1}`}
            />
          ))}
        </div>

        {/* Progress bar for auto-play */}
        {isAutoPlaying && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-100 dark:bg-slate-700 overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r ${currentTip.gradient} animate-progress`}
              style={{ animationDuration: '5s' }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
