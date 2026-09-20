import React from 'react';
import { Code2, Palette, Terminal, Users, Play, Moon, Sun, Loader2 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const MobileBottomNav = ({
  activeTab = 'code',
  canvasCount = 0,
  isConsoleOpen = false,
  onTabChange,
  clientCount = 1,
  onRunCode,
  isExecuting = false,
  onToggleTheme,
}) => {
  const { isDark, toggleTheme } = useTheme();

  const navItems = [
    {
      id: 'code',
      label: 'Code',
      icon: Code2,
      isActive: activeTab === 'code' && !isConsoleOpen,
    },
    {
      id: 'canvas',
      label: canvasCount > 0 ? `Canva (${canvasCount})` : 'Canva',
      icon: Palette,
      isActive: activeTab === 'canvas' && !isConsoleOpen,
    },
    {
      id: 'terminal',
      label: 'Terminal',
      icon: Terminal,
      isActive: isConsoleOpen,
    },
    {
      id: 'collaborators',
      label: `Peers (${clientCount})`,
      icon: Users,
      isActive: false,
    },
  ];

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 h-[64px] pb-[env(safe-area-inset-bottom)] bg-white/95 dark:bg-[#0f0f0f]/95 backdrop-blur-2xl border-t border-gray-200/80 dark:border-white/10 px-2 flex items-center justify-between shadow-lg shadow-black/20 select-none">
      <div className="flex items-center justify-around flex-1 gap-0.5">
        {navItems.map((item) => {
          const IconComponent = item.icon;
          const active = item.isActive;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className="flex flex-col items-center justify-center gap-0.5 py-1 px-1 outline-none flex-1 max-w-[65px]"
            >
              <div
                className={`w-10 h-7 rounded-full flex items-center justify-center transition-all duration-200 ${
                  active
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'
                }`}
              >
                <IconComponent size={16} />
              </div>
              <span
                className={`text-[9px] tracking-tight truncate w-full text-center ${
                  active
                    ? 'text-blue-600 dark:text-blue-400 font-bold'
                    : 'text-gray-500 dark:text-gray-400 font-medium'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Action Controls Divider */}
      <div className="w-px h-6 bg-gray-200 dark:bg-white/10 mx-1 shrink-0" />

      {/* Quick Run Code Button */}
      <button
        onClick={onRunCode}
        disabled={isExecuting}
        className="flex flex-col items-center justify-center gap-0.5 py-1 px-1 outline-none shrink-0"
        title="Execute Code"
      >
        <div
          className={`w-9 h-7 rounded-full flex items-center justify-center transition-all duration-200 ${
            isExecuting
              ? 'bg-amber-500 text-black animate-pulse'
              : 'bg-emerald-600 text-white shadow-sm shadow-emerald-500/30 active:scale-95'
          }`}
        >
          {isExecuting ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Play size={13} fill="currentColor" />
          )}
        </div>
        <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
          {isExecuting ? '...' : 'Run'}
        </span>
      </button>

      {/* Real-time Theme Toggle Button */}
      <button
        onClick={(e) => {
          if (onToggleTheme) {
            onToggleTheme(e);
          } else {
            toggleTheme(e);
          }
        }}
        className="flex flex-col items-center justify-center gap-0.5 py-1 px-1 outline-none shrink-0"
        title={`Switch to ${isDark ? 'Light' : 'Dark'} mode`}
      >
        <div className="w-8 h-7 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors active:scale-95">
          {isDark ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} />}
        </div>
        <span className="text-[9px] text-gray-500 dark:text-gray-400 font-medium">
          {isDark ? 'Light' : 'Dark'}
        </span>
      </button>
    </nav>
  );
};

export default MobileBottomNav;
