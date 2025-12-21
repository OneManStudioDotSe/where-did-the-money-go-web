import { useState } from 'react';
import { DarkModeToggle } from '../DarkModeToggle';
import { MobileMenu } from './MobileMenu';

interface HeaderProps {
  isDark: boolean;
  onToggleDark: () => void;
  onOpenSettings: () => void;
  currentRoute: string;
  onNavigate: (route: string) => void;
  hasData?: boolean;
  onReset?: () => void;
  onExport?: () => void;
}

const navItems = [
  { label: 'Home', href: '#/' },
  { label: 'Features', href: '#/features' },
  { label: 'How it works', href: '#/how-it-works' },
  { label: 'About', href: '#/about' },
];

export function Header({ isDark, onToggleDark, onOpenSettings, currentRoute, onNavigate, hasData, onReset, onExport }: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '#/') {
      return currentRoute === '#/' || currentRoute === '' || currentRoute === '#';
    }
    return currentRoute.startsWith(href);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <a
              href="#/"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('#/');
              }}
              className="flex items-center gap-4 group"
            >
              {/* Logo Icon */}
              <div className="relative">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/25 group-hover:shadow-primary-500/40 transition-all group-hover:scale-105">
                  <svg
                    className="w-7 h-7 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
                {/* Accent dot */}
                <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-primary-400 rounded-full border-2 border-white dark:border-slate-900 shadow-sm" />
              </div>
              {/* Logo Text */}
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
                  Where Did The Money Go?
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Privacy-first expense tracking
                </p>
              </div>
            </a>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate(item.href);
                  }}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive(item.href)
                      ? 'text-primary-700 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {item.label}
                </a>
              ))}
            </nav>

            {/* Right Side Actions */}
            <div className="flex items-center gap-2">
              {/* Export Button - Only show when data is loaded */}
              {hasData && onExport && (
                <button
                  onClick={onExport}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors animate-press"
                  aria-label="Export data"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span>Export</span>
                </button>
              )}

              {/* Start Over Button - Only show when data is loaded */}
              {hasData && onReset && (
                <button
                  onClick={onReset}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-danger-600 dark:hover:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg transition-colors animate-press"
                  aria-label="Start over"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Start Over</span>
                </button>
              )}

              {/* Dark Mode Toggle */}
              <DarkModeToggle isDark={isDark} onToggle={onToggleDark} />

              {/* Settings Button */}
              <button
                onClick={onOpenSettings}
                className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors animate-press group"
                aria-label="Settings"
              >
                <svg className="w-5 h-5 animate-spin-hover group-hover:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </button>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="md:hidden p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                aria-label="Open menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        navItems={navItems}
        currentRoute={currentRoute}
        onNavigate={(route) => {
          onNavigate(route);
          setIsMobileMenuOpen(false);
        }}
        isDark={isDark}
        onToggleDark={onToggleDark}
        onOpenSettings={() => {
          setIsMobileMenuOpen(false);
          onOpenSettings();
        }}
      />
    </>
  );
}
