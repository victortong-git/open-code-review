import { Router } from 'express';
import * as codeSnippetController from '../controllers/codeSnippetController';

const router = Router();

router.get('/', codeSnippetController.getAllCodeSnippets);
router.post('/', codeSnippetController.createCodeSnippet);
router.get('/:id', codeSnippetController.getCodeSnippetById);
router.put('/:id', codeSnippetController.updateCodeSnippet);
router.delete('/:id', codeSnippetController.deleteCodeSnippet);
router.get('/file/:id', codeSnippetController.getCodeSnippetsByFile);

export default router;
