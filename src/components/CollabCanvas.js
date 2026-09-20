import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Pencil, Eraser, Trash2, Download, Minus, Plus } from 'lucide-react';
import ACTIONS from '../Actions';

const COLORS = [
    '#f8f8f2', '#ff5555', '#ff79c6', '#bd93f9',
    '#8be9fd', '#50fa7b', '#f1fa8c', '#ffb86c',
];

const PEER_COLORS = [
    '#ec4899', '#8b5cf6', '#3b82f6', '#10b981',
    '#f59e0b', '#06b6d4', '#ef4444', '#14b8a6',
];

function getPeerColor(id = '') {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash = (hash << 5) - hash + id.charCodeAt(i);
        hash |= 0;
    }
    return PEER_COLORS[Math.abs(hash) % PEER_COLORS.length];
}

const CollabCanvas = ({ socket, socketRef, roomId, username, canvasId = 'default', isVisible }) => {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const ctxRef = useRef(null);
    const isDrawingRef = useRef(false);
    const currentStrokeRef = useRef([]);
    const strokesRef = useRef([]);
    const cursorThrottleRef = useRef(null);

    const [tool, setTool] = useState('pen');
    const [color, setColor] = useState('#f8f8f2');
    const [strokeWidth, setStrokeWidth] = useState(3);
    const [remoteCursors, setRemoteCursors] = useState({});

    // Replay a single stroke on canvas
    const drawStroke = useCallback((stroke) => {
        const ctx = ctxRef.current;
        if (!ctx || !stroke.points || stroke.points.length === 0) return;

        const container = containerRef.current;
        if (!container) return;

        const rect = container.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;

        ctx.beginPath();
        ctx.strokeStyle = stroke.tool === 'eraser' ? '#0f0f0f' : stroke.color;
        ctx.lineWidth = stroke.tool === 'eraser' ? stroke.width * 3 : stroke.width;
        ctx.globalCompositeOperation = stroke.tool === 'eraser' ? 'destination-out' : 'source-over';

        // Points are stored as ratios (0-1) relative to canvas dimensions
        const startX = stroke.points[0].x * rect.width;
        const startY = stroke.points[0].y * rect.height;

        if (stroke.points.length === 1) {
            ctx.fillStyle = stroke.tool === 'eraser' ? '#0f0f0f' : stroke.color;
            ctx.arc(startX, startY, (stroke.tool === 'eraser' ? stroke.width * 1.5 : stroke.width) / 2, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.moveTo(startX, startY);

            for (let i = 1; i < stroke.points.length; i++) {
                const x = stroke.points[i].x * rect.width;
                const y = stroke.points[i].y * rect.height;
                ctx.lineTo(x, y);
            }
            ctx.stroke();
        }
        ctx.globalCompositeOperation = 'source-over';
    }, []);

    // Replay all strokes from history
    const replayAllStrokes = useCallback(() => {
        const ctx = ctxRef.current;
        const canvas = canvasRef.current;
        if (!ctx || !canvas) return;

        const container = containerRef.current;
        if (!container) return;
        const rect = container.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;
        ctx.clearRect(0, 0, rect.width, rect.height);

        strokesRef.current.forEach((stroke) => {
            drawStroke(stroke);
        });
    }, [drawStroke]);

    // Initialize canvas and fit to container
    const initCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        const rect = container.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;
        const dpr = window.devicePixelRatio || 1;

        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;

        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctxRef.current = ctx;

        // Redraw all stored strokes after resize
        replayAllStrokes();
    }, [replayAllStrokes]);

    // Setup canvas on mount and handle resize
    useEffect(() => {
        initCanvas();

        const handleResize = () => {
            initCanvas();
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [initCanvas]);

    // Re-init when tab becomes visible
    useEffect(() => {
        if (isVisible) {
            // Small delay to let the DOM settle after tab switch
            const timer = setTimeout(() => initCanvas(), 50);
            return () => clearTimeout(timer);
        }
    }, [isVisible, initCanvas]);

    // Cleanup stale cursors older than 4s
    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();
            setRemoteCursors((prev) => {
                let changed = false;
                const next = {};
                for (const [id, c] of Object.entries(prev)) {
                    if (now - c.lastSeen < 4000) {
                        next[id] = c;
                    } else {
                        changed = true;
                    }
                }
                return changed ? next : prev;
            });
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    // Socket listeners for receiving remote drawing events and cursors
    useEffect(() => {
        const activeSocket = socket || socketRef?.current;
        if (!activeSocket) return;

        const handleRemoteDraw = ({ canvasId: incomingCanvasId, stroke }) => {
            if (incomingCanvasId && incomingCanvasId !== canvasId) return;
            strokesRef.current.push(stroke);
            drawStroke(stroke);
        };

        const handleRemoteClear = ({ canvasId: incomingCanvasId }) => {
            if (incomingCanvasId && incomingCanvasId !== canvasId) return;
            strokesRef.current = [];
            const ctx = ctxRef.current;
            const canvas = canvasRef.current;
            const container = containerRef.current;
            if (ctx && canvas && container) {
                const rect = container.getBoundingClientRect();
                ctx.clearRect(0, 0, rect.width, rect.height);
            }
        };

        const handleCanvasSync = ({ canvasState, strokes }) => {
            if (canvasState && canvasState[canvasId]) {
                strokesRef.current = canvasState[canvasId] || [];
                replayAllStrokes();
            } else if (strokes && (!canvasId || canvasId === 'default')) {
                strokesRef.current = strokes || [];
                replayAllStrokes();
            }
        };

        const handleRemoteCanvasCursor = ({ socketId, canvasId: incomingCanvasId, x, y, isDrawing: remoteDrawing, username: peerName }) => {
            if (incomingCanvasId && incomingCanvasId !== canvasId) return;
            const myId = activeSocket?.id || socketRef?.current?.id;
            if (socketId === myId) return;

            if (x < 0 || y < 0) {
                setRemoteCursors((prev) => {
                    const next = { ...prev };
                    delete next[socketId];
                    return next;
                });
                return;
            }

            setRemoteCursors((prev) => ({
                ...prev,
                [socketId]: {
                    x,
                    y,
                    isDrawing: remoteDrawing,
                    username: peerName || 'Peer',
                    color: getPeerColor(peerName || socketId),
                    lastSeen: Date.now(),
                },
            }));
        };

        const handlePeerDisconnect = ({ socketId }) => {
            setRemoteCursors((prev) => {
                const next = { ...prev };
                delete next[socketId];
                return next;
            });
        };

        activeSocket.on(ACTIONS.CANVAS_DRAW, handleRemoteDraw);
        activeSocket.on(ACTIONS.CANVAS_CLEAR, handleRemoteClear);
        activeSocket.on(ACTIONS.CANVAS_SYNC, handleCanvasSync);
        activeSocket.on(ACTIONS.CANVAS_CURSOR, handleRemoteCanvasCursor);
        activeSocket.on(ACTIONS.DISCONNECTED, handlePeerDisconnect);

        return () => {
            activeSocket.off(ACTIONS.CANVAS_DRAW, handleRemoteDraw);
            activeSocket.off(ACTIONS.CANVAS_CLEAR, handleRemoteClear);
            activeSocket.off(ACTIONS.CANVAS_SYNC, handleCanvasSync);
            activeSocket.off(ACTIONS.CANVAS_CURSOR, handleRemoteCanvasCursor);
            activeSocket.off(ACTIONS.DISCONNECTED, handlePeerDisconnect);
        };
    }, [socket, socketRef, canvasId, drawStroke, replayAllStrokes]);

    // Safely extract client coordinates across Pointer, Mouse, and Touch events
    const getCoords = (e) => {
        if (e.touches && e.touches.length > 0) {
            return { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY };
        }
        if (e.changedTouches && e.changedTouches.length > 0) {
            return { clientX: e.changedTouches[0].clientX, clientY: e.changedTouches[0].clientY };
        }
        return { clientX: e.clientX, clientY: e.clientY };
    };

    // Convert event to normalized coordinates (0-1 ratios)
    const getNormalizedPos = (e) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        const { clientX, clientY } = getCoords(e);
        if (typeof clientX !== 'number' || isNaN(clientX) || typeof clientY !== 'number' || isNaN(clientY)) {
            return { x: 0, y: 0 };
        }
        const w = rect.width || 1;
        const h = rect.height || 1;
        return {
            x: Math.max(0, Math.min(1, (clientX - rect.left) / w)),
            y: Math.max(0, Math.min(1, (clientY - rect.top) / h)),
        };
    };

    const startDrawing = (e) => {
        isDrawingRef.current = true;
        const pos = getNormalizedPos(e);
        currentStrokeRef.current = [pos];

        const ctx = ctxRef.current;
        const container = containerRef.current;
        if (!ctx || !container) return;
        const rect = container.getBoundingClientRect();

        ctx.beginPath();
        ctx.strokeStyle = tool === 'eraser' ? '#0f0f0f' : color;
        ctx.lineWidth = tool === 'eraser' ? strokeWidth * 3 : strokeWidth;
        ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
        ctx.moveTo(pos.x * rect.width, pos.y * rect.height);

        // Broadcast cursor drawing state
        const activeSocket = socket || socketRef?.current;
        activeSocket?.emit(ACTIONS.CANVAS_CURSOR, {
            roomId,
            canvasId,
            x: pos.x,
            y: pos.y,
            isDrawing: true,
            username,
        });
    };

    const continueDrawing = (e) => {
        const pos = getNormalizedPos(e);

        // Broadcast cursor movement (throttled at 40ms)
        if (cursorThrottleRef.current === null) {
            cursorThrottleRef.current = setTimeout(() => {
                cursorThrottleRef.current = null;
                const activeSocket = socket || socketRef?.current;
                activeSocket?.emit(ACTIONS.CANVAS_CURSOR, {
                    roomId,
                    canvasId,
                    x: pos.x,
                    y: pos.y,
                    isDrawing: isDrawingRef.current,
                    username,
                });
            }, 40);
        }

        if (!isDrawingRef.current) return;
        currentStrokeRef.current.push(pos);

        const ctx = ctxRef.current;
        const container = containerRef.current;
        if (!ctx || !container) return;
        const rect = container.getBoundingClientRect();

        ctx.lineTo(pos.x * rect.width, pos.y * rect.height);
        ctx.stroke();
    };

    const finishDrawing = () => {
        if (!isDrawingRef.current) return;
        isDrawingRef.current = false;

        const ctx = ctxRef.current;
        if (ctx) {
            ctx.globalCompositeOperation = 'source-over';
        }

        const points = currentStrokeRef.current;
        if (points.length >= 1) {
            const stroke = {
                points,
                color,
                width: strokeWidth,
                tool,
                timestamp: Date.now(),
            };
            strokesRef.current.push(stroke);

            // Emit to peers
            const activeSocket = socket || socketRef?.current;
            activeSocket?.emit(ACTIONS.CANVAS_DRAW, {
                roomId,
                canvasId,
                stroke,
            });
        }
        currentStrokeRef.current = [];

        // Clear cursor drawing state
        const activeSocket = socket || socketRef?.current;
        activeSocket?.emit(ACTIONS.CANVAS_CURSOR, {
            roomId,
            canvasId,
            x: -1,
            y: -1,
            isDrawing: false,
            username,
        });
    };

    const handlePointerDown = (e) => {
        if (e.target && e.target.setPointerCapture && e.pointerId !== undefined) {
            try { e.target.setPointerCapture(e.pointerId); } catch (err) {}
        }
        startDrawing(e);
    };

    const handlePointerMove = (e) => {
        continueDrawing(e);
    };

    const handlePointerUp = (e) => {
        if (e && e.target && e.target.releasePointerCapture && e.pointerId !== undefined) {
            try { e.target.releasePointerCapture(e.pointerId); } catch (err) {}
        }
        finishDrawing();
    };

    const handleTouchStart = (e) => {
        if (e.cancelable) e.preventDefault();
        if (typeof window !== 'undefined' && window.PointerEvent) return;
        startDrawing(e);
    };

    const handleTouchMove = (e) => {
        if (e.cancelable) e.preventDefault();
        if (typeof window !== 'undefined' && window.PointerEvent) return;
        continueDrawing(e);
    };

    const handleTouchEnd = (e) => {
        if (e.cancelable) e.preventDefault();
        if (typeof window !== 'undefined' && window.PointerEvent) return;
        finishDrawing();
    };

    const handleClearCanvas = () => {
        strokesRef.current = [];
        const ctx = ctxRef.current;
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (ctx && canvas && container) {
            const rect = container.getBoundingClientRect();
            ctx.clearRect(0, 0, rect.width, rect.height);
        }
        const activeSocket = socket || socketRef?.current;
        activeSocket?.emit(ACTIONS.CANVAS_CLEAR, { roomId, canvasId });
    };

    const handleDownload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const link = document.createElement('a');
        link.download = `codecraft-canvas-${roomId.slice(0, 8)}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    };

    return (
        <div
            className={`flex flex-col h-full w-full ${isVisible ? '' : 'hidden'}`}
        >
            {/* Canvas Toolbar */}
            <div className="h-11 shrink-0 px-3 flex items-center justify-between bg-white/60 dark:bg-[#121212]/60 backdrop-blur-md border-b border-gray-200/80 dark:border-white/5 overflow-x-auto scrollbar-none">
                {/* Left: Drawing Tools */}
                <div className="flex items-center gap-1.5">
                    {/* Pen Tool */}
                    <button
                        onClick={() => setTool('pen')}
                        className={`p-1.5 rounded-lg transition-all ${
                            tool === 'pen'
                                ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 shadow-sm'
                                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'
                        }`}
                        title="Pen Tool"
                    >
                        <Pencil size={16} />
                    </button>

                    {/* Eraser Tool */}
                    <button
                        onClick={() => setTool('eraser')}
                        className={`p-1.5 rounded-lg transition-all ${
                            tool === 'eraser'
                                ? 'bg-pink-100 dark:bg-pink-900/40 text-pink-600 dark:text-pink-400 shadow-sm'
                                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'
                        }`}
                        title="Eraser Tool"
                    >
                        <Eraser size={16} />
                    </button>

                    {/* Divider */}
                    <div className="w-px h-5 bg-gray-200 dark:bg-white/10 mx-1" />

                    {/* Color Palette */}
                    <div className="flex items-center gap-1">
                        {COLORS.map((c) => (
                            <button
                                key={c}
                                onClick={() => {
                                    setColor(c);
                                    setTool('pen');
                                }}
                                className={`w-5 h-5 rounded-full border-2 transition-all hover:scale-110 ${
                                    color === c && tool === 'pen'
                                        ? 'border-blue-500 scale-125 shadow-md'
                                        : 'border-gray-300 dark:border-white/20'
                                }`}
                                style={{ backgroundColor: c }}
                                title={c}
                            />
                        ))}
                    </div>

                    {/* Divider */}
                    <div className="w-px h-5 bg-gray-200 dark:bg-white/10 mx-1" />

                    {/* Stroke Width */}
                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={() => setStrokeWidth(Math.max(1, strokeWidth - 1))}
                            className="p-1 rounded text-gray-400 hover:text-gray-700 dark:hover:text-white"
                            title="Decrease stroke width"
                        >
                            <Minus size={12} />
                        </button>
                        <span className="text-[11px] font-mono text-gray-500 dark:text-gray-400 w-5 text-center">
                            {strokeWidth}
                        </span>
                        <button
                            onClick={() => setStrokeWidth(Math.min(12, strokeWidth + 1))}
                            className="p-1 rounded text-gray-400 hover:text-gray-700 dark:hover:text-white"
                            title="Increase stroke width"
                        >
                            <Plus size={12} />
                        </button>
                    </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-1.5">
                    <button
                        onClick={handleDownload}
                        className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                        title="Download as PNG"
                    >
                        <Download size={15} />
                    </button>
                    <button
                        onClick={handleClearCanvas}
                        className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                        title="Clear Canvas (for all peers)"
                    >
                        <Trash2 size={15} />
                    </button>
                </div>
            </div>

            {/* Canvas Drawing Area */}
            <div
                ref={containerRef}
                className="flex-1 overflow-hidden bg-[#0f0f0f] cursor-crosshair relative"
            >
                <canvas
                    ref={canvasRef}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerLeave={handlePointerUp}
                    onPointerCancel={handlePointerUp}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    onTouchCancel={handleTouchEnd}
                    className="absolute inset-0 touch-none select-none"
                    style={{ touchAction: 'none' }}
                />

                {/* Grid pattern overlay for visual reference */}
                <div
                    className="absolute inset-0 pointer-events-none opacity-[0.03]"
                    style={{
                        backgroundImage:
                            'linear-gradient(rgba(255,255,255,.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.3) 1px, transparent 1px)',
                        backgroundSize: '40px 40px',
                    }}
                />

                {/* Remote Peer Cursors Overlay */}
                {Object.entries(remoteCursors).map(([id, cur]) => (
                    <div
                        key={id}
                        className="pointer-events-none transition-all duration-75 ease-out select-none"
                        style={{
                            position: 'absolute',
                            left: `${cur.x * 100}%`,
                            top: `${cur.y * 100}%`,
                            transform: 'translate(-2px, -2px)',
                            zIndex: 40,
                        }}
                    >
                        {/* Custom SVG Stylus / Pointer Icon */}
                        <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill={cur.color}
                            style={{ filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.7))' }}
                        >
                            <path d="M3 3l7 18 3-7 7-3L3 3z" />
                        </svg>

                        {/* Floating Name Badge with Drawing Beacon */}
                        <div
                            style={{ backgroundColor: cur.color }}
                            className="text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg whitespace-nowrap -mt-1 ml-3.5 flex items-center gap-1.5 border border-white/20"
                        >
                            <span>{cur.username}</span>
                            {cur.isDrawing && (
                                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CollabCanvas;
