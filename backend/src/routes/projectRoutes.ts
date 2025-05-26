import { Router } from 'express'; // Request, Response, RequestHandler removed as they are inferred or in controller
import * as projectController from '../controllers/projectController';
import * as fileController from '../controllers/fileController';
import * as findingController from '../controllers/findingController';

const router = Router();

// const placeholderHandler: RequestHandler = (req: Request, res: Response) => {
//   res.send('Project routes placeholder');
// };

router.get('/', projectController.getAllProjects);
router.post('/', projectController.createProject);
router.post('/scan', projectController.scanAllProjects);
router.get('/:id', projectController.getProjectById);
router.put('/:id', projectController.updateProject);
router.delete('/:id', projectController.deleteProject);
router.post('/:id/scan', projectController.scanProject);
router.post('/:id/update-md5', projectController.updateProjectFilesMD5); // New endpoint to update MD5 values
router.get('/:id/stats', projectController.getProjectStats);
router.get('/:id/files', fileController.getFilesByProject);
// Add new endpoints for findings summary and trends
router.get('/:id/findings/summary', findingController.getFindingsSummaryByProjectId);
router.get('/:id/findings/trends', findingController.getFindingsTrendsByProjectId);

// router.get('/', placeholderHandler); // Placeholder removed

export default router;