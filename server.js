const express = require('express');
const app = express();
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
const ACTIONS = require('./src/Actions');

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
});

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// Wandbox compiler mapping for multi-language execution
const WANDBOX_COMPILERS = {
    javascript: 'nodejs-20.17.0',
    python: 'cpython-head',
    cpp: 'gcc-13.2.0',
    c: 'gcc-13.2.0',
    java: 'openjdk-jdk-21+35',
    rust: 'rust-1.82.0',
    go: 'go-1.23.2',
};

// Helper to run code locally via child process
function executeLocally(command, args, code, stdin = '', timeoutMs = 7000) {
    return new Promise((resolve) => {
        const startTime = Date.now();
        let stdout = '';
        let stderr = '';
        let killed = false;

        const child = spawn(command, args, {
            stdio: ['pipe', 'pipe', 'pipe'],
            windowsHide: true,
        });

        const timer = setTimeout(() => {
            killed = true;
            child.kill('SIGKILL');
        }, timeoutMs);

        if (stdin) {
            child.stdin.write(stdin);
        }
        child.stdin.end();

        child.stdout.on('data', (data) => {
            stdout += data.toString();
        });

        child.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        child.on('close', (code) => {
            clearTimeout(timer);
            const executionTime = Date.now() - startTime;
            if (killed) {
                return resolve({
                    status: 'error',
                    output: stdout,
                    error: `Execution timed out after ${timeoutMs / 1000}s.`,
                    executionTime,
                });
            }
            resolve({
                status: code === 0 ? 'success' : 'error',
                output: stdout,
                error: stderr,
                executionTime,
            });
        });

        child.on('error', (err) => {
            clearTimeout(timer);
            resolve({
                status: 'error',
                output: stdout,
                error: err.message,
                executionTime: Date.now() - startTime,
            });
        });
    });
}

// Remote Wandbox execution runner
async function executeWithWandbox(language, code, stdin = '') {
    const startTime = Date.now();
    const compiler = WANDBOX_COMPILERS[language];
    if (!compiler) {
        throw new Error(`Unsupported language for compiler execution: ${language}`);
    }

    const payload = {
        compiler,
        code,
        stdin: stdin || '',
    };
    if (language === 'cpp') {
        payload['compiler-option-raw'] = '-O2\n-std=c++20';
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const res = await fetch('https://wandbox.org/api/compile.json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const data = await res.json();
    const executionTime = Date.now() - startTime;

    const compilerOutput = (data.compiler_output || '') + (data.compiler_error || '');
    const programOutput = data.program_output || '';
    const programError = (data.program_error || '') + (data.compiler_message ? '' : '');

    const isSuccess = data.status === '0' || data.status === 0;
    const combinedOutput = programOutput || (isSuccess ? compilerOutput : '');
    const combinedError = (!isSuccess && compilerOutput ? compilerOutput + '\n' : '') + programError;

    return {
        status: isSuccess && !programError ? 'success' : isSuccess ? 'warning' : 'error',
        output: combinedOutput,
        error: combinedError,
        executionTime,
    };
}

// Code Execution API Route
app.post('/api/execute', async (req, res) => {
    const { language = 'javascript', code = '', stdin = '' } = req.body;

    if (!code.trim()) {
        return res.status(400).json({
            status: 'error',
            error: 'No code provided for execution.',
            output: '',
            executionTime: 0,
        });
    }

    try {
        // Fast local execution for JavaScript (Node)
        if (language === 'javascript') {
            const tempFile = path.join(os.tmpdir(), `codecraft_${Date.now()}_${Math.random().toString(36).slice(2)}.js`);
            fs.writeFileSync(tempFile, code, 'utf-8');
            try {
                const result = await executeLocally('node', [tempFile], code, stdin);
                return res.json(result);
            } finally {
                try { fs.unlinkSync(tempFile); } catch (e) {}
            }
        }

        // Fast local execution for Python
        if (language === 'python') {
            const tempFile = path.join(os.tmpdir(), `codecraft_${Date.now()}_${Math.random().toString(36).slice(2)}.py`);
            fs.writeFileSync(tempFile, code, 'utf-8');
            try {
                const result = await executeLocally('python', [tempFile], code, stdin);
                // If local python ran smoothly, return result
                if (result.status === 'success' || result.output || result.error) {
                    return res.json(result);
                }
            } catch (e) {
                // Fallback to remote compiler
            } finally {
                try { fs.unlinkSync(tempFile); } catch (e) {}
            }
        }

        // For C++, Java, Rust, Go, or fallback
        const remoteResult = await executeWithWandbox(language, code, stdin);
        return res.json(remoteResult);
    } catch (err) {
        console.error('Execution Error:', err);
        return res.status(500).json({
            status: 'error',
            output: '',
            error: `Execution failed: ${err.message}`,
            executionTime: 0,
        });
    }
});

// Serve frontend production build
app.use(express.static(path.join(__dirname, 'build')));
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const userSocketMap = {};
const roomLanguageMap = {};
const roomTabsMap = {};
const roomCanvasMap = {};

function getAllConnectedClients(roomId) {
    return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map((socketId) => {
        return {
            socketId,
            username: userSocketMap[socketId],
        };
    });
}

io.on('connection', (socket) => {
    console.log('socket connected', socket.id);

    socket.on(ACTIONS.JOIN, ({ roomId, username }) => {
        userSocketMap[socket.id] = username;
        socket.join(roomId);
        const clients = getAllConnectedClients(roomId);
        const currentLanguage = roomLanguageMap[roomId] || 'javascript';
        if (!roomTabsMap[roomId]) {
            roomTabsMap[roomId] = [{ id: 'code', type: 'code', label: 'Code' }];
        }
        const currentTabs = roomTabsMap[roomId];

        clients.forEach(({ socketId }) => {
            io.to(socketId).emit(ACTIONS.JOINED, {
                clients,
                username,
                socketId: socket.id,
                language: currentLanguage,
                tabs: currentTabs,
            });
        });

        // Send existing canvas state to newly joined user
        const canvasState = roomCanvasMap[roomId] || {};
        io.to(socket.id).emit(ACTIONS.CANVAS_SYNC, { canvasState });
    });

    socket.on(ACTIONS.CODE_CHANGE, ({ roomId, code }) => {
        socket.in(roomId).emit(ACTIONS.CODE_CHANGE, { code });
    });

    socket.on(ACTIONS.SYNC_CODE, ({ socketId, code, language, tabs }) => {
        io.to(socketId).emit(ACTIONS.CODE_CHANGE, { code });
        if (language) {
            io.to(socketId).emit(ACTIONS.LANGUAGE_CHANGE, { language });
        }
        if (tabs) {
            io.to(socketId).emit(ACTIONS.TAB_SYNC, { tabs });
        }
    });

    socket.on(ACTIONS.LANGUAGE_CHANGE, ({ roomId, language }) => {
        roomLanguageMap[roomId] = language;
        socket.in(roomId).emit(ACTIONS.LANGUAGE_CHANGE, { language });
    });

    // Real-time tab open/close events
    socket.on(ACTIONS.TAB_OPEN, ({ roomId, tab, username }) => {
        if (!roomTabsMap[roomId]) {
            roomTabsMap[roomId] = [{ id: 'code', type: 'code', label: 'Code' }];
        }
        if (!roomTabsMap[roomId].some((t) => t.id === tab.id)) {
            roomTabsMap[roomId].push(tab);
        }
        socket.in(roomId).emit(ACTIONS.TAB_OPEN, { tab, username });
    });

    socket.on(ACTIONS.TAB_CLOSE, ({ roomId, tabId, username }) => {
        if (roomTabsMap[roomId]) {
            roomTabsMap[roomId] = roomTabsMap[roomId].filter((t) => t.id !== tabId);
        }
        if (roomCanvasMap[roomId] && roomCanvasMap[roomId][tabId]) {
            delete roomCanvasMap[roomId][tabId];
        }
        socket.in(roomId).emit(ACTIONS.TAB_CLOSE, { tabId, username });
    });

    // Real-time canvas drawing events with canvasId isolation
    socket.on(ACTIONS.CANVAS_DRAW, ({ roomId, canvasId = 'default', stroke }) => {
        if (!roomCanvasMap[roomId]) {
            roomCanvasMap[roomId] = {};
        }
        if (!roomCanvasMap[roomId][canvasId]) {
            roomCanvasMap[roomId][canvasId] = [];
        }
        if (roomCanvasMap[roomId][canvasId].length >= 5000) {
            roomCanvasMap[roomId][canvasId] = roomCanvasMap[roomId][canvasId].slice(-4000);
        }
        roomCanvasMap[roomId][canvasId].push(stroke);
        socket.in(roomId).emit(ACTIONS.CANVAS_DRAW, { canvasId, stroke });
    });

    socket.on(ACTIONS.CANVAS_CLEAR, ({ roomId, canvasId = 'default' }) => {
        if (roomCanvasMap[roomId] && roomCanvasMap[roomId][canvasId]) {
            roomCanvasMap[roomId][canvasId] = [];
        }
        socket.in(roomId).emit(ACTIONS.CANVAS_CLEAR, { canvasId });
    });

    socket.on('disconnecting', () => {
        const rooms = [...socket.rooms];
        rooms.forEach((roomId) => {
            socket.in(roomId).emit(ACTIONS.DISCONNECTED, {
                socketId: socket.id,
                username: userSocketMap[socket.id],
            });
        });

        delete userSocketMap[socket.id];
        socket.leave();
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Listening on port ${PORT}`));