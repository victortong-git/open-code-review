import express from 'express';
import { analysisController } from '../controllers/analysisController';

const router = express.Router();

// Trigger analysis for a file
router.post('/files/:id/analyze', analysisController.triggerAnalysis);

// Trigger AI Assessment for a file
router.post('/files/:id/assessment', analysisController.triggerAssessment);

// Trigger comprehensive code review including all OWASP categories
router.post('/files/:id/comprehensive-review', analysisController.triggerComprehensiveReview);

// Trigger selective code review with user-chosen review types
router.post('/files/:id/selective-review', analysisController.triggerSelectiveReview);

// Get security metrics for a project
router.get('/projects/:id/metrics', analysisController.getProjectSecurityMetrics);

// Get findings for a project - redirect to the appropriate controller
router.get('/projects/:id/findings', (req, res, next) => {
  // Redirect to the findings controller
  const findingController = require('../controllers/findingController');
  findingController.getFindingsByProjectId(req, res, next);
});

// Get analysis status
router.get('/jobs/:jobId', analysisController.getAnalysisStatus);

// Get analysis results
router.get('/results/:jobId', analysisController.getAnalysisResults);

// Proxy endpoint for AI code review
router.post('/ai-review', analysisController.proxyAICodeReview);

export default router;
