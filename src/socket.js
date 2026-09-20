import { io } from "socket.io-client";

export const initSocket = () => {
    let backendUrl = process.env.REACT_APP_BACKEND_URL;
    if (backendUrl) {
        backendUrl = backendUrl.replace(/\/+$/, '');
    } else if (typeof window !== 'undefined') {
        if (window.location.port === '3000') {
            backendUrl = `${window.location.protocol}//${window.location.hostname}:5000`;
        } else {
            backendUrl = window.location.origin;
        }
    }

    const options = {
        forceNew: true,
        reconnectionAttempts: Infinity,
        timeout: 10000,
        transports: ['websocket', 'polling'],
    };

    return io(backendUrl || 'http://localhost:5000', options);
};