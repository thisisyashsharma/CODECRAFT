import React, { useState, useEffect, useRef } from 'react';
import { Search, ArrowLeft, X, Code2, Play, Copy, Terminal, LogOut } from 'lucide-react';

const QuickActionBar = ({
  languages = {},
  currentLanguage = 'javascript',
  onSelectLanguage,
  onRunCode,
  onCopyRoomId,
  onToggleTerminal,
  onLeaveRoom,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIndex(0);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // Click outside to collapse
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const actions = [
    {
      id: 'run-code',
      title: 'Run Code',
      category: 'Command',
      badge: 'Ctrl+Enter',
      icon: Play,
      action: () => {
        if (onRunCode) onRunCode();
        setIsOpen(false);
      },
    },
    {
      id: 'copy-id',
      title: 'Copy Room Invitation ID',
      category: 'Room',
      badge: 'Copy',
      icon: Copy,
      action: () => {
        if (onCopyRoomId) onCopyRoomId();
        setIsOpen(false);
      },
    },
    {
      id: 'toggle-terminal',
      title: 'Toggle Terminal / Console Panel',
      category: 'View',
      badge: 'Terminal',
      icon: Terminal,
      action: () => {
        if (onToggleTerminal) onToggleTerminal();
        setIsOpen(false);
      },
    },
    ...Object.entries(languages).map(([key, config]) => ({
      id: `lang-${key}`,
      title: `Switch Language: ${config.name}`,
      category: 'Language',
      badge: key === currentLanguage ? 'Active' : config.icon,
      icon: Code2,
      action: () => {
        if (onSelectLanguage) onSelectLanguage(key);
        setIsOpen(false);
      },
    })),
    {
      id: 'leave-room',
      title: 'Leave Collaboration Room',
      category: 'Room',
      badge: 'Exit',
      icon: LogOut,
      danger: true,
      action: () => {
        if (onLeaveRoom) onLeaveRoom();
        setIsOpen(false);
      },
    },
  ];

  const filteredActions = actions.filter((item) =>
    item.title.toLowerCase().includes(query.toLowerCase()) ||
    item.category.toLowerCase().includes(query.toLowerCase())
  );

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filteredActions.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredActions.length) % (filteredActions.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredActions[selectedIndex]) {
        filteredActions[selectedIndex].action();
      }
    }
  };

  return (
    <div ref={containerRef} className="relative z-40">
      {!isOpen ? (
        /* Collapsed State: 38px Circular Pill with rotating border beam hover */
        <button
          onClick={() => setIsOpen(true)}
          className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-gray-100 dark:bg-[#1f1f1f] text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-white/10 hover:border-blue-500/50 dark:hover:border-white/20 transition-all duration-300 group shadow-sm active:translate-y-[0.5px]"
          title="Quick Actions & Search (Ctrl+K)"
        >
          {/* Subtle rotating border beam glow on hover */}
          <span className="absolute inset-0 rounded-full overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            <span className="absolute inset-[-50%] bg-[conic-gradient(from_0deg,#2563eb,transparent_60%)] animate-border-beam opacity-40" />
          </span>
          <span className="relative z-10">
            <Search size={16} />
          </span>
        </button>
      ) : (
        /* Expanded State: Floating Command Palette Card */
        <div className="fixed inset-x-4 top-3 sm:absolute sm:top-0 sm:left-1/2 sm:-translate-x-1/2 sm:w-[540px] max-w-2xl bg-white dark:bg-[#141414] rounded-2xl sm:rounded-3xl border border-gray-200 dark:border-white/10 shadow-2xl shadow-black/40 backdrop-blur-2xl overflow-hidden animate-slide-fade-up">
          <div className="relative flex items-center px-4 h-11 sm:h-12 border-b border-gray-100 dark:border-white/5">
            <button
              onClick={() => setIsOpen(false)}
              className="mr-2 p-1 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors rounded-full"
              title="Close (Esc)"
            >
              <ArrowLeft size={16} />
            </button>

            <Search size={16} className="text-gray-400 mr-2 shrink-0" />

            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Search actions, languages, commands..."
              className="w-full bg-transparent text-sm sm:text-base text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none"
            />

            {query && (
              <button
                onClick={() => setQuery('')}
                className="p-1 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-transform active:rotate-90 duration-200 rounded-full"
              >
                <X size={15} />
              </button>
            )}

            <div className="ml-2 hidden sm:flex items-center gap-1 text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-[#1f1f1f] text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-white/10 shrink-0">
              <span>ESC</span>
            </div>

            {/* Bottom luminous search beam */}
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent animate-search-beam" />
          </div>

          {/* Autocomplete list */}
          <div className="max-h-72 overflow-y-auto p-2 divide-y divide-transparent">
            {filteredActions.length === 0 ? (
              <div className="py-6 text-center text-xs text-gray-400 dark:text-gray-500">
                No matching actions found.
              </div>
            ) : (
              filteredActions.map((item, idx) => {
                const isSelected = idx === selectedIndex;
                const IconComponent = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={item.action}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-sm transition-all duration-150 ${
                      isSelected
                        ? 'bg-blue-50 dark:bg-white/10 text-blue-600 dark:text-white font-medium'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'
                    } ${item.danger ? 'text-red-500 hover:text-red-600' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`p-1.5 rounded-lg ${isSelected ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-[#1f1f1f] text-gray-500 dark:text-gray-400'}`}>
                        <IconComponent size={14} />
                      </span>
                      <span>{item.title}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-gray-400 dark:text-gray-500 font-mono">
                        {item.badge}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default QuickActionBar;
