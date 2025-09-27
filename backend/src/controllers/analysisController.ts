import { Request, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';
import natClient from '../services/natClient';
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
  fileId: number;
  status: string;
  progress: number;
  findings: any[];
  startTime: Date;
  endTime?: Date;
  currentReview?: string;
  reviewStatus?: string;
  currentIndex?: number;
  totalReviews?: number;
}>();

// WebSocket server instance for broadcasting
let wsServer: any = null;

/**
 * Broadcast a message to all connected WebSocket clients
 * @param message The message to broadcast
 */
function broadcastWebSocketMessage(message: any): void {
  if (wsServer && wsServer.clients) {
    wsServer.clients.forEach((client: any) => {
      if (client.readyState === 1) { // WebSocket.OPEN
        client.send(JSON.stringify(message));
      }
    });
  }
}

/**
 * Setup WebSocket listeners for a job
 * @param jobId The job ID
 * @param fileId The file ID
 */
function setupJobListeners(jobId: string, fileId: number): void {
  // Subscribe to events from the AIQ client
  natClient.on('review_progress', (data: any) => {
    if (data.fileId === fileId) {
      const jobInfo = activeJobs.get(jobId);
      if (jobInfo) {
        jobInfo.progress = data.progress;
        jobInfo.currentReview = data.reviewType;
        jobInfo.reviewStatus = data.reviewStatus;
        jobInfo.currentIndex = data.currentIndex;
        jobInfo.totalReviews = data.totalReviews;
      }
    }
  });

  natClient.on('review_complete', (data: any) => {
    if (data.fileId === fileId) {
      const jobInfo = activeJobs.get(jobId);
      if (jobInfo) {
        jobInfo.status = 'completed';
        jobInfo.progress = 100;
        jobInfo.endTime = new Date();
      }
    }
  });

  natClient.on('review_error', (data: any) => {
    if (data.fileId === fileId) {
      const jobInfo = activeJobs.get(jobId);
      if (jobInfo) {
        jobInfo.reviewStatus = data.reviewStatus;
        jobInfo.currentReview = data.reviewType;
      }
    }
  });
}

/**
 * Save findings from a comprehensive review to the database
 * @param jobId The job ID
 * @param results The results from all reviews
 * @param fileId The file ID
 */
async function saveComprehensiveReviewFindings(jobId: string, results: any[], fileId: number): Promise<void> {
  try {
    console.log(`[saveComprehensiveReviewFindings] Starting to save findings for job ${jobId}, file ${fileId}`);
    console.log(`[saveComprehensiveReviewFindings] Results structure:`, JSON.stringify(results, null, 2));
    
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
      
      console.log(`[saveComprehensiveReviewFindings] Found file: ${file.file_name}`);
      
      // Process findings from all review types
      for (const review of results) {
        console.log(`[saveComprehensiveReviewFindings] Processing review:`, review.type, 'Status:', review.status);
        
        if (review.status === 'completed' && review.result) {
          // Handle different response structures
          let findings = [];
          
          // Check if findings are nested under result.findings
          if (review.result.findings && Array.isArray(review.result.findings)) {
            findings = review.result.findings;
          }
          // Check if findings are in result.value.findings (for JSON string responses)
          else if (review.result.value) {
            try {
              const parsedValue = typeof review.result.value === 'string' ? 
                JSON.parse(review.result.value) : review.result.value;
              
              if (parsedValue.findings && Array.isArray(parsedValue.findings)) {
                findings = parsedValue.findings;
              } else if (Array.isArray(parsedValue)) {
                findings = parsedValue;
              }
            } catch (parseError) {
              console.error(`[saveComprehensiveReviewFindings] Error parsing result.value:`, parseError);
            }
          }
          // Check if findings are directly in result
          else if (Array.isArray(review.result)) {
            findings = review.result;
          }
          
          console.log(`[saveComprehensiveReviewFindings] Found ${findings.length} findings for review type: ${review.type}`);
          
          for (const finding of findings) {
            console.log(`[saveComprehensiveReviewFindings] Processing finding:`, finding);
            
            // Handle recommendation field (could be array or string)
            let recommendationText = '';
            if (Array.isArray(finding.recommendation)) {
              recommendationText = finding.recommendation.join(', ');
            } else if (typeof finding.recommendation === 'string') {
              recommendationText = finding.recommendation;
            }
            
            // Create the finding in the database
            const findingData = {
              file_id: fileId,
              type: finding.type || (review.type.startsWith('owasp') ? review.type : 'Security Vulnerability'),
              description: finding.description || `Finding from ${review.type}: ${finding.title || 'No title provided'}`,
              severity: finding.severity || 'medium',
              status: finding.status || 'new',
              line_number: finding.line_number || 0,
              recommendation: recommendationText,
              code_content: finding.code_content || '',
              md5: file.md5,
              createdAt: new Date(),
              updatedAt: new Date()
            };
            
            console.log(`[saveComprehensiveReviewFindings] Creating finding with data:`, findingData);
            
            const newFinding = await Finding.create(findingData, { transaction });
            
            console.log(`[saveComprehensiveReviewFindings] Successfully created finding with ID: ${newFinding.id}`);
            
            // Create code snippet if available
            if (finding.code_content || finding.code) {
              const codeContent = finding.code_content || finding.code || '';
              const startLine = finding.line_number || finding.line_start || 0;
              const endLine = finding.line_end || startLine;
              
              await CodeSnippet.create({
                file_id: fileId,
                code: codeContent,
                start_line: startLine,
                end_line: endLine,
                description: `Associated with finding ID: ${newFinding.id}`,
                createdAt: new Date(),
                updatedAt: new Date()
              }, { transaction });
              
              console.log(`[saveComprehensiveReviewFindings] Created code snippet for finding ${newFinding.id}`);
            }
          }
        } else {
          console.log(`[saveComprehensiveReviewFindings] Skipping review ${review.type} - status: ${review.status}, has result: ${!!review.result}`);
        }
      }
      
      // Commit the transaction
      await transaction.commit();
      console.log(`[saveComprehensiveReviewFindings] Successfully committed transaction for job ${jobId}`);
      
    } catch (error) {
      // Rollback the transaction on error
      await transaction.rollback();
      console.error('Error saving comprehensive review findings:', error);
      throw error;
    }
    
  } catch (error) {
    console.error('Error in saveComprehensiveReviewFindings:', error);
    throw error;
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
      const jobId = await natClient.analyzeFile(fileContent, path.basename(file.file_path), fileId);
      
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
        const jobId = await natClient.assessFile(fileContent, path.basename(file.file_path), fileId);
        
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
      
      // Generate a unique job ID for tracking
      const jobId = uuidv4();
      
      // Initialize job tracking
      activeJobs.set(jobId, {
        fileId,
        status: 'analyzing',
        progress: 0,
        findings: [],
        startTime: new Date(),
        currentReview: 'general_review',
        reviewStatus: 'in_progress',
        currentIndex: 1,
        totalReviews: 11
      });
      
      // Return job info immediately for frontend tracking
      res.status(200).json({
        jobId,
        fileId,
        status: 'analyzing',
        progress: 0,
        currentReview: 'general_review'
      });
      
      // Set up event listeners for this specific job
      const progressHandler = (data: any) => {
        if (data.fileId === fileId) {
          const jobInfo = activeJobs.get(jobId);
          if (jobInfo) {
            jobInfo.progress = data.progress;
            jobInfo.currentReview = data.reviewType;
            jobInfo.currentIndex = data.currentIndex;
            jobInfo.reviewStatus = data.reviewStatus;
            activeJobs.set(jobId, jobInfo);
            
            // Broadcast progress update via WebSocket
            broadcastWebSocketMessage({
              type: 'analysis_progress',
              fileId: fileId,
              jobId: jobId,
              progress: data.progress,
              currentReview: data.reviewType,
              reviewStatus: data.reviewStatus,
              currentIndex: data.currentIndex,
              totalReviews: data.totalReviews
            });
          }
        }
      };

      const errorHandler = (data: any) => {
        if (data.fileId === fileId) {
          const jobInfo = activeJobs.get(jobId);
          if (jobInfo) {
            jobInfo.currentReview = data.reviewType;
            jobInfo.reviewStatus = data.reviewStatus;
            activeJobs.set(jobId, jobInfo);
            
            // Broadcast error update via WebSocket
            broadcastWebSocketMessage({
              type: 'review_error',
              fileId: fileId,
              jobId: jobId,
              reviewType: data.reviewType,
              reviewStatus: data.reviewStatus,
              error: data.error
            });
          }
        }
      };

      // Add listeners
      natClient.on('review_progress', progressHandler);
      natClient.on('review_error', errorHandler);
      
      // Start comprehensive review asynchronously
      (async () => {
        try {
          const results = await natClient.performComprehensiveReview(fileId);

          // Save the findings to the database
          await saveComprehensiveReviewFindings(jobId, results.results, fileId);

          // Mark job as completed
          const jobInfo = activeJobs.get(jobId);
          if (jobInfo) {
            jobInfo.status = 'completed';
            jobInfo.progress = 100;
            jobInfo.endTime = new Date();
            jobInfo.findings = results.results;
            activeJobs.set(jobId, jobInfo);
          }
          
          // Broadcast completion via WebSocket
          broadcastWebSocketMessage({
            type: 'analysis_complete',
            fileId: fileId,
            jobId: jobId,
            status: 'completed',
            progress: 100,
            results: results.results
          });
          
          console.log(`Comprehensive review completed for file ID: ${fileId}, job ID: ${jobId}`);
        } catch (error) {
          console.error(`Error in comprehensive review for job ${jobId}:`, error);
          
          // Mark job as failed
          const jobInfo = activeJobs.get(jobId);
          if (jobInfo) {
            jobInfo.status = 'failed';
            jobInfo.endTime = new Date();
            activeJobs.set(jobId, jobInfo);
          }
          
          // Broadcast failure via WebSocket
          broadcastWebSocketMessage({
            type: 'analysis_error',
            fileId: fileId,
            jobId: jobId,
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        } finally {
          // Clean up event listeners
          natClient.off('review_progress', progressHandler);
          natClient.off('review_error', errorHandler);
        }
      })();
      
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
        const jobStatus = await natClient.getJobStatus(jobId);
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
        // Also fetch the saved findings from the database
        let savedFindings: any[] = [];
        try {
          savedFindings = await Finding.findAll({
            where: { file_id: jobInfo.fileId },
            order: [['createdAt', 'DESC']],
            limit: 20 // Get recent findings for this file
          });
        } catch (dbError) {
          console.error('Error fetching saved findings:', dbError);
        }

        // Include saved findings in the response
        const enhancedFindings = jobInfo.findings.map((finding: any) => {
          // If this finding has saved findings, include them
          if (finding.result && finding.result.saved_findings) {
            return finding;
          }
          
          // Add saved findings to the finding result
          return {
            ...finding,
            result: {
              ...finding.result,
              saved_findings: savedFindings.map(sf => sf.toJSON())
            }
          };
        });
        
        res.status(200).json({
          jobId,
          fileId: jobInfo.fileId,
          findings: enhancedFindings,
          startTime: jobInfo.startTime,
          endTime: jobInfo.endTime
        });
        return;
      }
      
      // If not complete or not tracked locally, check with AIQ Toolkit
      try {
        const results = await natClient.getResults(jobId);
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
   * Trigger selective code review for a file (allows user to choose specific review types)
   */
  async triggerSelectiveReview(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const { reviewTypes } = req.body;
    const fileId = parseInt(id, 10);
    
    try {
      // Validate input
      if (!reviewTypes || !Array.isArray(reviewTypes) || reviewTypes.length === 0) {
        res.status(400).json({ error: 'reviewTypes array is required and must not be empty' });
        return;
      }
      
      // Validate review types
      const validReviewTypes = [
        'general_review',
        'owasp_2021_a01', 'owasp_2021_a02', 'owasp_2021_a03', 'owasp_2021_a04', 'owasp_2021_a05',
        'owasp_2021_a06', 'owasp_2021_a07', 'owasp_2021_a08', 'owasp_2021_a09', 'owasp_2021_a10'
      ];
      
      const invalidTypes = reviewTypes.filter(type => !validReviewTypes.includes(type));
      if (invalidTypes.length > 0) {
        res.status(400).json({ 
          error: `Invalid review types: ${invalidTypes.join(', ')}`,
          validTypes: validReviewTypes
        });
        return;
      }
      
      // Check if file exists
      const file = await File.findByPk(fileId);
      if (!file) {
        res.status(404).json({ error: 'File not found' });
        return;
      }
      
      // Generate a unique job ID for tracking
      const jobId = uuidv4();
      
      // Initialize job tracking
      activeJobs.set(jobId, {
        fileId,
        status: 'analyzing',
        progress: 0,
        findings: [],
        startTime: new Date(),
        currentReview: reviewTypes[0],
        reviewStatus: 'in_progress',
        currentIndex: 1,
        totalReviews: reviewTypes.length
      });
      
      // Return job info immediately for frontend tracking
      res.status(200).json({
        jobId,
        fileId,
        status: 'analyzing',
        progress: 0,
        currentReview: reviewTypes[0],
        selectedReviewTypes: reviewTypes,
        totalReviews: reviewTypes.length
      });
      
      // Set up event listeners for this specific job
      const progressHandler = (data: any) => {
        if (data.fileId === fileId) {
          const jobInfo = activeJobs.get(jobId);
          if (jobInfo) {
            jobInfo.progress = data.progress;
            jobInfo.currentReview = data.reviewType;
            jobInfo.currentIndex = data.currentIndex;
            jobInfo.reviewStatus = data.reviewStatus;
            activeJobs.set(jobId, jobInfo);
            
            // Broadcast progress update via WebSocket
            broadcastWebSocketMessage({
              type: 'analysis_progress',
              fileId: fileId,
              jobId: jobId,
              progress: data.progress,
              currentReview: data.reviewType,
              reviewStatus: data.reviewStatus,
              currentIndex: data.currentIndex,
              totalReviews: data.totalReviews
            });
          }
        }
      };

      const errorHandler = (data: any) => {
        if (data.fileId === fileId) {
          const jobInfo = activeJobs.get(jobId);
          if (jobInfo) {
            jobInfo.currentReview = data.reviewType;
            jobInfo.reviewStatus = data.reviewStatus;
            activeJobs.set(jobId, jobInfo);
            
            // Broadcast error update via WebSocket
            broadcastWebSocketMessage({
              type: 'review_error',
              fileId: fileId,
              jobId: jobId,
              reviewType: data.reviewType,
              reviewStatus: data.reviewStatus,
              error: data.error
            });
          }
        }
      };

      // Add listeners
      natClient.on('review_progress', progressHandler);
      natClient.on('review_error', errorHandler);
      
      // Start selective review asynchronously
      (async () => {
        try {
          const results = await natClient.performSelectiveReview(fileId, reviewTypes);

          // Save the findings to the database
          await saveComprehensiveReviewFindings(jobId, results.results, fileId);

          // Mark job as completed
          const jobInfo = activeJobs.get(jobId);
          if (jobInfo) {
            jobInfo.status = 'completed';
            jobInfo.progress = 100;
            jobInfo.endTime = new Date();
            jobInfo.findings = results.results;
            activeJobs.set(jobId, jobInfo);
          }
          
          // Broadcast completion via WebSocket
          broadcastWebSocketMessage({
            type: 'analysis_complete',
            fileId: fileId,
            jobId: jobId,
            status: 'completed',
            progress: 100,
            results: results.results,
            selectedReviewTypes: reviewTypes
          });
          
          console.log(`Selective review completed for file ID: ${fileId}, job ID: ${jobId}, review types: ${reviewTypes.join(', ')}`);
        } catch (error) {
          console.error(`Error in selective review for job ${jobId}:`, error);
          
          // Mark job as failed
          const jobInfo = activeJobs.get(jobId);
          if (jobInfo) {
            jobInfo.status = 'failed';
            jobInfo.endTime = new Date();
            activeJobs.set(jobId, jobInfo);
          }
          
          // Broadcast failure via WebSocket
          broadcastWebSocketMessage({
            type: 'analysis_error',
            fileId: fileId,
            jobId: jobId,
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        } finally {
          // Clean up event listeners
          natClient.off('review_progress', progressHandler);
          natClient.off('review_error', errorHandler);
        }
      })();
      
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error triggering selective review:', error.message);
        res.status(500).json({ error: error.message });
      } else {
        console.error('Unknown error triggering selective review:', error);
        res.status(500).json({ error: 'An unknown error occurred' });
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
      const aiResponse = await natClient.callAICodeAnalysis(fileId, 'general_review');
      
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
 * Setup WebSocket handlers for analysis updates
 * @param wss WebSocket server instance
 */
export function setupWebSocketHandlers(wss: any): void {
  // Store WebSocket server instance for broadcasting
  wsServer = wss;
  
  // Subscribe to events from the AIQ client to broadcast updates
  natClient.on('analysis_progress', (data: any) => {
    // Broadcast progress updates to all connected clients
    wss.clients.forEach((client: any) => {
      if (client.readyState === 1) { // WebSocket.OPEN
        client.send(JSON.stringify({
          type: 'analysis_progress',
          ...data
        }));
      }
    });
  });

  natClient.on('new_finding', (data: any) => {
    // Broadcast new findings to all connected clients
    wss.clients.forEach((client: any) => {
      if (client.readyState === 1) { // WebSocket.OPEN
        client.send(JSON.stringify({
          type: 'new_finding',
          ...data
        }));
      }
    });
  });

  natClient.on('analysis_complete', (data: any) => {
    // Broadcast completion updates to all connected clients
    wss.clients.forEach((client: any) => {
      if (client.readyState === 1) { // WebSocket.OPEN
        client.send(JSON.stringify({
          type: 'analysis_complete',
          ...data
        }));
      }
    });
  });

  natClient.on('review_progress', (data: any) => {
    // Broadcast review progress updates to all connected clients
    wss.clients.forEach((client: any) => {
      if (client.readyState === 1) { // WebSocket.OPEN
        client.send(JSON.stringify({
          type: 'review_progress',
          ...data
        }));
      }
    });
  });

  natClient.on('review_complete', (data: any) => {
    // Broadcast review completion to all connected clients
    wss.clients.forEach((client: any) => {
      if (client.readyState === 1) { // WebSocket.OPEN
        client.send(JSON.stringify({
          type: 'review_complete',
          ...data
        }));
      }
    });
  });

  natClient.on('review_error', (data: any) => {
    // Broadcast review errors to all connected clients
    wss.clients.forEach((client: any) => {
      if (client.readyState === 1) { // WebSocket.OPEN
        client.send(JSON.stringify({
          type: 'review_error',
          ...data
        }));
      }
    });
  });
}


