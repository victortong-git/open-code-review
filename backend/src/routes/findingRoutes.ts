import { Router } from 'express'; // Request, Response, RequestHandler removed
import * as findingController from '../controllers/findingController';

const router = Router();

// const placeholderHandler: RequestHandler = (req: Request, res: Response) => {
//   res.send('Finding routes placeholder');
// };

router.get('/', findingController.getAllFindings);
router.post('/', findingController.createFinding);
router.get('/:id', findingController.getFindingById);
router.put('/:id', findingController.updateFinding);
router.delete('/:id', findingController.deleteFinding);
// Route for getting findings by project ID
router.get('/projects/:id', findingController.getFindingsByProjectId);

// router.get('/', placeholderHandler); // Placeholder removed

export default router;