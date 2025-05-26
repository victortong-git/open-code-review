import axios, { AxiosInstance } from 'axios';
import WebSocket from 'ws';
import { EventEmitter } from 'events';
import config from '../config/config';

/**
 * Client for interacting with the AIQ Toolkit API
 */
export class AIQClient {
  private baseUrl: string;
  private apiClient: AxiosInstance;
  private wsClients: Map<string, WebSocket>;
  private eventEmitter: EventEmitter;
  private aiCodeAnalysisUrl: string;
  
  constructor() {
    this.baseUrl = config.aiqToolkit.baseUrl;
    this.apiClient = axios.create({
      baseURL: this.baseUrl,
      timeout: 1800000, // 30 minutes timeout
    });
    this.wsClients = new Map<string, WebSocket>();
    this.eventEmitter = new EventEmitter();
    this.aiCodeAnalysisUrl = 'http://aiqtoolkit:8000/generate'; // Direct service-to-service communication (no CORS issue)
  }

  /**
   * Analyze a file for security vulnerabilities
   * @param fileContent File content as string
   * @param fileName Name of the file
   * @param fileId Database ID of the file
   * @returns Job ID for tracking analysis progress
   */
  async analyzeFile(fileContent: string, fileName: string, fileId: number): Promise<string> {
    try {
      const response = await this.apiClient.post('/api/analyze', {
        file: {
          content: fileContent,
          name: fileName,
          id: fileId.toString()
        }
      });
      
      return response.data.jobId;
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error analyzing file:', error.message);
        throw new Error(`Failed to analyze file: ${error.message}`);
      } else {
        console.error('Unknown error analyzing file:', error);
        throw new Error('Failed to analyze file due to an unknown error');
      }
    }
  }
  
  /**
   * Perform comprehensive AI Assessment on a file (OWASP and more)
   * @param fileContent File content as string
   * @param fileName Name of the file
   * @param fileId Database ID of the file
   * @returns Job ID for tracking assessment progress
   */
  async assessFile(fileContent: string, fileName: string, fileId: number): Promise<string> {
    try {
      // First check if the server is running
      try {
        await this.apiClient.get('/api/health');
      } catch (error) {
        console.error('AIQ Toolkit server is not available. Make sure it is running:', error);
        throw new Error('AIQ Toolkit server is not available. Please check if the service is running.');
      }

      console.log(`Sending assessment request for file: ${fileName}, ID: ${fileId}`);
      
      // Try with the /api/analyze endpoint as a fallback if /api/assess doesn't exist
      try {
        const response = await this.apiClient.post('/api/assess', {
          file: {
            content: fileContent,
            name: fileName,
            id: fileId.toString()
          },
          assessment_type: 'comprehensive',
          include_owasp: true,
          generate_report: true
        });
        
        console.log('Assessment response:', response.data);
        return response.data.jobId;
      } catch (assessError) {
        console.error('Error using /api/assess endpoint:', assessError);
        
        // Fallback to using the analyze endpoint
        const response = await this.apiClient.post('/api/analyze', {
          file: {
            content: fileContent,
            name: fileName,
            id: fileId.toString()
          },
          options: {
            assessment_type: 'comprehensive',
            include_owasp: true,
            generate_report: true
          }
        });
        
        console.log('Analysis (fallback) response:', response.data);
        return response.data.jobId;
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error performing AI Assessment:', error.message);
        throw new Error(`Failed to perform AI Assessment: ${error.message}`);
      } else {
        console.error('Unknown error performing AI Assessment:', error);
        throw new Error('Failed to perform AI Assessment due to an unknown error');
      }
    }
  }
  
  /**
   * Subscribe to real-time updates for a job
   * @param jobId Job ID to subscribe to
   * @param onProgress Callback for progress updates
   * @param onFinding Callback for new findings
   * @param onComplete Callback for job completion
   * @param onError Callback for errors
   */
  subscribeToJob(
    jobId: string, 
    onProgress: (data: any) => void,
    onFinding: (data: any) => void,
    onComplete: (data: any) => void,
    onError: (error: Error) => void
  ): void {
    try {
      // Close existing connection if any
      this.closeWebSocket(jobId);
      
      // Open new connection
      const wsUrl = `${this.baseUrl.replace('http', 'ws')}/api/jobs/${jobId}/stream`;
      const ws = new WebSocket(wsUrl);
      
      ws.on('open', () => {
        console.log(`WebSocket connected for job ${jobId}`);
      });
      
      ws.on('message', (data) => {
        try {
          const parsedData = JSON.parse(data.toString());
          
          switch (parsedData.type) {
            case 'analysis_progress':
              onProgress(parsedData);
              this.eventEmitter.emit('analysis_progress', { jobId, ...parsedData });
              break;
            case 'new_finding':
              onFinding(parsedData);
              this.eventEmitter.emit('new_finding', { jobId, ...parsedData });
              break;
            case 'analysis_complete':
              onComplete(parsedData);
              this.eventEmitter.emit('analysis_complete', { jobId, ...parsedData });
              break;
            default:
              console.log(`Unknown message type: ${parsedData.type}`);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
          if (error instanceof Error) {
            onError(new Error(`Failed to parse WebSocket message: ${error.message}`));
          } else {
            onError(new Error('Failed to parse WebSocket message due to an unknown error'));
          }
        }
      });
      
      ws.on('error', (error) => {
        if (error instanceof Error) {
          console.error(`WebSocket error for job ${jobId}:`, error.message);
          onError(error);
        } else {
          console.error(`Unknown WebSocket error for job ${jobId}:`, error);
          onError(new Error('WebSocket error due to an unknown error'));
        }
      });
      
      ws.on('close', () => {
        console.log(`WebSocket closed for job ${jobId}`);
      });
      
      // Store the WebSocket connection
      this.wsClients.set(jobId, ws);
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error subscribing to job:', error.message);
        onError(new Error(`Failed to subscribe to job: ${error.message}`));
      } else {
        console.error('Unknown error subscribing to job:', error);
        onError(new Error('Failed to subscribe to job due to an unknown error'));
      }
    }
  }
  
  /**
   * Close a WebSocket connection for a specific job
   * @param jobId Job ID
   */
  closeWebSocket(jobId: string): void {
    const ws = this.wsClients.get(jobId);
    if (ws) {
      ws.close();
      this.wsClients.delete(jobId);
    }
  }
  
  /**
   * Get analysis results for a job
   * @param jobId Job ID
   * @returns Analysis results
   */
  async getResults(jobId: string): Promise<any> {
    try {
      const response = await this.apiClient.get(`/api/results/${jobId}`);
      return response.data;
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error analyzing file:', error.message);
        throw new Error(`Failed to analyze file: ${error.message}`);
      } else {
        console.error('Unknown error analyzing file:', error);
        throw new Error('Failed to analyze file due to an unknown error');
      }
    }
  }
  
  /**
   * Get job status
   * @param jobId Job ID
   * @returns Job status
   */
  async getJobStatus(jobId: string): Promise<any> {
    try {
      const response = await this.apiClient.get(`/api/jobs/${jobId}`);
      return response.data;
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error getting job status:', error.message);
        throw new Error(`Failed to get job status: ${error.message}`);
      } else {
        console.error('Unknown error getting job status:', error);
        throw new Error('Failed to get job status due to an unknown error');
      }
    }
  }
  
  /**
   * Subscribe to events from the AIQ client
   * @param event Event name
   * @param listener Event listener
   */
  on(event: string, listener: (...args: any[]) => void): void {
    this.eventEmitter.on(event, listener);
  }
  
  /**
   * Unsubscribe from events
   * @param event Event name
   * @param listener Event listener
   */
  off(event: string, listener: (...args: any[]) => void): void {
    this.eventEmitter.off(event, listener);
  }
  
  /**
   * Send a request to the AI code analysis service for code review
   * @param input_message The message to send to the AI service (e.g., "Review source code file id 123")
   * @returns The response from the AI service
   */
  async callAICodeAnalysis(input_message: string): Promise<any> {
    try {
      console.log(`Calling AI code analysis service at ${this.aiCodeAnalysisUrl} with message: ${input_message}`);
      
      const response = await axios.post(this.aiCodeAnalysisUrl, {
        input_message
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 1800000 // 30 minutes timeout for potentially longer AI processing
      });
      
      console.log('AI code analysis response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error calling AI code analysis:', error.message);
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('AI API Error:', error.response.status, error.response.data);
        throw new Error(`AI code analysis failed with status ${error.response.status}: ${JSON.stringify(error.response.data)}`);
      } else if (error.request) {
        // The request was made but no response was received
        console.error('No response received from AI service');
        throw new Error('No response received from AI code analysis service');
      } else {
        // Something happened in setting up the request
        throw new Error(`Error setting up AI code analysis request: ${error.message}`);
      }
    }
  }
  
  /**
   * Performs a code review with a specific review type
   * @param fileId Database ID of the file
   * @param reviewType Type of review (general_review, owasp_2021_a01, etc.)
   * @returns The response from the AI service
   */
  async performCodeReview(fileId: number, reviewType: string): Promise<any> {
    try {
      console.log(`Performing ${reviewType} code review for file ID: ${fileId}`);
      
      const message = `file_id: ${fileId}, review_type: ${reviewType}`;
      return await this.callAICodeAnalysis(message);
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Error performing ${reviewType} code review:`, error.message);
        throw new Error(`Failed to perform ${reviewType} code review: ${error.message}`);
      } else {
        console.error(`Unknown error performing ${reviewType} code review:`, error);
        throw new Error(`Failed to perform ${reviewType} code review due to an unknown error`);
      }
    }
  }
  
  /**
   * Performs a comprehensive code review including general review and all OWASP 2021 categories
   * @param fileId Database ID of the file
   * @param onProgress Callback function for progress updates
   * @returns Results of the comprehensive review
   */
  async performComprehensiveReview(fileId: number, onProgress?: (progress: number, currentReview: string) => void): Promise<any> {
    const reviewTypes = [
      'general_review',
      'owasp_2021_a01',
      'owasp_2021_a02',
      'owasp_2021_a03',
      'owasp_2021_a04',
      'owasp_2021_a05',
      'owasp_2021_a06',
      'owasp_2021_a07',
      'owasp_2021_a08',
      'owasp_2021_a09',
      'owasp_2021_a10'
    ];
    
    const totalReviews = reviewTypes.length;
    const results: any[] = [];
    
    for (let i = 0; i < reviewTypes.length; i++) {
      const reviewType = reviewTypes[i];
      try {
        const result = await this.performCodeReview(fileId, reviewType);
        results.push({ 
          type: reviewType, 
          status: 'completed',
          result 
        });
        
        // Calculate progress percentage and call the callback if provided
        const progress = Math.floor(((i + 1) / totalReviews) * 100);
        if (onProgress) {
          onProgress(progress, reviewType);
        }
        
        // Emit an event for progress
        this.eventEmitter.emit('review_progress', { 
          fileId, 
          reviewType,
          progress,
          currentIndex: i + 1,
          totalReviews,
          // Add status specifically for this review type
          reviewStatus: 'completed'
        });
        
      } catch (error) {
        results.push({ 
          type: reviewType, 
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        
        // Still update progress even on failure
        const progress = Math.floor(((i + 1) / totalReviews) * 100);
        if (onProgress) {
          onProgress(progress, reviewType);
        }
        
        // Emit an error event
        this.eventEmitter.emit('review_error', { 
          fileId, 
          reviewType,
          progress,
          currentIndex: i + 1,
          totalReviews,
          reviewStatus: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    // Emit completion event
    this.eventEmitter.emit('review_complete', { 
      fileId, 
      results
    });
    
    return {
      fileId,
      totalReviews,
      completedReviews: results.filter(r => r.status === 'completed').length,
      failedReviews: results.filter(r => r.status === 'failed').length,
      results
    };
  }
}

// Create a singleton instance
const aiqClient = new AIQClient();
export default aiqClient;
