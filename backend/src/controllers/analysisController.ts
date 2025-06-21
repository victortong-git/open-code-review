import { Request, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';
import aiqClient from '../services/aiqClient';
import { File } from '../models/file';
import { CodeSnippet } from '../models/codeSnippet';
import { Finding } from '../models/finding';
const dbConfig = require('../config/database');
import { Sequelize } from 'sequelize';
const db = new Sequelize(dbConfig.development.database, dbConfig.development.username, dbConfig.development.password, {
  host: dbConfig.development.host,
  dialect: dbConfig.development.dialect,
  port: dbConfig.development.port
});
import WebSocket from 'ws';
import { v4 as uuidv4 } from 'uuid';

// Store active analysis jobs
const activeJobs = new Map<string, {
  fileId: number,
  status: string,
  progress: number,
  findings: any[],
  startTime: Date,
  endTime?: Date,
  currentReview?: string,
  reviewStatus?: string,
  currentIndex?: number,
  totalReviews?: number
}>();

/**
 * Save findings from a comprehensive review to the database
 * @param jobId The job ID
 * @param results The results from all reviews
 * @param fileId The file ID
 */
async function saveComprehensiveReviewFindings(jobId: string, results: any[], fileId: number): Promise<void> {
  try {
    // Start a transaction
    const transaction = await db.transaction();
    
    try {
      // Get the file
      const file = await File.findByPk(fileId);
      if (!file) {
        console.error(`File with ID ${fileId} not found when saving findings`);
        await transaction.rollback();
        return;
      }
      
      // Process findings from all review types
      for (const review of results) {
        if (review.status === 'completed' && review.result.findings) {
          for (const finding of review.result.findings) {
            // Create the finding in the database
            const newFinding = await Finding.create({
              file_id: fileId,
              type: review.type.startsWith('owasp') ? review.type : 'general',
              description: finding.description || `Finding from ${review.type}: ${finding.title || 'No title provided'}`,
              severity: finding.severity || 'medium',
              status: 'open',
              line_number: finding.line_start || 0,
              recommendation: finding.recommendation || '',
              code_content: finding.code || '',
              createdAt: new Date(),
              updatedAt: new Date()
            }, { transaction });
            
            // Create code snippet if available
            if (finding.code) {
              await CodeSnippet.create({
                file_id: fileId,
                code: finding.code || '',
                start_line: finding.line_start || 0,
                end_line: finding.line_end || 0,
                description: `Associated with finding ID: ${newFinding.id}`,
                createdAt: new Date(),
                updatedAt: new Date()
              }, { transaction });
            }
          }
        }
      }
      
      // Commit the transaction
      await transaction.commit();
      
    } catch (error) {
      // Rollback the transaction on error
      await transaction.rollback();
      console.error('Error saving comprehensive review findings:', error);
      throw error;
    }
    
  } catch (error) {
    console.error('Error in saveComprehensiveReviewFindings:', error);
  }
}

/**
 * Controller for file analysis operations
 */
export const analysisController = {
  /**
   * Trigger analysis for a file
   */
  async triggerAnalysis(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const fileId = parseInt(id, 10);
    
    try {
      // Check if file exists
      const file = await File.findByPk(fileId);
      if (!file) {
        res.status(404).json({ error: 'File not found' });
        return;
      }
      
      // Read file content
      let fileContent: string;
      try {
        fileContent = await fs.readFile(file.file_path, 'utf-8');
      } catch (err) {
        if (err instanceof Error) {
          res.status(500).json({ error: `Failed to read file: ${err.message}` });
        } else {
          res.status(500).json({ error: 'Failed to read file due to an unknown error' });
        }
        return;
      }
      
      // Start analysis
      const jobId = await aiqClient.analyzeFile(fileContent, path.basename(file.file_path), fileId);
      
      // Track the job
      activeJobs.set(jobId, {
        fileId,
        status: 'in_progress',
        progress: 0,
        findings: [],
        startTime: new Date()
      });
      
      // Setup WebSocket listeners for this job
      setupJobListeners(jobId, fileId);
      
      res.status(202).json({ jobId, message: 'Analysis started' });
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error triggering analysis:', error.message);
        res.status(500).json({ error: error.message });
      } else {
        console.error('Unknown error triggering analysis:', error);
        res.status(500).json({ error: 'An unknown error occurred' });
      }
    }
  },
  
  /**
   * Trigger AI Assessment for a file (comprehensive analysis)
   */
  async triggerAssessment(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const fileId = parseInt(id, 10);
    
    try {
      // Check if file exists
      const file = await File.findByPk(fileId);
      if (!file) {
        res.status(404).json({ error: 'File not found' });
        return;
      }
      
      // Check file path
      if (!file.file_path) {
        res.status(400).json({ error: 'File path is missing or invalid' });
        return;
      }
      
      // Read file content
      let fileContent: string;
      try {
        console.log(`Reading file from path: ${file.file_path}`);
        fileContent = await fs.readFile(file.file_path, 'utf-8');
      } catch (err) {
        console.error('Error reading file:', err);
        if (err instanceof Error) {
          res.status(500).json({ error: `Failed to read file: ${err.message}`, details: { path: file.file_path } });
        } else {
          res.status(500).json({ error: 'Failed to read file due to an unknown error', details: { path: file.file_path } });
        }
        return;
      }
      
      if (!fileContent || fileContent.trim() === '') {
        res.status(400).json({ error: 'File content is empty' });
        return;
      }
      
      // Start AI Assessment (using a different endpoint or parameter)
      console.log(`Triggering AI Assessment for file ID: ${fileId}, filename: ${path.basename(file.file_path)}`);
      try {
        const jobId = await aiqClient.assessFile(fileContent, path.basename(file.file_path), fileId);
        
        // Track the job
        activeJobs.set(jobId, {
          fileId,
          status: 'in_progress',
          progress: 0,
          findings: [],
          startTime: new Date()
        });
        
        // Setup WebSocket listeners for this job
        setupJobListeners(jobId, fileId);
        
        res.status(202).json({ jobId, message: 'AI Assessment started' });
      } catch (aiqError) {
        console.error('Error calling AIQ Toolkit:', aiqError);
        if (aiqError instanceof Error) {
          res.status(500).json({ 
            error: 'Error from AIQ Toolkit service', 
            details: aiqError.message 
          });
        } else {
          res.status(500).json({ 
            error: 'Unknown error from AIQ Toolkit service'
          });
        }
      }
    } catch (error) {
      console.error('Error triggering AI Assessment:', error);
      if (error instanceof Error) {
        res.status(500).json({ error: `Error triggering AI Assessment: ${error.message}` });
      } else {
        res.status(500).json({ error: 'An unknown error occurred while triggering AI Assessment' });
      }
    }
  },
  
  /**
   * Trigger comprehensive code review for a file (includes all OWASP 2021 categories)
   */
  async triggerComprehensiveReview(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const fileId = parseInt(id, 10);
    
    try {
      // Check if file exists
      const file = await File.findByPk(fileId);
      if (!file) {
        res.status(404).json({ error: 'File not found' });
        return;
      }
      
      // Generate a job ID for this comprehensive review
      const jobId = uuidv4();
      
      // Track the job
      activeJobs.set(jobId, {
        fileId,
        status: 'in_progress',
        progress: 0,
        findings: [],
        startTime: new Date(),
        currentReview: 'general_review',
        reviewStatus: 'in_progress',
        currentIndex: 1,
        totalReviews: 11  // OWASP 2021 has 10 categories + general review
      });
      
      // Return the job ID immediately
      res.status(202).json({ 
        jobId, 
        message: 'Comprehensive code review started',
        status: 'in_progress',
        progress: 0
      });
      
      // Start the comprehensive review in the background
      aiqClient.on('review_progress', (data: { 
        fileId: number, 
        progress: number, 
        reviewType: string, 
        currentIndex: number,
        totalReviews: number,
        reviewStatus: string 
      }) => {
        if (data.fileId === fileId) {
          // Update job status
          const job = activeJobs.get(jobId);
          if (job) {
            job.progress = data.progress;
            job.currentReview = data.reviewType;
            job.currentIndex = data.currentIndex;
            job.totalReviews = data.totalReviews;
            // Only set reviewStatus to 'completed' if the job is actually completed
            job.reviewStatus = (data.reviewStatus === 'completed' && job.progress === 100) ? 'completed' : data.reviewStatus;
            activeJobs.set(jobId, job);
          }
          // Broadcast status update to any connected clients
          const statusUpdate = {
            jobId,
            status: 'in_progress',
            progress: data.progress,
            currentReview: data.reviewType,
            currentIndex: data.currentIndex,
            totalReviews: data.totalReviews,
            reviewStatus: (data.reviewStatus === 'completed' && data.progress === 100) ? 'completed' : data.reviewStatus
          };
          
          // Find any websocket connections for this job
          const wss = (global as any).wss;
          if (wss) {
            wss.clients.forEach((client: WebSocket) => {
              if (client.readyState === WebSocket.OPEN) {
                // Check if this client is subscribed to this job
                const subscribedJobs = (client as any).subscribedJobs || [];
                if (subscribedJobs.includes(jobId)) {
                  client.send(JSON.stringify({
                    type: 'analysis_progress',
                    ...statusUpdate
                  }));
                }
              }
            });
          }
        }
      });
      
      aiqClient.on('review_error', (data: { 
        fileId: number, 
        reviewType: string, 
        currentIndex: number,
        totalReviews: number,
        progress: number,
        reviewStatus: string,
        error: string 
      }) => {
        if (data.fileId === fileId) {
          console.error(`Error in ${data.reviewType} review:`, data.error);
          
          // Update job status in the activeJobs map
          const job = activeJobs.get(jobId);
          if (job) {
            job.progress = data.progress;
            job.currentReview = data.reviewType;
            job.currentIndex = data.currentIndex;
            job.totalReviews = data.totalReviews;
            job.reviewStatus = 'failed';  // Mark this specific review as failed
            activeJobs.set(jobId, job);
          }
          
          // Broadcast status update for this specific review
          const statusUpdate = {
            jobId,
            status: 'in_progress', // Keep overall job as in_progress
            progress: data.progress,
            currentReview: data.reviewType,
            currentIndex: data.currentIndex,
            totalReviews: data.totalReviews,
            reviewStatus: 'failed' // Mark this specific review as failed
          };
          
          // Find any websocket connections for this job
          const wss = (global as any).wss;
          if (wss) {
            wss.clients.forEach((client: WebSocket) => {
              if (client.readyState === WebSocket.OPEN) {
                // Check if this client is subscribed to this job
                const subscribedJobs = (client as any).subscribedJobs || [];
                if (subscribedJobs.includes(jobId)) {
                  client.send(JSON.stringify({
                    type: 'analysis_progress',
                    ...statusUpdate
                  }));
                }
              }
            });
          }
        }
      });
      
      aiqClient.on('review_complete', (data: { fileId: number, results: any[] }) => {
        if (data.fileId === fileId) {
          // Mark job as completed
          const job = activeJobs.get(jobId);
          if (job) {
            job.status = 'completed';
            job.progress = 100;
            job.endTime = new Date();
            // Find the last review type (e.g., a10) if available
            let lastReviewType = 'completed';
            let lastIndex = 0;
            let totalReviews = 0;
            if (Array.isArray(data.results) && data.results.length > 0) {
              const last = data.results[data.results.length - 1];
              if (last && last.type) {
                lastReviewType = last.type;
              }
              lastIndex = data.results.length;
              totalReviews = data.results.length;
            }
            job.currentReview = lastReviewType;
            job.currentIndex = lastIndex;
            job.totalReviews = totalReviews;
            job.reviewStatus = 'completed';
            // Store findings from all reviews
            job.findings = data.results.flatMap(result => 
              result.status === 'completed' && result.result.findings ? result.result.findings : []
            );
            activeJobs.set(jobId, job);
            
            // Save findings to the database
            saveComprehensiveReviewFindings(jobId, data.results, fileId);
            
            // Broadcast completion to any connected clients
            const statusUpdate = {
              jobId,
              status: 'completed',
              progress: 100,
              currentReview: lastReviewType,
              currentIndex: lastIndex,
              totalReviews: totalReviews,
              reviewStatus: 'completed',
              results: data.results
            };
            
            // Find any websocket connections for this job
            const wss = (global as any).wss;
            if (wss) {
              wss.clients.forEach((client: WebSocket) => {
                if (client.readyState === WebSocket.OPEN) {
                  // Check if this client is subscribed to this job
                  const subscribedJobs = (client as any).subscribedJobs || [];
                  if (subscribedJobs.includes(jobId)) {
                    client.send(JSON.stringify({
                      type: 'analysis_complete',
                      ...statusUpdate
                    }));
                  }
                }
              });
            }
          }
        }
      });
      
      // Start the comprehensive review process
      aiqClient.performComprehensiveReview(fileId)
        .catch((error: Error) => {
          console.error('Error in comprehensive review:', error);
          
          // Mark job as failed
          const job = activeJobs.get(jobId);
          if (job) {
            job.status = 'failed';
            job.endTime = new Date();
            activeJobs.set(jobId, job);
            
            // Broadcast failure to any connected clients
            const statusUpdate = {
              jobId,
              status: 'failed',
              error: error.message
            };
            
            // Find any websocket connections for this job
            const wss = (global as any).wss;
            if (wss) {
              wss.clients.forEach((client: WebSocket) => {
                if (client.readyState === WebSocket.OPEN) {
                  // Check if this client is subscribed to this job
                  const subscribedJobs = (client as any).subscribedJobs || [];
                  if (subscribedJobs.includes(jobId)) {
                    client.send(JSON.stringify({
                      type: 'analysis_error',
                      ...statusUpdate
                    }));
                  }
                }
              });
            }
          }
        });
      
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error triggering comprehensive review:', error.message);
        res.status(500).json({ error: error.message });
      } else {
        console.error('Unknown error triggering comprehensive review:', error);
        res.status(500).json({ error: 'An unknown error occurred' });
      }
    }
  },
  
  /**
   * Get analysis status for a job
   */
  async getAnalysisStatus(req: Request, res: Response): Promise<void> {
    const { jobId } = req.params;
    
    try {
      // Check if job is being tracked locally
      const jobInfo = activeJobs.get(jobId);
      if (jobInfo) {
        res.status(200).json({
          jobId,
          fileId: jobInfo.fileId,
          status: jobInfo.status,
          progress: jobInfo.progress,
          findingCount: jobInfo.findings.length,
          startTime: jobInfo.startTime,
          endTime: jobInfo.endTime,
          currentReview: jobInfo.currentReview || 'general_review',
          reviewStatus: jobInfo.reviewStatus || jobInfo.status,
          currentIndex: jobInfo.currentIndex || 1,
          totalReviews: jobInfo.totalReviews || 1
        });
        return;
      }
      
      // If not tracked locally, check with AIQ Toolkit
      try {
        const jobStatus = await aiqClient.getJobStatus(jobId);
        res.status(200).json(jobStatus);
      } catch (err) {
        res.status(404).json({ error: 'Job not found' });
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error getting analysis status:', error.message);
        res.status(500).json({ error: `Failed to get analysis status: ${error.message}` });
      } else {
        console.error('Unknown error getting analysis status:', error);
        res.status(500).json({ error: 'Failed to get analysis status due to an unknown error' });
      }
    }
  },
  
  /**
   * Get analysis results for a job
   */
  async getAnalysisResults(req: Request, res: Response): Promise<void> {
    const { jobId } = req.params;
    
    try {
      // Check if job is complete and tracked locally
      const jobInfo = activeJobs.get(jobId);
      if (jobInfo && jobInfo.status === 'completed') {
        res.status(200).json({
          jobId,
          fileId: jobInfo.fileId,
          findings: jobInfo.findings,
          startTime: jobInfo.startTime,
          endTime: jobInfo.endTime
        });
        return;
      }
      
      // If not complete or not tracked locally, check with AIQ Toolkit
      try {
        const results = await aiqClient.getResults(jobId);
        res.status(200).json(results);
      } catch (err) {
        res.status(404).json({ error: 'Results not found or job still in progress' });
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error getting analysis results:', error.message);
        res.status(500).json({ error: `Failed to get analysis results: ${error.message}` });
      } else {
        console.error('Unknown error getting analysis results:', error);
        res.status(500).json({ error: 'Failed to get analysis results due to an unknown error' });
      }
    }
  },
  
  /**
   * Get security metrics for a project
   */
  async getProjectSecurityMetrics(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const projectId = parseInt(id, 10);
    
    try {
      // Get all findings for the project through the file association
      const findings = await Finding.findAll({
        include: [
          {
            model: File,
            as: 'file',
            where: {
              project_id: projectId
            }
          }
        ]
      });
      
      // Calculate metrics
      const severityCounts: Record<string, number> = {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0
      };
      
      const typeCounts: Record<string, number> = {};
      const fileIssues: Record<number, number> = {};
      
      findings.forEach((finding: any) => {
        // Count by severity (with type safety)
        const severity = finding.severity as string;
        if (severity && severity in severityCounts) {
          severityCounts[severity]++;
        }
        
        // Count by type
        const findingType = finding.type as string;
        if (findingType) {
          if (!typeCounts[findingType]) {
            typeCounts[findingType] = 0;
          }
          typeCounts[findingType]++;
        }
        
        // Count by file, using proper object path with type safety
        const fileId = finding.codeSnippet?.file?.id;
        if (fileId) {
          if (!fileIssues[fileId]) {
            fileIssues[fileId] = 0;
          }
          fileIssues[fileId]++;
        }
      });
      
      // Find hotspots (files with most issues)
      const hotspots = Object.entries(fileIssues)
        .map(([fileId, count]) => ({ fileId: parseInt(fileId), count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      
      // Get file details for hotspots
      const hotspotDetails = await Promise.all(
        hotspots.map(async ({ fileId, count }) => {
          const file = await File.findByPk(fileId);
          return {
            fileId,
            fileName: file?.file_name || `File ${fileId}`,
            path: file?.file_path || '',
            issueCount: count
          };
        })
      );
      
      // Return metrics
      res.status(200).json({
        projectId,
        totalFindings: findings.length,
        severityCounts,
        typeCounts,
        hotspots: hotspotDetails
      });
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error getting project security metrics:', error.message);
        res.status(500).json({ error: `Failed to get security metrics: ${error.message}` });
      } else {
        console.error('Unknown error getting project security metrics:', error);
        res.status(500).json({ error: 'Failed to get security metrics due to an unknown error' });
      }
    }
  },
  
  /**
   * Proxy requests to the AI code analysis service
   */
  async proxyAICodeReview(req: Request, res: Response): Promise<void> {
    const { fileId, input_message } = req.body;
    
    if (!fileId) {
      res.status(400).json({ error: 'File ID is required' });
      return;
    }
    
    try {
      // Get the file if needed
      const file = await File.findByPk(fileId);
      if (!file) {
        res.status(404).json({ error: 'File not found' });
        return;
      }
      
      // Generate a job ID to track this request
      const jobId = uuidv4();
      
      // Call the AI code analysis service
      const aiResponse = await aiqClient.callAICodeAnalysis(input_message || `Review source code file id ${fileId}`);
      
      // Track the job as completed
      activeJobs.set(jobId, {
        fileId,
        status: 'completed',
        progress: 100,
        findings: aiResponse.findings || [],
        startTime: new Date(),
        endTime: new Date()
      });
      
      // Process the AI response as needed
      const processedResponse = {
        jobId,
        findings: aiResponse.findings || [],
        message: aiResponse.message || 'AI code analysis completed'
      };
      
      res.status(200).json(processedResponse);
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error in AI code analysis proxy:', error.message);
        res.status(500).json({ error: error.message });
      } else {
        console.error('Unknown error in AI code analysis proxy:', error);
        res.status(500).json({ error: 'An unknown error occurred' });
      }
    }
  },
};

/**
 * Set up listeners for a job
 * @param jobId Job ID
 * @param fileId File ID
 */
function setupJobListeners(jobId: string, fileId: number): void {
  aiqClient.subscribeToJob(
    jobId,
    // Progress handler
    async (data) => {
      const jobInfo = activeJobs.get(jobId);
      if (jobInfo) {
        jobInfo.progress = data.progress;
        jobInfo.status = data.status;
        activeJobs.set(jobId, jobInfo);
      }
    },
    // New finding handler
    async (data) => {
      try {
        // Begin transaction
        const transaction = await db.transaction();
        
        try {
          // Create code snippet
          const codeSnippet = await CodeSnippet.create({
            file_id: fileId,
            start_line: data.startLine,
            end_line: data.endLine,
            code: data.codeContent
          }, { transaction });
          
          // Get the file to get its MD5
          const file = await File.findByPk(fileId);
          const fileMd5 = file?.md5 || undefined;
          
          // Create finding
          const finding = await Finding.create({
            type: data.type,
            severity: data.severity,
            description: data.description,
            recommendation: data.remediation,
            code_content: codeSnippet.code,
            md5: fileMd5
          }, { transaction });
          
          // Commit transaction
          await transaction.commit();
          
          // Update job info
          const jobInfo = activeJobs.get(jobId);
          if (jobInfo) {
            jobInfo.findings.push({
              id: finding.id,
              type: finding.type,
              severity: finding.severity,
              description: finding.description,
              recommendation: finding.recommendation,
              codeSnippet: {
                id: codeSnippet.id,
                start_line: codeSnippet.start_line,
                end_line: codeSnippet.end_line,
                code: codeSnippet.code
              }
            });
            activeJobs.set(jobId, jobInfo);
          }
        } catch (err) {
          if (err instanceof Error) {
            console.error('Transaction error:', err.message);
          }
          // Rollback transaction in case of error
          await transaction.rollback();
          throw err;
        }
      } catch (error) {
        if (error instanceof Error) {
          console.error('Error handling new finding:', error.message);
        } else {
          console.error('Unknown error handling new finding:', error);
        }
      }
    },
    // Completion handler
    async (data) => {
      try {
        // Update job info
        const jobInfo = activeJobs.get(jobId);
        if (jobInfo) {
          jobInfo.status = 'completed';
          jobInfo.progress = 100;
          jobInfo.endTime = new Date();
          activeJobs.set(jobId, jobInfo);
        }
        
        // Close WebSocket
        aiqClient.closeWebSocket(jobId);
      } catch (error) {
        if (error instanceof Error) {
          console.error('Error handling job completion:', error.message);
        } else {
          console.error('Unknown error handling job completion:', error);
        }
      }
    },
    // Error handler
    (error) => {
      console.error(`Error in job ${jobId}:`, error);
      
      // Update job info
      const jobInfo = activeJobs.get(jobId);
      if (jobInfo) {
        jobInfo.status = 'failed';
        jobInfo.endTime = new Date();
        activeJobs.set(jobId, jobInfo);
      }
    }
  );
}

/**
 * Set up WebSocket handlers for broadcasting analysis updates to clients
 * @param wss WebSocket server
 */
export function setupWebSocketHandlers(wss: WebSocket.Server): void {
  // Set up event listeners
  aiqClient.on('analysis_progress', (data) => {
    broadcastToClients(wss, 'analysis_progress', data);
  });
  
  aiqClient.on('new_finding', (data) => {
    broadcastToClients(wss, 'new_finding', data);
  });
  
  aiqClient.on('analysis_complete', (data) => {
    broadcastToClients(wss, 'analysis_complete', data);
  });
}

/**
 * Broadcast a message to all connected WebSocket clients
 * @param wss WebSocket server
 * @param type Message type
 * @param data Message data
 */
function broadcastToClients(wss: WebSocket.Server, type: string, data: any): void {
  const message = JSON.stringify({
    type,
    ...data,
    timestamp: new Date().toISOString()
  });
  
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}
