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
   * Send a request directly to the AIQ toolkit for AI code analysis
   * @param fileId The file ID to analyze
   * @param reviewType The type of review to perform
   * @returns The response from the AI service
   */
  async callAICodeAnalysis(fileId: number, reviewType: string): Promise<any> {
    try {
      const aiqToolkitUrl = 'http://aiqtoolkit:8000/generate';
      console.log(`Calling AIQ Toolkit directly at ${aiqToolkitUrl} for file ID: ${fileId}, review type: ${reviewType}`);

      const response = await axios.post(aiqToolkitUrl, {
        input_message: JSON.stringify({
          file_id: fileId.toString(),
          review_type: reviewType
        })
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 300000 // 5 minutes timeout
      });

      console.log('AIQ Toolkit response:', response.data);
      
      // Parse the response if it's a string
      if (typeof response.data === 'string') {
        try {
          return JSON.parse(response.data);
        } catch (parseError) {
          return { error: 'Failed to parse response', raw_response: response.data };
        }
      }
      
      return response.data;
    } catch (error: any) {
      console.error('Error calling AIQ Toolkit:', error.message);
      if (error.response) {
        console.error('AIQ Toolkit Error:', error.response.status, error.response.data);
        throw new Error(`AIQ Toolkit request failed with status ${error.response.status}: ${JSON.stringify(error.response.data)}`);
      } else if (error.request) {
        console.error('No response received from AIQ Toolkit');
        throw new Error('No response received from AIQ Toolkit');
      } else {
        throw new Error(`Error setting up AIQ Toolkit request: ${error.message}`);
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
      
      return await this.callAICodeAnalysis(fileId, reviewType);
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
   * Performs a selective code review with user-specified review types
   * @param fileId Database ID of the file
   * @param selectedReviewTypes Array of review types to perform
   * @param onProgress Callback function for progress updates
   * @returns Results of the selective review
   */
  async performSelectiveReview(fileId: number, selectedReviewTypes: string[], onProgress?: (progress: number, currentReview: string) => void): Promise<any> {
    // Validate review types
    const validReviewTypes = [
      'general_review',
      'owasp_2021_a01', 'owasp_2021_a02', 'owasp_2021_a03', 'owasp_2021_a04', 'owasp_2021_a05',
      'owasp_2021_a06', 'owasp_2021_a07', 'owasp_2021_a08', 'owasp_2021_a09', 'owasp_2021_a10'
    ];
    
    const invalidTypes = selectedReviewTypes.filter(type => !validReviewTypes.includes(type));
    if (invalidTypes.length > 0) {
      throw new Error(`Invalid review types: ${invalidTypes.join(', ')}`);
    }
    
    const totalReviews = selectedReviewTypes.length;
    const results: any[] = [];
    
    for (let i = 0; i < selectedReviewTypes.length; i++) {
      const reviewType = selectedReviewTypes[i];
      try {
        console.log(`Starting selective review for: ${reviewType}`);
        const result = await this.performCodeReview(fileId, reviewType);
        console.log(`Completed selective review for ${reviewType}. Result:`, result);
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
    
    // Use the selective review method with all review types
    return this.performSelectiveReview(fileId, reviewTypes, onProgress);
  }
}

// Create a singleton instance
const aiqClient = new AIQClient();
export default aiqClient;
