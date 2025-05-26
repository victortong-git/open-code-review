import { store } from '../store/store';
import { updateAnalysisProgress, setAnalysisStatus, addFinding } from '../features/analysisSlice';

class WebSocketService {
  private socket: WebSocket | null = null;
  private reconnectInterval = 5000; // 5 seconds
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private jobSubscriptions = new Set<string>();
  
  constructor() {
    this.connect();
  }
  
  private connect(): void {
    // Create WebSocket connection
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname;
    const port = window.location.port;
    
    // Try to connect to the websocket server
    try {
      this.socket = new WebSocket(`${protocol}//${host}:${port}/api/ws`);
      
      this.socket.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        
        // Re-subscribe to any previously subscribed jobs
        this.jobSubscriptions.forEach(jobId => {
          this.subscribeToJob(jobId);
        });
      };
      
      this.socket.onclose = () => {
        console.log('WebSocket disconnected');
        
        // Try to reconnect if not max attempts reached
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
          setTimeout(() => this.connect(), this.reconnectInterval);
        } else {
          console.error('Max reconnect attempts reached. Please refresh the page.');
        }
      };
      
      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      
      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
    }
  }
  
  // Handle incoming messages
  private handleMessage(message: any): void {
    console.log('WebSocket message received:', message);
    
    switch (message.type) {
      case 'analysis_progress':
        store.dispatch(updateAnalysisProgress({
          fileId: message.fileId,
          progress: message.progress,
          currentReview: message.currentReview,
          reviewStatus: message.reviewStatus,
          currentIndex: message.currentIndex,
          totalReviews: message.totalReviews
        }));
        // Log detailed info for debugging
        console.log(`Progress update: ${message.currentReview} - Status: ${message.reviewStatus || 'n/a'}`);
        break;
        
      case 'analysis_complete':
        store.dispatch(setAnalysisStatus({
          fileId: message.fileId,
          status: 'completed',
          progress: 100
        }));
        break;
        
      case 'analysis_error':
        store.dispatch(setAnalysisStatus({
          fileId: message.fileId,
          status: 'failed',
          progress: 0
        }));
        break;
        
      case 'new_finding':
        if (message.finding) {
          store.dispatch(addFinding(message.finding));
        }
        break;
      
      default:
        break;
    }
  }
  
  // Subscribe to a job
  public subscribeToJob(jobId: string): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      // Save for later when connection is established
      this.jobSubscriptions.add(jobId);
      return;
    }
    
    // Send subscription message
    this.socket.send(JSON.stringify({
      type: 'subscribe',
      jobId
    }));
    
    // Save subscription
    this.jobSubscriptions.add(jobId);
  }
  
  // Unsubscribe from a job
  public unsubscribeFromJob(jobId: string): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({
        type: 'unsubscribe',
        jobId
      }));
    }
    
    // Remove subscription
    this.jobSubscriptions.delete(jobId);
  }
  
  // Close connection
  public close(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}

// Create singleton instance
const websocketService = new WebSocketService();
export default websocketService;
