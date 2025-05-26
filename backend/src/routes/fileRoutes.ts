import { Router } from 'express'; // Request, Response, RequestHandler removed
import * as fileController from '../controllers/fileController';
import * as findingController from '../controllers/findingController';

const router = Router();

// const placeholderHandler: RequestHandler = (req: Request, res: Response) => {
//   res.send('File routes placeholder');
// };

router.get('/', fileController.getAllFiles);
router.post('/', fileController.createFile);
router.get('/:id', fileController.getFileById);
router.put('/:id', fileController.updateFile);
router.delete('/:id', fileController.deleteFile);
router.patch('/:id/toggle-ignore', fileController.toggleFileIgnore);
router.patch('/:id/update-md5', fileController.updateFileMD5);
router.patch('/:id/mark-processed', fileController.markFileAsProcessed);
router.get('/:id/findings', findingController.getFindingsByFileId);

// router.get('/', placeholderHandler); // Placeholder removed

export default router;