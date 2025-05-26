import { Request, Response, NextFunction } from 'express';
import { db } from '../models';
import crypto from 'crypto';

// Calculate MD5 hash from content
const calculateMD5 = (content: string): string => {
  return crypto.createHash('md5').update(content).digest('hex');
};

// Get all files (potentially with project context)
export const getAllFiles = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectId = req.query.projectId as string | undefined;
    const whereClause: { project_id?: number } = {};
    if (projectId) {
      const pId = parseInt(projectId, 10);
      if (isNaN(pId)) {
        res.status(400).json({ message: 'Invalid projectId format.' });
        return;
      }
      whereClause.project_id = pId;
    }
    const files = await db.File.findAll({ where: whereClause });
    res.status(200).json(files);
  } catch (error) {
    next(error);
  }
};

// Create a new file
export const createFile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { project_id, file_path, file_name, content, file_type } = req.body;

    if (!project_id || !file_path || !file_name) {
      res.status(400).json({ message: 'project_id, file_path, and file_name are required.' });
      return;
    }

    const pId = parseInt(project_id, 10);
    if (isNaN(pId)) {
        res.status(400).json({ message: 'Invalid project_id format.' });
        return;
    }

    // Check if project exists
    const projectExists = await db.Project.findByPk(pId);
    if (!projectExists) {
      res.status(404).json({ message: `Project with id ${pId} not found.` });
      return;
    }

    // Calculate MD5 if content is provided
    let md5 = null;
    let lineOfCode = null;
    if (content) {
      md5 = calculateMD5(content);
      // Count the lines of code
      lineOfCode = content.split('\n').length;
    }

    const newFile = await db.File.create({ 
      project_id: pId, 
      file_path, 
      file_name, 
      content, 
      md5,
      isProcessed: false,
      line_of_code: lineOfCode,
      file_type
    });
    res.status(201).json(newFile);
  } catch (error) {
    next(error);
  }
};

// Get a single file by ID
export const getFileById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ message: 'Invalid file ID format.' });
      return;
    }
    const file = await db.File.findByPk(id);
    if (file) {
      res.status(200).json(file);
    } else {
      res.status(404).json({ message: 'File not found' });
    }
  } catch (error) {
    next(error);
  }
};

// Update a file by ID
export const updateFile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ message: 'Invalid file ID format.' });
      return;
    }
    const { file_path, file_name, content, file_type, description, initial_security_review, initial_coding_quality } = req.body;

    const file = await db.File.findByPk(id);
    if (!file) {
      res.status(404).json({ message: 'File not found' });
      return;
    }

    // Calculate MD5 if content is provided
    if (content !== undefined) {
      const newMD5 = calculateMD5(content);
      
      // If md5 doesn't exist, add it
      if (!file.md5) {
        file.md5 = newMD5;
      } 
      // If md5 exists, compare with new one
      else if (file.md5 !== newMD5) {
        file.isChanged = true;
        file.isProcessed = false;
        file.md5 = newMD5;
      }
      
      file.content = content;
      
      // Update line count
      file.line_of_code = content.split('\n').length;
    }

    // Only update fields that are provided
    if (file_path !== undefined) file.file_path = file_path;
    if (file_name !== undefined) file.file_name = file_name;
    if (file_type !== undefined) file.file_type = file_type;
    if (description !== undefined) file.description = description;
    if (initial_security_review !== undefined) file.initial_security_review = initial_security_review;
    if (initial_coding_quality !== undefined) file.initial_coding_quality = initial_coding_quality;

    await file.save();
    res.status(200).json(file);
  } catch (error) {
    next(error);
  }
};

// Delete a file by ID
export const deleteFile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ message: 'Invalid file ID format.' });
      return;
    }
    const file = await db.File.findByPk(id);
    if (!file) {
      res.status(404).json({ message: 'File not found' });
      return;
    }
    await file.destroy();
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

// Toggle file ignore status
export const toggleFileIgnore = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ message: 'Invalid file ID format.' });
      return;
    }
    
    const file = await db.File.findByPk(id);
    if (!file) {
      res.status(404).json({ message: 'File not found' });
      return;
    }

    // Toggle the isIgnored status
    file.isIgnored = !file.isIgnored;
    await file.save();
    
    res.status(200).json(file);
  } catch (error) {
    next(error);
  }
};

// Update file's MD5 hash and check for changes
export const updateFileMD5 = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ message: 'Invalid file ID format.' });
      return;
    }
    
    const file = await db.File.findByPk(id);
    if (!file) {
      res.status(404).json({ message: 'File not found' });
      return;
    }

    // Content is required for MD5 calculation
    if (!file.content) {
      res.status(400).json({ message: 'File content is required for MD5 calculation.' });
      return;
    }

    const newMD5 = calculateMD5(file.content);
    
    // If md5 doesn't exist, add it
    if (!file.md5) {
      file.md5 = newMD5;
    } 
    // If md5 exists, compare with new one
    else if (file.md5 !== newMD5) {
      file.isChanged = true;
      file.isProcessed = false;
      file.md5 = newMD5;
    }

    await file.save();
    res.status(200).json(file);
  } catch (error) {
    next(error);
  }
};

// Get files by project ID
export const getFilesByProject = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectId = parseInt(req.params.id, 10);
    if (isNaN(projectId)) {
      res.status(400).json({ message: 'Invalid project ID format.' });
      return;
    }
    
    // Check if project exists
    const projectExists = await db.Project.findByPk(projectId);
    if (!projectExists) {
      res.status(404).json({ message: `Project with id ${projectId} not found.` });
      return;
    }

    const files = await db.File.findAll({ where: { project_id: projectId } });
    res.status(200).json(files);
  } catch (error) {
    next(error);
  }
};

// Mark file as processed
export const markFileAsProcessed = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ message: 'Invalid file ID format.' });
      return;
    }
    
    const file = await db.File.findByPk(id);
    if (!file) {
      res.status(404).json({ message: 'File not found' });
      return;
    }

    file.isProcessed = true;
    
    await file.save();
    res.status(200).json(file);
  } catch (error) {
    next(error);
  }
};