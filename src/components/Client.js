import React from 'react';
import Avatar from 'react-avatar';

const Client = ({ username, isSelf = false }) => {
  return (
    <div
      className="group relative flex items-center gap-3 px-3 py-2 rounded-2xl bg-gray-50 dark:bg-[#161616] hover:bg-gray-100 dark:hover:bg-[#1a1a1a] border border-gray-200/70 dark:border-white/5 transition-all duration-200"
      style={{
        transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {/* Avatar Container with Emerald Beacon */}
      <div className="relative shrink-0">
        <Avatar
          name={username}
          size="38"
          round="12px"
          className="shadow-sm font-medium"
        />
        {/* Live Presence Dot */}
        <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-white dark:border-[#161616]" />
        </span>
      </div>

      {/* Username & Status */}
      <div className="flex flex-col min-w-0 flex-1">
        <span className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate flex items-center gap-1.5">
          {username}
          {isSelf && (
            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-medium">
              You
            </span>
          )}
        </span>
        <span className="text-[11px] text-gray-500 dark:text-gray-400 truncate flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
          Active Collaborator
        </span>
      </div>
    </div>
  );
};

export default Client;