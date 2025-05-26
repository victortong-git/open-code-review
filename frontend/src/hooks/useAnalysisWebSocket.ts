import { useEffect, useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { addFinding, updateAnalysisStatus } from '../features/analysisSlice.js';
import showToast from '../components/Toast';

interface UseAnalysisWebSocketProps {
  fileId: number;
  jobId: string;
}

interface UseAnalysisWebSocketReturn {
  connected: boolean;
  progress: number;
}

/**
 * Custom hook for WebSocket connection to analysis server
 */
export const useAnalysisWebSocket = ({ fileId, jobId }: UseAnalysisWebSocketProps): UseAnalysisWebSocketReturn => {
  const [connected, setConnected] = useState(false);
  const [progress, setProgress] = useState(0);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const dispatch = useDispatch();

  const handleToastClose = useCallback(() => {
    // Dummy onClose function
  }, []);

  const connect = useCallback(() => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8001';
    const wsUrl = apiUrl.replace(/^http/, 'ws') + '/ws';

    console.log(`Connecting to WebSocket: ${wsUrl}`);
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      setConnected(true);
      console.log('WebSocket connected');

      // Send job subscription message
      ws.send(JSON.stringify({
        type: 'subscribe',
        jobId
      }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('WebSocket message received:', data);

        switch (data.type) {
          case 'analysis_progress':
            if (data.jobId === jobId) {
              setProgress(data.progress);
              dispatch(updateAnalysisStatus({
                fileId,
                status: data.status,
                progress: data.progress
              }));
            }
            break;

          case 'new_finding':
            if (data.jobId === jobId) {
              dispatch(addFinding(data));

              // Show notification for high/critical findings
              if (data.severity === 'high' || data.severity === 'critical') {
                showToast({
                  id: 'critical-finding',
                  type: 'warning',
                  message: `Critical issue found: ${data.description.substring(0, 100)}...`,
                  duration: 6000,
                  onClose: handleToastClose
                });
              }
            }
            break;

          case 'analysis_complete':
            if (data.jobId === jobId) {
              setProgress(100);
              dispatch(updateAnalysisStatus({
                fileId,
                status: 'completed',
                progress: 100
              }));

              showToast({
                id: 'analysis-complete',
                type: 'success',
                message: `Analysis complete. Found ${data.findingCount} issues.`,
                duration: 5000,
                onClose: handleToastClose
              });
            }
            break;

          case 'connection_established':
            console.log('Connection established:', data.message);
            break;

          default:
            console.log(`Unknown message type: ${data.type}`);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onclose = (event) => {
      setConnected(false);
      console.log(`WebSocket disconnected. Code: ${event.code}, Reason: ${event.reason}`);

      // Auto-reconnect after a delay, but only if not intentionally closed
      if (event.code !== 1000) {
        setTimeout(() => {
          console.log('Attempting to reconnect...');
          connect();
        }, 3000);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      showToast({
        id: 'connection-error',
        type: 'error',
        message: 'Connection error. Attempting to reconnect...',
        duration: 3000,
        onClose: handleToastClose
      });
    };

    setSocket(ws);

    // Cleanup function
    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close(1000, 'Component unmounted');
      }
    };
  }, [jobId, fileId, dispatch, handleToastClose]);

  useEffect(() => {
    const cleanup = connect();

    return () => {
      cleanup();
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close(1000, 'Component unmounted');
      }
    };
  }, [connect, socket]);

  // Handle unmounting properly
  useEffect(() => {
    return () => {
      if (socket) {
        socket.close(1000, 'Component unmounted');
      }
    };
  }, [socket]);

  return { connected, progress };
};
