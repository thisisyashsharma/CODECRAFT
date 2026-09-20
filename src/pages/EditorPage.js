import React, { useEffect, useRef, useState, useCallback } from "react";
import Client from "../components/Client";
import Editor from "../components/editor";
import CollabCanvas from "../components/CollabCanvas";
import WorkspaceTabs from "../components/WorkspaceTabs";
import { initSocket } from "../socket";
import ACTIONS from "../Actions";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
    Code2,
    Play,
    Copy,
    LogOut,
    Terminal,
    ChevronLeft,
    ChevronRight,
    Sun,
    Moon,
    Users,
    X,
    Clock,
    AlertCircle,
    CheckCircle2,
    Loader2
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import LaserPillButton from "../components/common/LaserPillButton";
import RollingCounter from "../components/common/RollingCounter";
import CelebrationParticles from "../components/common/CelebrationParticles";
import QuickActionBar from "../components/common/QuickActionBar";
import MobileBottomNav from "../components/navigation/MobileBottomNav";

const LANGUAGE_CONFIGS = {
    javascript: {
        name: 'JavaScript (Node.js)',
        icon: '🟨',
        badge: 'JS',
        defaultCode: `// JavaScript Playground\nfunction solve() {\n    console.log("Hello from CodeCraft!");\n}\n\nsolve();\n`,
    },
    python: {
        name: 'Python 3',
        icon: '🐍',
        badge: 'PY',
        defaultCode: `# Python 3 Playground\ndef main():\n    print("Hello from CodeCraft Python!")\n\nif __name__ == "__main__":\n    main()\n`,
    },
    cpp: {
        name: 'C++ (GCC 13)',
        icon: '⚡',
        badge: 'C++',
        defaultCode: `// C++ 20 Playground\n#include <iostream>\n\nint main() {\n    std::cout << "Hello from CodeCraft C++!" << std::endl;\n    return 0;\n}\n`,
    },
    java: {
        name: 'Java (OpenJDK 21)',
        icon: '☕',
        badge: 'JAVA',
        defaultCode: `// Java Playground\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello from CodeCraft Java!");\n    }\n}\n`,
    },
    rust: {
        name: 'Rust (1.82)',
        icon: '🦀',
        badge: 'RS',
        defaultCode: `// Rust Playground\nfn main() {\n    println!("Hello from CodeCraft Rust!");\n}\n`,
    },
    go: {
        name: 'Go (1.23)',
        icon: '🐹',
        badge: 'GO',
        defaultCode: `// Go Playground\npackage main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello from CodeCraft Go!")\n}\n`,
    },
};

const EditorPage = () => {
    const socketRef = useRef(null);
    const codeRef = useRef(null);
    const location = useLocation();
    const { roomId } = useParams();
    const reactNavigator = useNavigate();
    const { isDark, toggleTheme, setTheme } = useTheme();

    // Socket instance state (ensures child components re-render and attach listeners reliably)
    const [socket, setSocket] = useState(null);

    // Persistent username handling so refreshing or direct link doesn't break
    const username =
        location.state?.username ||
        sessionStorage.getItem(`codecraft_user_${roomId}`) ||
        `Peer_${Math.floor(100 + Math.random() * 900)}`;

    useEffect(() => {
        sessionStorage.setItem(`codecraft_user_${roomId}`, username);
    }, [roomId, username]);

    // Collaborative State
    const [clients, setClients] = useState([]);
    const [language, setLanguage] = useState('javascript');
    const languageRef = useRef('javascript');

    useEffect(() => {
        languageRef.current = language;
    }, [language]);
    const [isExecuting, setIsExecuting] = useState(false);
    const [output, setOutput] = useState('');
    const [errorOutput, setErrorOutput] = useState('');
    const [executionTime, setExecutionTime] = useState(null);
    const [status, setStatus] = useState('idle'); // idle | running | success | error | warning
    const [stdin, setStdin] = useState('');

    // Responsive & Panel UI State
    const [isConsoleOpen, setIsConsoleOpen] = useState(true);
    const [activeConsoleTab, setActiveConsoleTab] = useState('output'); // 'output' | 'input'
    const [sidebarWidth, setSidebarWidth] = useState(240);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isDraggingSidebar, setIsDraggingSidebar] = useState(false);
    const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
    const [mobileActiveView, setMobileActiveView] = useState('editor'); // 'editor' | 'terminal' | 'collaborators'

    // Celebration Micro-Interaction State
    const [showCopyCelebration, setShowCopyCelebration] = useState(false);

    // Workspace Tab State (browser-style tabs)
    const [tabs, setTabs] = useState([
        { id: 'code', type: 'code', label: 'Code' },
    ]);
    const [activeTabId, setActiveTabId] = useState('code');
    const canvasTabCounter = useRef(0);

    // Sidebar resize handlers
    const startResizing = useCallback((e) => {
        e.preventDefault();
        setIsDraggingSidebar(true);
    }, []);

    const stopResizing = useCallback(() => {
        setIsDraggingSidebar(false);
    }, []);

    const resize = useCallback(
        (e) => {
            if (isDraggingSidebar) {
                const clientX = e.touches ? e.touches[0].clientX : e.clientX;
                const newWidth = Math.max(160, Math.min(480, clientX));
                setSidebarWidth(newWidth);
            }
        },
        [isDraggingSidebar]
    );

    useEffect(() => {
        if (isDraggingSidebar) {
            window.addEventListener('mousemove', resize);
            window.addEventListener('mouseup', stopResizing);
            window.addEventListener('touchmove', resize);
            window.addEventListener('touchend', stopResizing);
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
        } else {
            window.removeEventListener('mousemove', resize);
            window.removeEventListener('mouseup', stopResizing);
            window.removeEventListener('touchmove', resize);
            window.removeEventListener('touchend', stopResizing);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        }
        return () => {
            window.removeEventListener('mousemove', resize);
            window.removeEventListener('mouseup', stopResizing);
            window.removeEventListener('touchmove', resize);
            window.removeEventListener('touchend', stopResizing);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };
    }, [isDraggingSidebar, resize, stopResizing]);

    // Body scroll lock on mobile drawer
    useEffect(() => {
        if (mobileDrawerOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [mobileDrawerOpen]);

    // Socket Initialization & Event Management
    useEffect(() => {
        let isCancelled = false;
        const activeSocket = initSocket();
        socketRef.current = activeSocket;
        setSocket(activeSocket);

        activeSocket.on('connect_error', (err) => {
            console.log('Socket connect_error', err);
        });
        activeSocket.on('connect_failed', (err) => {
            console.log('Socket connect_failed', err);
            toast.error('Socket connection failed, retrying...');
        });

        const emitJoin = () => {
            if (isCancelled) return;
            console.log('[CLIENT] Emitting JOIN for user:', username, 'in room:', roomId, 'socket:', activeSocket.id);
            activeSocket.emit(ACTIONS.JOIN, {
                roomId,
                username,
            });
        };

        // Emit immediately (Socket.io buffers while connecting)
        emitJoin();
        // Also re-emit whenever connected/reconnected
        activeSocket.on('connect', emitJoin);

        // Listening for joined event
        activeSocket.on(ACTIONS.JOINED, ({ clients, username: joinedUser, socketId, language: currentLang, theme: currentTheme, tabs: currentTabs }) => {
            if (isCancelled) return;
            console.log('[CLIENT] Received JOINED:', { joinedUser, currentTheme, count: clients?.length });
            if (joinedUser !== username) {
                toast.success(`${joinedUser} joined the studio.`);
                // ONLY existing users send their current code and tabs to the newcomer
                activeSocket.emit(ACTIONS.SYNC_CODE, {
                    code: codeRef.current,
                    socketId,
                    language: currentLang || language,
                    theme: currentTheme || (isDark ? 'dark' : 'light'),
                    tabs: currentTabs || tabs,
                });
            }
            setClients(clients);
            if (currentLang) {
                setLanguage(currentLang);
            }
            if (currentTheme && typeof setTheme === 'function') {
                setTheme(currentTheme);
            }
            if (currentTabs && Array.isArray(currentTabs) && currentTabs.length > 0) {
                setTabs(currentTabs);
                setActiveTabId((curr) => (currentTabs.some((t) => t.id === curr) ? curr : 'code'));
            }
        });

        // Authoritative peer list updates
        activeSocket.on(ACTIONS.PEERS_UPDATE, ({ clients: peerList }) => {
            if (isCancelled) return;
            if (peerList && Array.isArray(peerList)) {
                setClients(peerList);
            }
        });

        // Listening for language change event
        activeSocket.on(ACTIONS.LANGUAGE_CHANGE, ({ language: newLang }) => {
            if (isCancelled) return;
            if (newLang && newLang !== languageRef.current) {
                setLanguage(newLang);
                toast.success(`Language synced to ${LANGUAGE_CONFIGS[newLang]?.name || newLang}`);
            }
        });

        // Real-time room theme synchronization
        activeSocket.on(ACTIONS.THEME_CHANGE, ({ theme: newTheme, username: switcher }) => {
            if (isCancelled) return;
            console.log('[CLIENT] Received THEME_CHANGE:', { newTheme, switcher });
            if (newTheme && typeof setTheme === 'function') {
                setTheme(newTheme);
                if (switcher && switcher !== username) {
                    toast(`${switcher} switched to ${newTheme === 'dark' ? 'Dark 🌙' : 'Light ☀️'} mode`);
                }
            }
        });

        // Real-time tab events across room peers
        activeSocket.on(ACTIONS.TAB_OPEN, ({ tab, username: opener }) => {
            if (isCancelled) return;
            setTabs((prev) => {
                if (prev.some((t) => t.id === tab.id)) return prev;
                return [...prev, tab];
            });
            setActiveTabId(tab.id);
            if (opener && opener !== username) {
                toast(`${opener} opened ${tab.label}`, { icon: '🎨' });
            }
        });

        activeSocket.on(ACTIONS.TAB_CLOSE, ({ tabId, username: closer }) => {
            if (isCancelled) return;
            setTabs((prev) => {
                const remaining = prev.filter((t) => t.id !== tabId);
                setActiveTabId((curr) => (curr === tabId ? remaining[remaining.length - 1]?.id || 'code' : curr));
                return remaining;
            });
            if (closer && closer !== username) {
                toast(`${closer} closed a tab`, { icon: '🗑️' });
            }
        });

        activeSocket.on(ACTIONS.TAB_SYNC, ({ tabs: syncedTabs }) => {
            if (isCancelled) return;
            if (syncedTabs && Array.isArray(syncedTabs) && syncedTabs.length > 0) {
                setTabs(syncedTabs);
            }
        });

        // Listening for disconnected event
        activeSocket.on(ACTIONS.DISCONNECTED, ({ socketId, username: leftUser }) => {
            if (isCancelled) return;
            toast(`${leftUser} left the room`, { icon: '👋' });
            setClients((prev) => prev.filter((client) => client.socketId !== socketId));
        });

        return () => {
            isCancelled = true;
            activeSocket.off('connect', emitJoin);
            activeSocket.off(ACTIONS.JOINED);
            activeSocket.off(ACTIONS.PEERS_UPDATE);
            activeSocket.off(ACTIONS.DISCONNECTED);
            activeSocket.off(ACTIONS.LANGUAGE_CHANGE);
            activeSocket.off(ACTIONS.THEME_CHANGE);
            activeSocket.off(ACTIONS.TAB_OPEN);
            activeSocket.off(ACTIONS.TAB_CLOSE);
            activeSocket.off(ACTIONS.TAB_SYNC);
            activeSocket.disconnect();
            socketRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [roomId]);

    const handleLanguageChange = (newLang) => {
        setLanguage(newLang);
        socketRef.current?.emit(ACTIONS.LANGUAGE_CHANGE, {
            roomId,
            language: newLang,
        });
    };

    const handleRunCode = async () => {
        if (isExecuting) return;
        const code = codeRef.current || '';
        if (!code.trim()) {
            toast.error('Editor is empty. Write some code to run!');
            return;
        }

        setIsExecuting(true);
        setIsConsoleOpen(true);
        setActiveConsoleTab('output');
        setStatus('running');

        try {
            let backendUrl = (process.env.REACT_APP_BACKEND_URL || '').replace(/\/+$/, '');
            if (!backendUrl && typeof window !== 'undefined' && window.location.port === '3000') {
                backendUrl = `${window.location.protocol}//${window.location.hostname}:5000`;
            }
            const res = await fetch(`${backendUrl}/api/execute`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    language,
                    code,
                    stdin,
                }),
            });

            const data = await res.json();
            setOutput(data.output || '');
            setErrorOutput(data.error || '');
            setExecutionTime(data.executionTime);
            setStatus(data.status || 'success');

            if (data.status === 'success') {
                toast.success('Execution completed!');
            } else if (data.status === 'warning') {
                toast('Completed with warnings', { icon: '⚠️' });
            } else {
                toast.error('Execution encountered errors');
            }
        } catch (err) {
            console.error(err);
            setStatus('error');
            setErrorOutput(`Failed to communicate with execution server: ${err.message}`);
            toast.error('Code execution failed');
        } finally {
            setIsExecuting(false);
        }
    };

    const clearConsole = () => {
        setOutput('');
        setErrorOutput('');
        setExecutionTime(null);
        setStatus('idle');
    };

    const copyRoomId = async () => {
        try {
            await navigator.clipboard.writeText(roomId);
            setShowCopyCelebration(true);
            toast.success('Room ID copied to clipboard!');
        } catch (err) {
            toast.error('Could not copy Room ID');
            console.error(err);
        }
    };

    const leaveRoom = () => {
        reactNavigator('/');
    };

    // Tab management handlers
    const openCanvasTab = () => {
        canvasTabCounter.current += 1;
        const count = canvasTabCounter.current;
        const newTab = {
            id: `canvas-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            type: 'canvas',
            label: `Canvas ${count}`,
        };
        setTabs((prev) => [...prev, newTab]);
        setActiveTabId(newTab.id);
        toast.success(`${newTab.label} opened!`);

        // Broadcast to all peers in the room
        socketRef.current?.emit(ACTIONS.TAB_OPEN, {
            roomId,
            tab: newTab,
            username,
        });
    };

    const closeTab = (tabId) => {
        if (tabId === 'code') return; // Can't close code tab
        setTabs((prev) => {
            const remaining = prev.filter((t) => t.id !== tabId);
            // If we're closing the active tab, switch to the last tab
            if (activeTabId === tabId) {
                setActiveTabId(remaining[remaining.length - 1]?.id || 'code');
            }
            return remaining;
        });

        // Broadcast to all peers in the room
        socketRef.current?.emit(ACTIONS.TAB_CLOSE, {
            roomId,
            tabId,
            username,
        });
    };

    const switchTab = (tabId) => {
        setActiveTabId(tabId);
    };

    const handleThemeToggle = (e) => {
        const nextTheme = isDark ? 'light' : 'dark';
        toggleTheme(e);
        const activeSocket = socketRef.current || socket;
        console.log('[CLIENT] handleThemeToggle emitting THEME_CHANGE:', { roomId, theme: nextTheme, username, connected: activeSocket?.connected, socketId: activeSocket?.id });
        activeSocket?.emit(ACTIONS.THEME_CHANGE, {
            roomId,
            theme: nextTheme,
            username,
        });
    };

    return (
        <div className="h-screen w-full flex flex-col overflow-hidden bg-white dark:bg-[#0f0f0f] text-gray-900 dark:text-gray-100 select-none">
            {/* 1. TOP STICKY HEADER (64px) */}
            <header className="h-14 sm:h-16 shrink-0 px-3 sm:px-5 flex items-center justify-between bg-white dark:bg-[#0f0f0f] border-b border-gray-200/80 dark:border-white/10 z-30 transition-colors">
                {/* Left: Brand & Room Pill */}
                <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                    <button
                        onClick={leaveRoom}
                        className="flex items-center gap-2 group outline-none shrink-0"
                        title="Back to Home"
                    >
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20 group-hover:scale-105 transition-transform">
                            <Code2 size={17} />
                        </div>
                        <span className="hidden md:inline font-bold text-base tracking-tight text-gray-900 dark:text-white">
                            Code<span className="text-blue-600 dark:text-blue-400">Craft</span>
                        </span>
                    </button>

                    {/* Room ID Pill with Click-to-Copy */}
                    <div className="relative">
                        <button
                            onClick={copyRoomId}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 dark:bg-[#1f1f1f] hover:bg-gray-200 dark:hover:bg-[#282828] border border-gray-200 dark:border-white/10 text-xs font-mono transition-colors text-gray-700 dark:text-gray-300"
                            title="Click to copy Room ID"
                        >
                            <span className="text-[10px] text-gray-400 font-sans uppercase font-semibold">Room:</span>
                            <span className="max-w-[80px] sm:max-w-[130px] truncate font-medium">{roomId}</span>
                            <Copy size={12} className="text-gray-400 shrink-0" />
                        </button>
                        {showCopyCelebration && (
                            <CelebrationParticles
                                trigger={showCopyCelebration}
                                message="Copied!"
                                onComplete={() => setShowCopyCelebration(false)}
                            />
                        )}
                    </div>
                </div>

                {/* Center: Morphing Quick Action Bar */}
                <div className="flex items-center gap-2">
                    <QuickActionBar
                        languages={LANGUAGE_CONFIGS}
                        currentLanguage={language}
                        onSelectLanguage={handleLanguageChange}
                        onRunCode={handleRunCode}
                        onCopyRoomId={copyRoomId}
                        onToggleTerminal={() => setIsConsoleOpen(!isConsoleOpen)}
                        onLeaveRoom={leaveRoom}
                    />

                    {/* Desktop Language Selector Pill */}
                    <div className="hidden sm:flex items-center">
                        <select
                            value={language}
                            onChange={(e) => handleLanguageChange(e.target.value)}
                            className="h-9 px-3 rounded-full bg-gray-100 dark:bg-[#1f1f1f] text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-white/10 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/40 cursor-pointer transition-colors"
                        >
                            {Object.entries(LANGUAGE_CONFIGS).map(([key, config]) => (
                                <option key={key} value={key} className="bg-white dark:bg-[#141414]">
                                    {config.icon} {config.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Right: Primary Run Button & Actions */}
                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                    {/* Run Code Laser Pill Button */}
                    <LaserPillButton
                        onClick={handleRunCode}
                        disabled={isExecuting}
                        variant="primary"
                        size="md"
                        className="font-semibold tracking-wide shadow-md shadow-blue-600/20"
                        title="Execute Code (Ctrl+Enter)"
                    >
                        {isExecuting ? (
                            <>
                                <Loader2 size={15} className="animate-spin" />
                                <span className="hidden xs:inline text-xs">Running...</span>
                            </>
                        ) : (
                            <>
                                <Play size={14} fill="currentColor" />
                                <span className="text-xs">Run Code</span>
                                <span className="hidden lg:inline-block text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-black/20 text-white/90">
                                    Ctrl+Enter
                                </span>
                            </>
                        )}
                    </LaserPillButton>

                    {/* Terminal Toggle Button (Desktop) */}
                    <button
                        onClick={() => setIsConsoleOpen(!isConsoleOpen)}
                        className={`hidden sm:flex items-center gap-1.5 h-9 px-3 rounded-full border text-xs font-medium transition-all ${
                            isConsoleOpen
                                ? 'bg-gray-100 dark:bg-[#1f1f1f] text-blue-600 dark:text-blue-400 border-blue-500/30'
                                : 'bg-transparent text-gray-600 dark:text-gray-400 border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5'
                        }`}
                        title="Toggle Terminal Panel"
                    >
                        <Terminal size={14} />
                        <span className="hidden md:inline">Terminal</span>
                    </button>

                    {/* View Transitions Circular Wave Theme Toggle */}
                    <button
                        onClick={handleThemeToggle}
                        className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-gray-100 dark:bg-[#1f1f1f] text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-white/10 hover:border-blue-500/40 dark:hover:border-white/20 transition-all duration-300 shadow-sm active:translate-y-[0.5px]"
                        title={`Switch to ${isDark ? 'Light' : 'Dark'} mode`}
                    >
                        {isDark ? (
                            <Sun size={17} className="text-amber-400" />
                        ) : (
                            <Moon size={17} className="text-gray-700" />
                        )}
                    </button>

                    {/* Mobile Collaborators Drawer Trigger */}
                    <button
                        onClick={() => setMobileDrawerOpen(true)}
                        className="sm:hidden w-9 h-9 rounded-full flex items-center justify-center bg-gray-100 dark:bg-[#1f1f1f] text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-white/10"
                        title="Collaborators"
                    >
                        <Users size={16} />
                    </button>
                </div>
            </header>

            {/* 2. MAIN WORKSPACE WITH RESIZABLE DRAGGABLE SIDEBAR */}
            <div className="flex-1 flex overflow-hidden relative">
                {/* Desktop Collapsible & Draggable Sidebar */}
                <aside
                    style={{
                        width: isSidebarCollapsed ? '0px' : `${sidebarWidth}px`,
                    }}
                    className={`hidden sm:flex flex-col shrink-0 h-full bg-gray-50/50 dark:bg-[#0c0c0c] border-r border-gray-200/80 dark:border-white/10 relative transition-[width] duration-300 ease-golden overflow-hidden`}
                >
                    <div className="flex flex-col h-full w-[240px] p-3 justify-between">
                        {/* Top: Section Header & Collaborators List */}
                        <div className="flex flex-col overflow-hidden">
                            <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-200/80 dark:border-white/5">
                                <div className="flex items-center gap-2">
                                    <Users size={15} className="text-blue-500" />
                                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                        Studio Peers
                                    </span>
                                </div>
                                {/* Mechanical Rolling Counter for Member Count */}
                                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-semibold">
                                    <RollingCounter value={clients.length} />
                                    <span className="text-[10px]">online</span>
                                </div>
                            </div>

                            {/* Collaborator Avatar Squircle Cards */}
                            <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-280px)] pr-1">
                                {clients.map((client) => (
                                    <Client
                                        key={client.socketId}
                                        username={client.username}
                                        isSelf={client.socketId === (socket?.id || socketRef.current?.id) || client.username === username}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Bottom: Segmented Pill Action Controls */}
                        <div className="pt-3 border-t border-gray-200/80 dark:border-white/5 space-y-2">
                            <LaserPillButton
                                onClick={copyRoomId}
                                variant="secondary"
                                size="sm"
                                className="w-full text-xs font-medium justify-center"
                            >
                                <Copy size={13} />
                                <span>Copy Room ID</span>
                            </LaserPillButton>

                            <LaserPillButton
                                onClick={leaveRoom}
                                variant="danger"
                                size="sm"
                                className="w-full text-xs font-medium justify-center"
                            >
                                <LogOut size={13} />
                                <span>Leave Room</span>
                            </LaserPillButton>
                        </div>
                    </div>

                    {/* Draggable Resizer Handle */}
                    <div
                        onMouseDown={startResizing}
                        onTouchStart={startResizing}
                        className={`absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-blue-500 transition-colors z-20 ${
                            isDraggingSidebar ? 'bg-blue-500' : 'bg-transparent'
                        }`}
                        title="Drag to resize sidebar"
                    />
                </aside>

                {/* Sidebar Collapse Toggle Button */}
                <button
                    onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                    className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 z-20 w-4 h-12 items-center justify-center rounded-r-md bg-gray-200 dark:bg-[#1f1f1f] text-gray-500 hover:text-gray-900 dark:hover:text-white border border-l-0 border-gray-300 dark:border-white/10 transition-all hover:w-5 shadow-md"
                    title={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
                >
                    {isSidebarCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
                </button>

                {/* Editor & Console Column */}
                <main className="flex-1 flex flex-col h-full overflow-hidden relative">
                    {/* Browser-Style Workspace Tab Bar */}
                    <WorkspaceTabs
                        tabs={tabs}
                        activeTabId={activeTabId}
                        onSwitchTab={switchTab}
                        onCloseTab={closeTab}
                        onNewCanvas={openCanvasTab}
                    />

                    {/* Tab Content Area */}
                    <div className="flex-1 relative overflow-hidden bg-white dark:bg-[#0f0f0f]">
                        {/* CodeMirror Editor (visible when Code tab is active) */}
                        <div className={activeTabId === 'code' ? 'h-full' : 'hidden'}>
                            <Editor
                                socket={socket}
                                socketRef={socketRef}
                                roomId={roomId}
                                username={username}
                                language={language}
                                initialCode={LANGUAGE_CONFIGS[language]?.defaultCode}
                                onCodeChange={(code) => {
                                    codeRef.current = code;
                                }}
                                onRunCode={handleRunCode}
                            />
                        </div>

                        {/* Collaborative Canvas (visible when a Canvas tab is active) */}
                        {tabs
                            .filter((t) => t.type === 'canvas')
                            .map((tab) => (
                                <CollabCanvas
                                    key={tab.id}
                                    canvasId={tab.id}
                                    socket={socket}
                                    socketRef={socketRef}
                                    roomId={roomId}
                                    username={username}
                                    isVisible={activeTabId === tab.id}
                                />
                            ))}
                    </div>

                    {/* Interactive Console / Terminal Panel */}
                    {isConsoleOpen && (
                        <div className="h-64 sm:h-72 shrink-0 flex flex-col bg-gray-50 dark:bg-[#0c0c0c] border-t border-gray-200/80 dark:border-white/10 shadow-xl transition-all">
                            {/* Terminal Header Toolbar */}
                            <div className="h-10 px-3 sm:px-4 flex items-center justify-between border-b border-gray-200/80 dark:border-white/5 bg-white/60 dark:bg-[#121212]/60 backdrop-blur-md">
                                {/* Segmented Tabs */}
                                <div className="flex items-center gap-1 bg-gray-100 dark:bg-[#1a1a1a] p-0.5 rounded-full border border-gray-200/80 dark:border-white/5">
                                    <button
                                        onClick={() => setActiveConsoleTab('output')}
                                        className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all ${
                                            activeConsoleTab === 'output'
                                                ? 'bg-white dark:bg-[#252525] text-gray-900 dark:text-white shadow-sm'
                                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                        }`}
                                    >
                                        <span>Output</span>
                                        {status === 'success' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                                        {status === 'error' && <span className="w-1.5 h-1.5 rounded-full bg-red-500" />}
                                        {status === 'running' && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />}
                                    </button>

                                    <button
                                        onClick={() => setActiveConsoleTab('input')}
                                        className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all ${
                                            activeConsoleTab === 'input'
                                                ? 'bg-white dark:bg-[#252525] text-gray-900 dark:text-white shadow-sm'
                                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                        }`}
                                    >
                                        <span>Input (stdin)</span>
                                        {stdin.trim() && <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
                                    </button>
                                </div>

                                {/* Status Badges & Metrics */}
                                <div className="flex items-center gap-2 sm:gap-3 text-xs">
                                    {status === 'running' && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 font-medium">
                                            <Loader2 size={12} className="animate-spin" />
                                            <span>Running</span>
                                        </span>
                                    )}
                                    {status === 'success' && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-medium">
                                            <CheckCircle2 size={12} />
                                            <span>Success</span>
                                        </span>
                                    )}
                                    {status === 'error' && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-medium">
                                            <AlertCircle size={12} />
                                            <span>Error</span>
                                        </span>
                                    )}

                                    {/* Mechanical Rolling Counter for Execution Duration */}
                                    {executionTime !== null && (
                                        <div className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 dark:bg-[#1f1f1f] text-gray-600 dark:text-gray-400 font-mono text-[11px] border border-gray-200 dark:border-white/5">
                                            <Clock size={11} className="text-blue-500" />
                                            <RollingCounter value={executionTime} suffix="ms" />
                                        </div>
                                    )}

                                    <button
                                        onClick={clearConsole}
                                        className="text-xs text-gray-500 hover:text-gray-900 dark:hover:text-white px-2 py-1 rounded-md hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                                    >
                                        Clear
                                    </button>

                                    <button
                                        onClick={() => setIsConsoleOpen(false)}
                                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-full"
                                        title="Close Terminal"
                                    >
                                        <X size={15} />
                                    </button>
                                </div>
                            </div>

                            {/* Terminal Body */}
                            <div className="flex-1 p-3 sm:p-4 overflow-y-auto font-mono text-xs sm:text-sm leading-relaxed">
                                {activeConsoleTab === 'output' ? (
                                    <div className="space-y-2">
                                        {output && (
                                            <pre className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-all font-mono">
                                                {output}
                                            </pre>
                                        )}
                                        {errorOutput && (
                                            <pre className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/40 whitespace-pre-wrap break-all font-mono">
                                                {errorOutput}
                                            </pre>
                                        )}
                                        {!output && !errorOutput && (
                                            <div className="text-gray-400 dark:text-gray-500 italic py-4 text-center">
                                                {isExecuting
                                                    ? 'Executing program...'
                                                    : 'Click "Run Code" or press Ctrl + Enter to run your program.'}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="h-full">
                                        <textarea
                                            value={stdin}
                                            onChange={(e) => setStdin(e.target.value)}
                                            placeholder="Enter standard input (stdin) for interactive programs..."
                                            className="w-full h-full min-h-[140px] bg-transparent text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-600 outline-none resize-none font-mono text-xs sm:text-sm"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </main>
            </div>

            {/* 3. MOBILE COLLABORATORS & SETTINGS DRAWER (with Body Scroll Lock) */}
            {mobileDrawerOpen && (
                <div className="sm:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm animate-slide-fade-up">
                    <div className="w-full bg-white dark:bg-[#141414] rounded-t-3xl border-t border-gray-200 dark:border-white/10 p-5 space-y-4 max-h-[80vh] overflow-y-auto">
                        <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-white/5">
                            <div className="flex items-center gap-2">
                                <Users size={18} className="text-blue-500" />
                                <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                                    Connected Peers ({clients.length})
                                </h3>
                            </div>
                            <button
                                onClick={() => setMobileDrawerOpen(false)}
                                className="p-1 text-gray-400 hover:text-gray-900 dark:hover:text-white"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="space-y-2">
                            {clients.map((client) => (
                                <Client
                                    key={client.socketId}
                                    username={client.username}
                                    isSelf={client.socketId === (socket?.id || socketRef.current?.id) || client.username === username}
                                />
                            ))}
                        </div>

                        <div className="pt-3 border-t border-gray-100 dark:border-white/5 space-y-2">
                            <LaserPillButton
                                onClick={copyRoomId}
                                variant="secondary"
                                size="md"
                                className="w-full text-xs font-medium"
                            >
                                <Copy size={14} />
                                <span>Copy Room ID</span>
                            </LaserPillButton>

                            <LaserPillButton
                                onClick={leaveRoom}
                                variant="danger"
                                size="md"
                                className="w-full text-xs font-medium"
                            >
                                <LogOut size={14} />
                                <span>Leave Room</span>
                            </LaserPillButton>
                        </div>
                    </div>
                </div>
            )}

            {/* 4. MOBILE BOTTOM NAVIGATION */}
            <MobileBottomNav
                activeTab={mobileActiveView}
                onTabChange={(tab) => {
                    setMobileActiveView(tab);
                    if (tab === 'collaborators') {
                        setMobileDrawerOpen(true);
                    } else if (tab === 'terminal') {
                        setIsConsoleOpen(true);
                        setActiveConsoleTab('output');
                    } else if (tab === 'editor') {
                        setIsConsoleOpen(false);
                    }
                }}
                clientCount={clients.length}
                onRunCode={handleRunCode}
                isExecuting={isExecuting}
                onToggleTheme={handleThemeToggle}
            />
        </div>
    );
};

export default EditorPage;
