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

const Editor = ({ socketRef, roomId, language = 'javascript', initialCode = '', onCodeChange, onRunCode }) => {
    const editorRef = useRef(null);
    const textareaRef = useRef(null);
    const runCodeRef = useRef(onRunCode);
    const { isDark } = useTheme();

    useEffect(() => {
        runCodeRef.current = onRunCode;
    }, [onRunCode]);

    useEffect(() => {
        if (!textareaRef.current) return;

        const currentMode = LANGUAGE_MODES[language] || 'javascript';
        editorRef.current = Codemirror.fromTextArea(textareaRef.current, {
            mode: currentMode,
            theme: isDark ? 'dracula' : 'default',
            autoCloseTags: true,
            autoCloseBrackets: true,
            lineNumbers: true,
            lineWrapping: false,
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
                socketRef.current?.emit(ACTIONS.CODE_CHANGE, {
                    roomId,
                    code,
                });
            }
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

    // Dynamically update syntax highlighting mode when language prop changes
    useEffect(() => {
        if (editorRef.current && language) {
            const mode = LANGUAGE_MODES[language] || 'javascript';
            editorRef.current.setOption('mode', mode);
        }
    }, [language]);

    useEffect(() => {
        const socket = socketRef.current;
        if (socket) {
            socket.on(ACTIONS.CODE_CHANGE, ({ code }) => {
                if (code !== null && editorRef.current && editorRef.current.getValue() !== code) {
                    editorRef.current.setValue(code);
                }
            });
        }

        return () => {
            socket?.off(ACTIONS.CODE_CHANGE);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [socketRef.current]);

    return (
        <div className="w-full h-full relative">
            <textarea ref={textareaRef} id="realtimeEditor" className="hidden"></textarea>
        </div>
    );
};

export default Editor;