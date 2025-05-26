import { Request, Response, NextFunction } from 'express';
import { db } from '../models';
import fs from 'fs';
import path from 'path';
import { Op } from 'sequelize';
import crypto from 'crypto';

// Calculate MD5 hash from content
const calculateMD5 = (content: string): string => {
  return crypto.createHash('md5').update(content).digest('hex');
};

// Get all projects
export const getAllProjects = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projects = await db.Project.findAll();
    res.status(200).json(projects);
  } catch (error) {
    next(error);
  }
};

// Create a new project
export const createProject = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      res.status(400).json({ message: 'Project name is required.' });
      return;
    }
    const newProject = await db.Project.create({ name, description });
    res.status(201).json(newProject);
  } catch (error) {
    next(error);
  }
};

// Get a single project by ID
export const getProjectById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ message: 'Invalid project ID format.' });
      return;
    }
    const project = await db.Project.findByPk(id);
    if (project) {
      res.status(200).json(project);
    } else {
      res.status(404).json({ message: 'Project not found' });
    }
  } catch (error) {
    next(error);
  }
};

// Update a project by ID
export const updateProject = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ message: 'Invalid project ID format.' });
      return;
    }
    const { name, description } = req.body;
    // Basic validation: name is required for update if provided
    if (name !== undefined && !name) {
        res.status(400).json({ message: 'Project name cannot be empty if provided for update.' });
        return;
    }

    const project = await db.Project.findByPk(id);
    if (!project) {
      res.status(404).json({ message: 'Project not found' });
      return;
    }

    // Only update fields that are provided in the request body
    if (name !== undefined) project.name = name;
    if (description !== undefined) project.description = description;
    
    await project.save();
    res.status(200).json(project);

  } catch (error) {
    next(error);
  }
};

// Delete a project by ID
export const deleteProject = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ message: 'Invalid project ID format.' });
      return;
    }
    const project = await db.Project.findByPk(id);
    if (!project) {
      res.status(404).json({ message: 'Project not found' });
      return;
    }
    await project.destroy();
    res.status(204).send(); // No content
  } catch (error) {
    next(error);
  }
};

// Scan all projects
export const scanAllProjects = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectsDir = process.env.NODE_ENV === 'production' 
      ? '/usr/src/app/projects'  // Container path
      : path.join(__dirname, '../../projects'); // Local dev path CORRECTION: ../../
    
    if (!fs.existsSync(projectsDir)) {
      res.status(404).json({ message: 'Projects directory not found' });
      return;
    }

    const projectFolders = fs.readdirSync(projectsDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    const results = [];

    for (const folderName of projectFolders) {
      const projectPath = path.join(projectsDir, folderName);
      
      let [project, created] = await db.Project.findOrCreate({
        where: { name: folderName },
        defaults: { description: `Project scanned from ${folderName} directory` }
      });
      
      const scannedFiles = await scanFilesInDirectory(projectPath, '', project.id);
      
      results.push({
        projectId: project.id,
        projectName: project.name,
        created,
        filesCount: scannedFiles.length,
        files: scannedFiles
      });
    }

    res.status(200).json({ 
      message: 'Projects discovered successfully', 
      scannedProjects: results 
    });
  } catch (error) {
    console.error('Error scanning projects:', error);
    next(error);
  }
};

// Scan a specific project
export const scanProject = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectId = parseInt(req.params.id, 10);
    if (isNaN(projectId)) {
      res.status(400).json({ message: 'Invalid project ID format.' });
      return;
    }

    const project = await db.Project.findByPk(projectId);

    if (!project) {
      res.status(404).json({ message: 'Project not found' });
      return;
    }

    const projectsDir = process.env.NODE_ENV === 'production' 
      ? '/usr/src/app/projects'  // Container path
      : path.join(__dirname, '../../projects'); // Local dev path CORRECTION: ../../

    const projectPath = path.join(projectsDir, project.name);
    
    if (!fs.existsSync(projectPath)) {
      res.status(404).json({ message: 'Project directory not found' });
      return;
    }

    const scannedFiles = await scanFilesInDirectory(projectPath, '', projectId);
    
    res.status(200).json({ 
      message: 'Files discovered successfully',
      projectId: projectId,
      files: scannedFiles
    });
  } catch (error) {
    console.error('Error scanning project:', error);
    next(error);
  }
};

// Helper function to scan files recursively in a directory
interface ScannedFileResult {
  id: number;
  fileName: string;
  filePath: string;
  created: boolean;
  updated: boolean;
}

const scanFilesInDirectory = async (basePath: string, relativePath: string, projectId: number): Promise<ScannedFileResult[]> => {
  const fullPath = path.join(basePath, relativePath);
  let files: fs.Dirent[] = [];
  const results: ScannedFileResult[] = [];

  try {
    files = fs.readdirSync(fullPath, { withFileTypes: true });
  } catch (error) {
    console.error(`Error reading directory ${fullPath}:`, error);
    return results; // Return empty results on error
  }
  
  for (const file of files) {
    const filePath = path.join(relativePath, file.name);
    
    if (file.isDirectory()) {
      // Recursively scan subdirectories
      try {
        const subResults = await scanFilesInDirectory(basePath, filePath, projectId);
        results.push(...subResults);
      } catch (error) {
        console.error(`Error scanning subdirectory ${filePath}:`, error);
        // Continue with other files even if a subdirectory has issues
      }
    } else {        // Process file
      try {
        const fullFilePath = path.join(basePath, filePath);
        let content = '';
        
        try {
          content = fs.readFileSync(fullFilePath, 'utf8');
        } catch (error) {
          console.error(`Error reading file ${fullFilePath}:`, error);
          content = `Error: Could not read file content - ${error instanceof Error ? error.message : String(error)}`;
        }
        
        // Calculate MD5 hash for the content
        const md5Hash = calculateMD5(content);
        
        // Count lines of code
        const lineOfCode = content.split('\n').length;
        
        // Get file extension to determine file type
        const fileExtension = path.extname(file.name).toLowerCase();
        
        // Find or create file in DB
        const [dbFile, created] = await db.File.findOrCreate({
          where: { 
            project_id: projectId,
            file_name: file.name
          },
          defaults: {
            file_path: relativePath || '/',
            content: content,
            isScanned: true,
            md5: md5Hash,
            line_of_code: lineOfCode,
            file_type: fileExtension.slice(1), // remove the dot
            isProcessed: false
          }
        });

        // If file exists, update its content and MD5
        if (!created) {
          dbFile.content = content;
          dbFile.file_path = relativePath || '/';
          dbFile.isScanned = true;
          
          // Update MD5 hash
          const newMD5 = md5Hash;
          
          // If md5 doesn't exist, add it
          if (!dbFile.md5) {
            dbFile.md5 = newMD5;
          } 
          // If md5 exists, compare with new one
          else if (dbFile.md5 !== newMD5) {
            dbFile.isChanged = true;
            dbFile.isProcessed = false;
            dbFile.md5 = newMD5;
          }
          
          // Update line count and file type
          dbFile.line_of_code = lineOfCode;
          if (!dbFile.file_type) {
            dbFile.file_type = path.extname(file.name).toLowerCase().slice(1);
          }
          
          await dbFile.save();
        }

        results.push({
          id: dbFile.id,
          fileName: dbFile.file_name,
          filePath: dbFile.file_path,
          created,
          updated: !created
        });
      } catch (error) {
        console.error(`Error processing file ${filePath}:`, error);
        // Continue with other files even if one has issues
      }
    }
  }

  return results;
};

// Calculate project stats - counts of files and findings
export const getProjectStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ message: 'Invalid project ID format.' });
      return;
    }
    
    const project = await db.Project.findByPk(id);
    if (!project) {
      res.status(404).json({ message: 'Project not found' });
      return;
    }

    // Get file count
    const filesCount = await db.File.count({ where: { project_id: id } });
    
    // Get scanned and ignored files counts
    const scannedFilesCount = await db.File.count({ 
      where: { 
        project_id: id,
        isScanned: true
      } 
    });
    
    const ignoredFilesCount = await db.File.count({ 
      where: { 
        project_id: id,
        isIgnored: true
      } 
    });

    // Get all file IDs for this project
    const files = await db.File.findAll({
      where: { project_id: id },
      attributes: ['id']
    });
    
    const fileIds = files.map((file: any) => file.id);

    // Get MD5 hashes of files in this project
    const filesWithMd5 = await db.File.findAll({
      where: { project_id: id },
      attributes: ['id', 'md5']
    });
    
    const fileMd5s = filesWithMd5.filter((file: { md5?: string }) => file.md5).map((file: { md5: string }) => file.md5);

    // Count findings by severity using MD5 hash
    const highRiskCount = await db.Finding.count({
      where: {
        md5: {
          [Op.in]: fileMd5s
        },
        severity: 'high'
      }
    });

    const mediumRiskCount = await db.Finding.count({
      where: {
        md5: {
          [Op.in]: fileMd5s
        },
        severity: 'medium'
      }
    });

    const lowRiskCount = await db.Finding.count({
      where: {
        md5: {
          [Op.in]: fileMd5s
        },
        severity: 'low'
      }
    });

    const criticalRiskCount = await db.Finding.count({
      where: {
        md5: {
          [Op.in]: fileMd5s
        },
        severity: 'critical'
      }
    });

    // Build stats object
    const stats = {
      totalFiles: filesCount,
      scannedFiles: scannedFilesCount,
      ignoredFiles: ignoredFilesCount,
      criticalRiskFindings: criticalRiskCount,
      highRiskFindings: highRiskCount,
      mediumRiskFindings: mediumRiskCount,
      lowRiskFindings: lowRiskCount
    };

    res.status(200).json(stats);
  } catch (error) {
    console.error('Error getting project stats:', error);
    next(error);
  }
};

// Update MD5 for all files in a project
export const updateProjectFilesMD5 = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectId = parseInt(req.params.id, 10);
    if (isNaN(projectId)) {
      res.status(400).json({ message: 'Invalid project ID format.' });
      return;
    }

    const project = await db.Project.findByPk(projectId);
    if (!project) {
      res.status(404).json({ message: 'Project not found' });
      return;
    }

    // Get all files for this project
    const files = await db.File.findAll({
      where: { project_id: projectId }
    });

    const results = [];
    let updatedCount = 0;

    for (const file of files) {
      if (file.content) {
        const newMD5 = calculateMD5(file.content);
        let wasUpdated = false;

        // Only update if MD5 is missing or changed
        if (!file.md5 || file.md5 !== newMD5) {
          file.md5 = newMD5;
          file.isChanged = file.md5 !== newMD5 && file.md5 !== null;
          
          // If content exists but line count doesn't, calculate it
          if (!file.line_of_code) {
            file.line_of_code = file.content.split('\n').length;
          }

          // Set file type if not already set
          if (!file.file_type) {
            file.file_type = path.extname(file.file_name).toLowerCase().slice(1);
          }

          await file.save();
          updatedCount++;
          wasUpdated = true;
        }

        results.push({
          id: file.id,
          fileName: file.file_name,
          wasUpdated,
          hadMD5: !!file.md5,
          newMD5: wasUpdated
        });
      }
    }

    res.status(200).json({ 
      message: 'MD5 values updated successfully',
      projectId: projectId,
      totalFiles: files.length,
      updatedFiles: updatedCount,
      results: results
    });
  } catch (error) {
    console.error('Error updating MD5 values:', error);
    next(error);
  }
};
