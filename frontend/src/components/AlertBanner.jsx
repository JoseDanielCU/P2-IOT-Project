import { useCallback, useEffect, useRef, useState } from 'react';

export default function AlertBanner() {
    const [queue, setQueue] = useState([]);
    const [visible, setVisible] = useState(false);
    const wsRef = useRef(null);
    const reconnectRef = useRef(null);
    const lastSeenRef = useRef({});

    const enqueueAlert = useCallback(data => {
        const now = Date.now();
        const lastTime = lastSeenRef.current[data.alert_type] || 0;
        if (now - lastTime < 5000) return;
        lastSeenRef.current[data.alert_type] = now;
        setQueue(prev => [...prev, data]);
        setVisible(true);
    }, []);

    useEffect(() => {
        let mounted = true;

        const getUrl = () =>
            process.env.NEXT_PUBLIC_WS_ALERTS_URL ||
            (window.location.hostname === 'localhost' ||
            window.location.hostname === '127.0.0.1'
                ? 'ws://localhost:8000/ws/alerts'
                : (window.location.protocol === 'https:' ? 'wss://' : 'ws://') +
                  window.location.host.replace(/:3000$/, ':8000') +
                  '/ws/alerts');

        const connect = () => {
            if (!mounted) return;
            const url = getUrl();
            const ws = new window.WebSocket(url);

            ws.onopen = () => {};

            ws.onmessage = event => {
                try {
                    const data = JSON.parse(event.data);
                    enqueueAlert(data);
                } catch (e) {
                    console.error('[AlertBanner] Error parseando mensaje WS:', e);
                }
            };

            ws.onclose = () => {
                wsRef.current = null;
                if (mounted) {
                    reconnectRef.current = setTimeout(connect, 3000);
                }
            };

            ws.onerror = () => {
                ws.close();
            };

            wsRef.current = ws;
        };

        connect();

        return () => {
            mounted = false;
            if (reconnectRef.current) clearTimeout(reconnectRef.current);
            if (wsRef.current) wsRef.current.close();
        };
    }, [enqueueAlert]);

    const handleClose = () => {
        setQueue(prev => {
            const [, ...rest] = prev;
            if (rest.length === 0) setVisible(false);
            return rest;
        });
    };

    if (!queue.length || !visible) return null;
    const alert = queue[0];

    return (
        <div className="fixed top-0 left-0 w-full z-50 flex justify-center">
            <div className="bg-red-500 text-white px-6 py-3 rounded-b-lg shadow-lg flex items-center gap-4 animate-slide-down">
                <span className="font-semibold">Alerta:</span>
                <span>{alert.message}</span>
                <button
                    className="ml-4 text-white hover:text-red-200 text-lg font-bold"
                    onClick={handleClose}
                    aria-label="Cerrar alerta"
                >
                    ×
                </button>
            </div>
            <style jsx>{`
                .animate-slide-down {
                    animation: slideDown 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                }
                @keyframes slideDown {
                    from {
                        transform: translateY(-100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }
            `}</style>
        </div>
    );
}
