import React, { useEffect, useRef } from "react";
import Codemirror from 'codemirror';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/dracula.css';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/mode/python/python';
import 'codemirror/mode/clike/clike';
import 'codemirror/mode/rust/rust';
import 'codemirror/mode/go/go';
import 'codemirror/addon/edit/closetag';
import 'codemirror/addon/edit/closebrackets';
import ACTIONS from "../Actions";
import { useTheme } from "../context/ThemeContext";

const LANGUAGE_MODES = {
    javascript: { name: 'javascript', json: true },
    python: { name: 'python' },
    cpp: 'text/x-c++src',
    c: 'text/x-csrc',
    java: 'text/x-java',
    rust: 'rust',
    go: 'go',
};

const PEER_COLORS = [
    '#FF5722', '#4CAF50', '#2196F3', '#E91E63',
    '#9C27B0', '#00BCD4', '#FF9800', '#009688',
    '#3F51B5', '#E040FB', '#00E676', '#FFD600',
];

const getPeerColor = (identifier = '') => {
    let hash = 0;
    for (let i = 0; i < identifier.length; i++) {
        hash = identifier.charCodeAt(i) + ((hash << 5) - hash);
    }
    const idx = Math.abs(hash) % PEER_COLORS.length;
    return PEER_COLORS[idx];
};

const Editor = ({ socket, socketRef, roomId, username, language = 'javascript', initialCode = '', onCodeChange, onRunCode, isVisible = true }) => {
    const editorRef = useRef(null);
    const textareaRef = useRef(null);
    const runCodeRef = useRef(onRunCode);
    const usernameRef = useRef(username);
    const cursorThrottleRef = useRef(null);
    const markersRef = useRef({});
    const { isDark } = useTheme();

    useEffect(() => {
        runCodeRef.current = onRunCode;
    }, [onRunCode]);

    useEffect(() => {
        usernameRef.current = username;
    }, [username]);

    useEffect(() => {
        if (!textareaRef.current) return;

        const currentMode = LANGUAGE_MODES[language] || 'javascript';
        const isMobileDevice = typeof navigator !== 'undefined' && /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
        editorRef.current = Codemirror.fromTextArea(textareaRef.current, {
            mode: currentMode,
            theme: isDark ? 'dracula' : 'default',
            autoCloseTags: true,
            autoCloseBrackets: true,
            lineNumbers: true,
            lineWrapping: true,
            inputStyle: isMobileDevice ? 'contenteditable' : 'textarea',
            styleActiveLine: true,
            extraKeys: {
                'Ctrl-Enter': () => {
                    if (runCodeRef.current) runCodeRef.current();
                },
                'Cmd-Enter': () => {
                    if (runCodeRef.current) runCodeRef.current();
                },
            },
        });

        if (initialCode && !editorRef.current.getValue()) {
            editorRef.current.setValue(initialCode);
            onCodeChange(initialCode);
        }

        editorRef.current.on('change', (instance, changes) => {
            const { origin } = changes;
            const code = instance.getValue();
            onCodeChange(code);
            if (origin !== 'setValue') {
                const activeSocket = socket || socketRef?.current;
                activeSocket?.emit(ACTIONS.CODE_CHANGE, {
                    roomId,
                    code,
                });
            }
        });

        // Broadcast cursor position when cursor moves or user types
        editorRef.current.on('cursorActivity', (instance) => {
            const cursor = instance.getCursor();
            if (cursorThrottleRef.current === null) {
                cursorThrottleRef.current = setTimeout(() => {
                    cursorThrottleRef.current = null;
                    const activeSocket = socketRef?.current || socket;
                    if (!activeSocket) return;
                    activeSocket.emit(ACTIONS.CURSOR_MOVE, {
                        roomId,
                        position: { line: cursor.line, ch: cursor.ch },
                        username: usernameRef.current,
                    });
                }, 40);
            }
        });

        editorRef.current.on('focus', (instance) => {
            const cursor = instance.getCursor();
            const activeSocket = socketRef?.current || socket;
            activeSocket?.emit(ACTIONS.CURSOR_MOVE, {
                roomId,
                position: { line: cursor.line, ch: cursor.ch },
                username: usernameRef.current,
            });
        });

        return () => {
            if (editorRef.current) {
                editorRef.current.toTextArea();
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Dynamically update theme
    useEffect(() => {
        if (editorRef.current) {
            editorRef.current.setOption('theme', isDark ? 'dracula' : 'default');
            editorRef.current.refresh();
        }
    }, [isDark]);

    // Refresh layout when Code tab becomes visible again
    useEffect(() => {
        if (isVisible && editorRef.current) {
            setTimeout(() => {
                if (editorRef.current) editorRef.current.refresh();
            }, 30);
        }
    }, [isVisible]);

    // Dynamically update syntax highlighting mode when language prop changes
    useEffect(() => {
        if (editorRef.current && language) {
            const mode = LANGUAGE_MODES[language] || 'javascript';
            editorRef.current.setOption('mode', mode);
        }
    }, [language]);

    // Listen for code changes from other room members
    useEffect(() => {
        const activeSocket = socket || socketRef?.current;
        if (!activeSocket) return;

        const handleCodeChange = ({ code }) => {
            if (code !== null && editorRef.current && editorRef.current.getValue() !== code) {
                editorRef.current.setValue(code);
            }
        };

        activeSocket.on(ACTIONS.CODE_CHANGE, handleCodeChange);

        return () => {
            activeSocket.off(ACTIONS.CODE_CHANGE, handleCodeChange);
        };
    }, [socket, socketRef]);

    // Listen for remote cursor movements from other room members
    useEffect(() => {
        const activeSocket = socket || socketRef?.current;
        if (!activeSocket) return;

        const handleRemoteCursor = ({ socketId, position, username: peerName }) => {
            if (!editorRef.current || !position) return;
            const myId = activeSocket?.id || socketRef?.current?.id;
            if (socketId === myId) return;

            // Remove existing marker for this peer
            if (markersRef.current[socketId]) {
                markersRef.current[socketId].clear();
                delete markersRef.current[socketId];
            }

            const color = getPeerColor(peerName || socketId);

            // Create caret container
            const cursorEl = document.createElement('span');
            cursorEl.className = 'cm-remote-cursor';
            cursorEl.style.borderLeft = `2px solid ${color}`;
            cursorEl.style.height = '1.2em';
            cursorEl.style.marginLeft = '-1px';
            cursorEl.style.marginRight = '-1px';
            cursorEl.style.display = 'inline-block';
            cursorEl.style.position = 'relative';
            cursorEl.style.pointerEvents = 'none';

            // Create floating name tag
            const tagEl = document.createElement('span');
            tagEl.className = 'cm-remote-cursor-tag';
            tagEl.innerText = peerName || 'Peer';
            tagEl.style.backgroundColor = color;
            tagEl.style.color = '#fff';
            tagEl.style.fontSize = '10px';
            tagEl.style.fontWeight = 'bold';
            tagEl.style.padding = '1px 5px';
            tagEl.style.borderRadius = '4px';
            tagEl.style.position = 'absolute';
            tagEl.style.top = position.line === 0 ? '1.25em' : '-1.4em';
            tagEl.style.left = '0';
            tagEl.style.whiteSpace = 'nowrap';
            tagEl.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
            tagEl.style.zIndex = '10';
            tagEl.style.pointerEvents = 'none';

            cursorEl.appendChild(tagEl);

            const lineCount = editorRef.current.lineCount();
            const line = Math.max(0, Math.min(position.line, lineCount - 1));
            const lineLen = editorRef.current.getLine(line)?.length || 0;
            const ch = Math.max(0, Math.min(position.ch, lineLen));

            markersRef.current[socketId] = editorRef.current.setBookmark(
                { line, ch },
                { widget: cursorEl, insertLeft: true }
            );
        };

        const handlePeerDisconnect = ({ socketId }) => {
            if (markersRef.current[socketId]) {
                markersRef.current[socketId].clear();
                delete markersRef.current[socketId];
            }
        };

        activeSocket.on(ACTIONS.CURSOR_MOVE, handleRemoteCursor);
        activeSocket.on(ACTIONS.DISCONNECTED, handlePeerDisconnect);

        return () => {
            activeSocket.off(ACTIONS.CURSOR_MOVE, handleRemoteCursor);
            activeSocket.off(ACTIONS.DISCONNECTED, handlePeerDisconnect);
            Object.values(markersRef.current).forEach((marker) => marker.clear());
            markersRef.current = {};
        };
    }, [socket, socketRef]);

    return (
        <div className="w-full h-full relative">
            <textarea ref={textareaRef} id="realtimeEditor" className="hidden"></textarea>
        </div>
    );
};

export default Editor;