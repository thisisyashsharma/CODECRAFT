import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Pencil, Eraser, Trash2, Download, Minus, Plus } from 'lucide-react';
import ACTIONS from '../Actions';

const COLORS = [
    '#f8f8f2', '#ff5555', '#ff79c6', '#bd93f9',
    '#8be9fd', '#50fa7b', '#f1fa8c', '#ffb86c',
];

const CollabCanvas = ({ socketRef, roomId, canvasId = 'default', isVisible }) => {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const ctxRef = useRef(null);
    const isDrawingRef = useRef(false);
    const currentStrokeRef = useRef([]);
    const strokesRef = useRef([]);

    const [tool, setTool] = useState('pen');
    const [color, setColor] = useState('#f8f8f2');
    const [strokeWidth, setStrokeWidth] = useState(3);

    // Initialize canvas and fit to container
    const initCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        const rect = container.getBoundingClientRect();
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Replay a single stroke on canvas
    const drawStroke = useCallback((stroke) => {
        const ctx = ctxRef.current;
        if (!ctx || !stroke.points || stroke.points.length < 2) return;

        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        const rect = container.getBoundingClientRect();

        ctx.beginPath();
        ctx.strokeStyle = stroke.tool === 'eraser' ? '#0f0f0f' : stroke.color;
        ctx.lineWidth = stroke.tool === 'eraser' ? stroke.width * 3 : stroke.width;
        ctx.globalCompositeOperation = stroke.tool === 'eraser' ? 'destination-out' : 'source-over';

        // Points are stored as ratios (0-1) relative to canvas dimensions
        const startX = stroke.points[0].x * rect.width;
        const startY = stroke.points[0].y * rect.height;
        ctx.moveTo(startX, startY);

        for (let i = 1; i < stroke.points.length; i++) {
            const x = stroke.points[i].x * rect.width;
            const y = stroke.points[i].y * rect.height;
            ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.globalCompositeOperation = 'source-over';
    }, []);

    // Replay all strokes from history
    const replayAllStrokes = useCallback(() => {
        const ctx = ctxRef.current;
        const canvas = canvasRef.current;
        if (!ctx || !canvas) return;

        const container = containerRef.current;
        const rect = container.getBoundingClientRect();
        ctx.clearRect(0, 0, rect.width, rect.height);

        strokesRef.current.forEach((stroke) => {
            drawStroke(stroke);
        });
    }, [drawStroke]);

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

    // Socket listeners for receiving remote drawing events
    useEffect(() => {
        const socket = socketRef.current;
        if (!socket) return;

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

        socket.on(ACTIONS.CANVAS_DRAW, handleRemoteDraw);
        socket.on(ACTIONS.CANVAS_CLEAR, handleRemoteClear);
        socket.on(ACTIONS.CANVAS_SYNC, handleCanvasSync);

        return () => {
            socket.off(ACTIONS.CANVAS_DRAW, handleRemoteDraw);
            socket.off(ACTIONS.CANVAS_CLEAR, handleRemoteClear);
            socket.off(ACTIONS.CANVAS_SYNC, handleCanvasSync);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [socketRef.current, canvasId, drawStroke, replayAllStrokes]);

    // Convert pointer event to normalized coordinates (0-1 ratios)
    const getPointerPos = (e) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return {
            x: (clientX - rect.left) / rect.width,
            y: (clientY - rect.top) / rect.height,
        };
    };

    const handlePointerDown = (e) => {
        e.preventDefault();
        isDrawingRef.current = true;
        const pos = getPointerPos(e);
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
    };

    const handlePointerMove = (e) => {
        if (!isDrawingRef.current) return;
        e.preventDefault();
        const pos = getPointerPos(e);
        currentStrokeRef.current.push(pos);

        const ctx = ctxRef.current;
        const container = containerRef.current;
        if (!ctx || !container) return;
        const rect = container.getBoundingClientRect();

        ctx.lineTo(pos.x * rect.width, pos.y * rect.height);
        ctx.stroke();
    };

    const handlePointerUp = () => {
        if (!isDrawingRef.current) return;
        isDrawingRef.current = false;

        const ctx = ctxRef.current;
        if (ctx) {
            ctx.globalCompositeOperation = 'source-over';
        }

        const points = currentStrokeRef.current;
        if (points.length >= 2) {
            const stroke = {
                points,
                color,
                width: strokeWidth,
                tool,
                timestamp: Date.now(),
            };
            strokesRef.current.push(stroke);

            // Emit to peers
            socketRef.current?.emit(ACTIONS.CANVAS_DRAW, {
                roomId,
                canvasId,
                stroke,
            });
        }
        currentStrokeRef.current = [];
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
        socketRef.current?.emit(ACTIONS.CANVAS_CLEAR, { roomId, canvasId });
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
            <div className="h-11 shrink-0 px-3 flex items-center justify-between bg-white/60 dark:bg-[#121212]/60 backdrop-blur-md border-b border-gray-200/80 dark:border-white/5">
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
                    onTouchStart={handlePointerDown}
                    onTouchMove={handlePointerMove}
                    onTouchEnd={handlePointerUp}
                    className="absolute inset-0 touch-none"
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
            </div>
        </div>
    );
};

export default CollabCanvas;
