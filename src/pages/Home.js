import React, { useState } from "react";
import { v4 as uuidV4 } from 'uuid';
import toast from 'react-hot-toast';
import { useNavigate } from "react-router-dom";
import { Code2, ArrowRight, Sparkles, Moon, Sun, Terminal } from 'lucide-react';
import { useTheme } from "../context/ThemeContext";
import LaserPillButton from "../components/common/LaserPillButton";
import CelebrationParticles from "../components/common/CelebrationParticles";

const Home = () => {
    const navigate = useNavigate();
    const { isDark, toggleTheme } = useTheme();

    const [roomId, setRoomId] = useState('');
    const [username, setUsername] = useState('');
    const [celebrateNewRoom, setCelebrateNewRoom] = useState(false);

    const createNewRoom = (e) => {
        if (e) e.preventDefault();
        const id = uuidV4();
        setRoomId(id);
        setCelebrateNewRoom(true);
        toast.success('Generated new secure Room ID!');
    };

    const joinRoom = () => {
        if (!roomId.trim() || !username.trim()) {
            toast.error('Both Room ID and Username are required.');
            return;
        }

        navigate(`/editor/${roomId.trim()}`, {
            state: {
                username: username.trim(),
            },
        });
    };

    const handleInputEnter = (e) => {
        if (e.key === 'Enter') {
            joinRoom();
        }
    };

    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-between p-4 sm:p-8 bg-white dark:bg-[#0f0f0f] text-gray-900 dark:text-gray-100 transition-colors duration-400">
            {/* Top Navigation & Theme Toggle */}
            <header className="w-full max-w-5xl flex items-center justify-between py-2">
                <div className="flex items-center gap-2.5 select-none">
                    <div className="w-9 h-9 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/25">
                        <Code2 size={20} />
                    </div>
                    <span className="font-bold text-lg tracking-tight">
                        Code<span className="text-blue-600 dark:text-blue-400">Craft</span>
                    </span>
                    <span className="hidden sm:inline-block text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-[#1f1f1f] text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-white/10">
                        v2.0 • ViewTube Studio
                    </span>
                </div>

                {/* View Transition Theme Toggle Button */}
                <button
                    onClick={(e) => toggleTheme(e)}
                    className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-100 dark:bg-[#1f1f1f] text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-white/10 hover:border-blue-500/40 dark:hover:border-white/20 transition-all duration-300 shadow-sm active:translate-y-[0.5px]"
                    title={`Switch to ${isDark ? 'Light' : 'Dark'} mode`}
                >
                    {isDark ? (
                        <Sun size={18} className="text-amber-400" />
                    ) : (
                        <Moon size={18} className="text-gray-700" />
                    )}
                </button>
            </header>

            {/* Central Titanium Squircle Card */}
            <main className="w-full max-w-md my-auto relative">
                <div className="relative rounded-3xl p-6 sm:p-8 bg-white dark:bg-[#141414] border border-gray-200/80 dark:border-white/10 shadow-xl dark:shadow-2xl dark:shadow-black/60 backdrop-blur-2xl transition-all">
                    {/* Header with Prism Text Shimmer */}
                    <div className="text-center mb-6">
                        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gray-100 dark:bg-[#1f1f1f] border border-gray-200 dark:border-white/10 mb-4 shadow-sm">
                            <Terminal size={28} className="text-blue-600 dark:text-blue-400" />
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
                            <span className="mask-shimmer-text">Real-Time Studio</span>
                        </h1>
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                            Collaborative coding, multi-language execution, and instant room sync.
                        </p>
                    </div>

                    {/* Room Form */}
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                Invitation Room ID
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Paste or generate ROOM ID"
                                    value={roomId}
                                    onChange={(e) => setRoomId(e.target.value)}
                                    onKeyDown={handleInputEnter}
                                    className="w-full h-11 px-4 rounded-xl sm:rounded-2xl bg-gray-50 dark:bg-[#1f1f1f] text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-white/10 placeholder-gray-400 dark:placeholder-gray-500 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
                                />
                                {celebrateNewRoom && (
                                    <CelebrationParticles
                                        trigger={celebrateNewRoom}
                                        message="Generated!"
                                        onComplete={() => setCelebrateNewRoom(false)}
                                    />
                                )}
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                Your Username
                            </label>
                            <input
                                type="text"
                                placeholder="e.g. Satoshi, Ada, Alan"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                onKeyDown={handleInputEnter}
                                className="w-full h-11 px-4 rounded-xl sm:rounded-2xl bg-gray-50 dark:bg-[#1f1f1f] text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-white/10 placeholder-gray-400 dark:placeholder-gray-500 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
                            />
                        </div>

                        {/* Primary Action Button */}
                        <div className="pt-2">
                            <LaserPillButton
                                onClick={joinRoom}
                                variant="primary"
                                size="lg"
                                className="w-full text-sm font-semibold tracking-wide"
                            >
                                <span>Join Workspace</span>
                                <ArrowRight size={16} />
                            </LaserPillButton>
                        </div>

                        {/* Secondary Generator Action */}
                        <div className="pt-2 flex items-center justify-center">
                            <button
                                type="button"
                                onClick={createNewRoom}
                                className="group inline-flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors py-1 px-3 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 active:translate-y-[0.5px]"
                            >
                                <Sparkles size={13} className="text-blue-500 group-hover:rotate-12 transition-transform" />
                                <span>Need a fresh space? <strong className="font-semibold underline underline-offset-2">Create new room</strong></span>
                            </button>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="w-full max-w-5xl py-4 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 dark:text-gray-500 border-t border-gray-200/60 dark:border-white/5 gap-2">
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>ViewTube Design System Engine • High Precision Zero CLS</span>
                </div>
                <div>
                    Built with engineering craft & precision
                </div>
            </footer>
        </div>
    );
};

export default Home;
