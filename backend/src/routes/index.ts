import { Router } from 'express';
import projectRoutes from './projectRoutes';
import fileRoutes from './fileRoutes';
// ReviewRequest routes removed as the table is no longer needed
import findingRoutes from './findingRoutes';
import codeSnippetRoutes from './codeSnippetRoutes';
import analysisRoutes from './analysisRoutes';

const router = Router();

router.use('/projects', projectRoutes);
router.use('/files', fileRoutes);
// Review-requests route removed as the table is no longer needed
router.use('/findings', findingRoutes);
router.use('/code-snippets', codeSnippetRoutes);
router.use('/analysis', analysisRoutes);

router.get('/', (req, res) => {
  res.send('API is working!');
});

router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Backend server is running properly' });
});

export default router;