import React from 'react';
import { Code2, Terminal, Users, Play, Moon, Sun } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const MobileBottomNav = ({
  activeTab = 'editor',
  onTabChange,
  clientCount = 1,
  onRunCode,
  isExecuting = false,
}) => {
  const { isDark, toggleTheme } = useTheme();

  const tabs = [
    {
      id: 'editor',
      label: 'Editor',
      icon: Code2,
    },
    {
      id: 'terminal',
      label: 'Terminal',
      icon: Terminal,
    },
    {
      id: 'collaborators',
      label: `Users (${clientCount})`,
      icon: Users,
    },
  ];

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 h-[70px] pb-[env(safe-area-inset-bottom)] bg-white/95 dark:bg-[#0f0f0f]/95 backdrop-blur-2xl border-t border-gray-200/80 dark:border-white/10 px-4 flex items-center justify-around shadow-lg shadow-black/20">
      {tabs.map((tab) => {
        const IconComponent = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className="flex flex-col items-center justify-center gap-1 group py-1 outline-none"
          >
            {/* Material You tonal pill */}
            <div
              className={`w-[60px] h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                  : 'text-gray-500 dark:text-gray-400 group-hover:bg-gray-100 dark:group-hover:bg-white/5'
              }`}
            >
              <IconComponent size={18} />
            </div>
            <span
              className={`text-[10px] font-medium tracking-tight ${
                isActive
                  ? 'text-blue-600 dark:text-blue-400 font-semibold'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              {tab.label}
            </span>
          </button>
        );
      })}

      {/* Quick Run Code Pill */}
      <button
        onClick={onRunCode}
        disabled={isExecuting}
        className="flex flex-col items-center justify-center gap-1 group py-1 outline-none"
      >
        <div
          className={`w-[60px] h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
            isExecuting
              ? 'bg-amber-500 text-black animate-pulse'
              : 'bg-emerald-600 text-white shadow-sm shadow-emerald-500/30'
          }`}
        >
          <Play size={16} fill="currentColor" />
        </div>
        <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
          {isExecuting ? 'Running' : 'Run'}
        </span>
      </button>

      {/* Theme Switch Pill */}
      <button
        onClick={toggleTheme}
        className="flex flex-col items-center justify-center gap-1 group py-1 outline-none"
      >
        <div className="w-[48px] h-8 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400 group-hover:bg-gray-100 dark:group-hover:bg-white/5 transition-colors">
          {isDark ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} />}
        </div>
        <span className="text-[10px] text-gray-500 dark:text-gray-400">
          {isDark ? 'Light' : 'Dark'}
        </span>
      </button>
    </nav>
  );
};

export default MobileBottomNav;
