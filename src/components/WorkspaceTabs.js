import React from 'react';
import { Code2, Palette, Plus, X } from 'lucide-react';

const WorkspaceTabs = ({ tabs, activeTabId, onSwitchTab, onCloseTab, onNewCanvas }) => {
    return (
        <div className="h-9 shrink-0 flex items-end bg-gray-100/50 dark:bg-[#0a0a0a] border-b border-gray-200/80 dark:border-white/5 px-1 gap-0.5 overflow-x-auto scrollbar-none select-none">
            {tabs.map((tab) => {
                const isActive = tab.id === activeTabId;
                const isCode = tab.type === 'code';

                return (
                    <button
                        key={tab.id}
                        onClick={() => onSwitchTab(tab.id)}
                        className={`group relative flex items-center gap-1.5 h-[33px] px-3 rounded-t-lg text-xs font-medium transition-all shrink-0 ${
                            isActive
                                ? 'bg-white dark:bg-[#0f0f0f] text-gray-900 dark:text-white border border-b-0 border-gray-200/80 dark:border-white/10 shadow-sm z-10 -mb-px'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200/50 dark:hover:bg-white/5'
                        }`}
                    >
                        {/* Tab Icon */}
                        {isCode ? (
                            <Code2
                                size={13}
                                className={
                                    isActive
                                        ? 'text-blue-600 dark:text-blue-400'
                                        : 'text-gray-400 dark:text-gray-500'
                                }
                            />
                        ) : (
                            <Palette
                                size={13}
                                className={
                                    isActive
                                        ? 'text-purple-600 dark:text-purple-400'
                                        : 'text-gray-400 dark:text-gray-500'
                                }
                            />
                        )}

                        {/* Tab Label */}
                        <span className="max-w-[100px] truncate">{tab.label}</span>

                        {/* Close Button (not shown for the Code tab) */}
                        {!isCode && (
                            <span
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onCloseTab(tab.id);
                                }}
                                className="ml-0.5 p-0.5 rounded-full opacity-0 group-hover:opacity-100 hover:bg-gray-300 dark:hover:bg-white/10 transition-all"
                                title="Close Tab"
                            >
                                <X size={11} />
                            </span>
                        )}

                        {/* Active Tab Bottom Accent */}
                        {isActive && (
                            <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-blue-500 dark:bg-blue-400" />
                        )}
                    </button>
                );
            })}

            {/* New Canvas Tab Button */}
            <button
                onClick={onNewCanvas}
                className="flex items-center justify-center w-7 h-7 my-auto rounded-md text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200/60 dark:hover:bg-white/5 transition-all shrink-0 ml-0.5"
                title="Open Canvas Tab"
            >
                <Plus size={14} />
            </button>
        </div>
    );
};

export default WorkspaceTabs;
