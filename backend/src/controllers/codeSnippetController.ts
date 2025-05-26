import { Request, Response, NextFunction } from 'express';
import { db } from '../models';

// Get all code snippets
export const getAllCodeSnippets = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const fileId = req.query.fileId as string | undefined;
    const whereClause: { file_id?: number } = {};
    if (fileId) {
      const fId = parseInt(fileId, 10);
      if (isNaN(fId)) {
        res.status(400).json({ message: 'Invalid fileId format.' });
        return;
      }
      whereClause.file_id = fId;
    }
    const codeSnippets = await db.CodeSnippet.findAll({ where: whereClause });
    res.status(200).json(codeSnippets);
  } catch (error) {
    next(error);
  }
};

// Create a new code snippet
export const createCodeSnippet = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { 
      file_id, 
      code, 
      code_type, 
      start_line, 
      end_line, 
      line_of_code,
      description,
      initial_security_review,
      initial_coding_quality
    } = req.body;

    if (!file_id || !code) {
      res.status(400).json({ message: 'file_id and code are required.' });
      return;
    }

    const fId = parseInt(file_id, 10);
    if (isNaN(fId)) {
        res.status(400).json({ message: 'Invalid file_id format.' });
        return;
    }

    // Check if file exists
    const fileExists = await db.File.findByPk(fId);
    if (!fileExists) {
      res.status(404).json({ message: `File with id ${fId} not found.` });
      return;
    }

    const newCodeSnippet = await db.CodeSnippet.create({ 
      file_id: fId, 
      code, 
      code_type, 
      start_line, 
      end_line, 
      line_of_code,
      description,
      initial_security_review,
      initial_coding_quality,
      isAssessed: false
    });
    res.status(201).json(newCodeSnippet);
  } catch (error) {
    next(error);
  }
};

// Get a single code snippet by ID
export const getCodeSnippetById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ message: 'Invalid code snippet ID format.' });
      return;
    }
    const codeSnippet = await db.CodeSnippet.findByPk(id);
    if (codeSnippet) {
      res.status(200).json(codeSnippet);
    } else {
      res.status(404).json({ message: 'Code snippet not found' });
    }
  } catch (error) {
    next(error);
  }
};

// Update a code snippet by ID
export const updateCodeSnippet = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ message: 'Invalid code snippet ID format.' });
      return;
    }
    const { 
      code,
      code_type,
      start_line,
      end_line,
      line_of_code,
      description,
      initial_security_review,
      initial_coding_quality,
      isAssessed,
      code_quality,
      code_quality_reason,
      code_snippet_example
    } = req.body;

    const codeSnippet = await db.CodeSnippet.findByPk(id);
    if (!codeSnippet) {
      res.status(404).json({ message: 'Code snippet not found' });
      return;
    }

    // Only update fields that are provided
    if (code !== undefined) codeSnippet.code = code;
    if (code_type !== undefined) codeSnippet.code_type = code_type;
    if (start_line !== undefined) codeSnippet.start_line = start_line;
    if (end_line !== undefined) codeSnippet.end_line = end_line;
    if (line_of_code !== undefined) codeSnippet.line_of_code = line_of_code;
    if (description !== undefined) codeSnippet.description = description;
    if (initial_security_review !== undefined) codeSnippet.initial_security_review = initial_security_review;
    if (initial_coding_quality !== undefined) codeSnippet.initial_coding_quality = initial_coding_quality;
    if (isAssessed !== undefined) {
      codeSnippet.isAssessed = isAssessed;
      if (isAssessed) {
        codeSnippet.assessedAt = new Date();
      }
    }
    if (code_quality !== undefined) codeSnippet.code_quality = code_quality;
    if (code_quality_reason !== undefined) codeSnippet.code_quality_reason = code_quality_reason;
    if (code_snippet_example !== undefined) codeSnippet.code_snippet_example = code_snippet_example;

    await codeSnippet.save();
    res.status(200).json(codeSnippet);
  } catch (error) {
    next(error);
  }
};

// Delete a code snippet by ID
export const deleteCodeSnippet = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ message: 'Invalid code snippet ID format.' });
      return;
    }
    const codeSnippet = await db.CodeSnippet.findByPk(id);
    if (!codeSnippet) {
      res.status(404).json({ message: 'Code snippet not found' });
      return;
    }
    await codeSnippet.destroy();
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

// Get code snippets by file ID
export const getCodeSnippetsByFile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const fileId = parseInt(req.params.id, 10);
    if (isNaN(fileId)) {
      res.status(400).json({ message: 'Invalid file ID format.' });
      return;
    }
    
    // Check if file exists
    const fileExists = await db.File.findByPk(fileId);
    if (!fileExists) {
      res.status(404).json({ message: `File with id ${fileId} not found.` });
      return;
    }

    const codeSnippets = await db.CodeSnippet.findAll({ where: { file_id: fileId } });
    res.status(200).json(codeSnippets);
  } catch (error) {
    next(error);
  }
};
