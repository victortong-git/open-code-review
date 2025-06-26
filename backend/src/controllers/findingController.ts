import { Request, Response, NextFunction } from 'express';
import { db } from '../models';
import { Op } from 'sequelize';

// Get all findings
export const getAllFindings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Removed reviewRequestId filter
    const findings = await db.Finding.findAll();
    res.status(200).json(findings);
  } catch (error) {
    next(error);
  }
};

// Create a new finding
export const createFinding = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { 
      type, 
      description, 
      severity, 
      severity_reason, // Added severity_reason field
      status, 
      line_number, 
      code_content, 
      md5,
      recommendation,
      file_id 
    } = req.body;

    if (!type || !description) {
      res.status(400).json({ message: 'Type and description are required.' });
      return;
    }

    // Get the file's MD5 hash if file_id is provided and override payload MD5
    let updatedMd5 = md5;
    if (file_id) {
      const file = await db.File.findByPk(file_id);
      if (file && file.md5) {
        updatedMd5 = file.md5;
      }
    }

    // Log the request body for debugging
    console.log('Request body for creating finding:', req.body);
    console.log('Severity reason from request:', severity_reason);
    
    // Create the finding payload
    const findingPayload = {
      type,
      description,
      severity,
      severity_reason, // Added severity_reason field
      status,
      line_number: line_number ? parseInt(line_number, 10) : undefined,
      code_content,
      md5: updatedMd5,
      recommendation,
      file_id // Save the file_id to link the finding to the file
    };
    
    // Log the payload being sent to the database
    console.log('Finding payload being sent to database:', findingPayload);
    
    const newFinding = await db.Finding.create(findingPayload);
    
    // Log the created finding
    console.log('Finding created successfully, returned from database:', newFinding.toJSON());
    
    res.status(201).json(newFinding);
  } catch (error) {
    next(error);
  }
};

// Get a single finding by ID
export const getFindingById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ message: 'Invalid finding ID format.' });
      return;
    }
    const finding = await db.Finding.findByPk(id, {
      include: [{
        model: db.File,
        as: 'file',
        attributes: ['id', 'file_name', 'md5'] // Include relevant file attributes
      }]
    });
    if (finding) {
      console.log(`Fetched finding with ID ${id}:`, finding.toJSON()); // Add logging
      res.status(200).json(finding);
    } else {
      console.log(`Finding with ID ${id} not found.`); // Add logging
      res.status(404).json({ message: 'Finding not found' });
    }
  } catch (error) {
    console.error(`Error fetching finding with ID ${req.params.id}:`, error); // Fixed error logging scope
    next(error);
  }
};

// Update a finding by ID
export const updateFinding = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ message: 'Invalid finding ID format.' });
      return;
    }
    const {
      type,
      description,
      severity,
      severity_reason, // Added severity_reason field
      status,
      line_number,
      code_content,
      md5,
      recommendation
    } = req.body;

    const finding = await db.Finding.findByPk(id);
    if (!finding) {
      res.status(404).json({ message: 'Finding not found' });
      return;
    }

    if (type !== undefined) finding.type = type;
    if (description !== undefined) finding.description = description;
    if (severity !== undefined) finding.severity = severity;
    if (severity_reason !== undefined) finding.severity_reason = severity_reason; // Added severity_reason field
    if (status !== undefined) finding.status = status;
    if (code_content !== undefined) finding.code_content = code_content;
    if (md5 !== undefined) finding.md5 = md5;
    if (recommendation !== undefined) finding.recommendation = recommendation;
    if (line_number !== undefined) {
      const ln = parseInt(line_number, 10);
      finding.line_number = isNaN(ln) ? undefined : ln;
    } else if (req.body.hasOwnProperty('line_number') && req.body.line_number === null) {
      // Explicitly set to undefined if null is passed to clear it
      finding.line_number = undefined;
    }
    // If line_number is not in req.body at all, it remains unchanged.


    await finding.save();
    res.status(200).json(finding);
  } catch (error) {
    next(error);
  }
};

// Delete a finding by ID
export const deleteFinding = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ message: 'Invalid finding ID format.' });
      return;
    }
    const finding = await db.Finding.findByPk(id);
    if (!finding) {
      res.status(404).json({ message: 'Finding not found' });
      return;
    }
    await finding.destroy();
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

// Delete all findings for a specific file
export const deleteAllFindingsByFileId = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const fileId = parseInt(req.params.id, 10);
    if (isNaN(fileId)) {
      res.status(400).json({ message: 'Invalid file ID format.' });
      return;
    }

    console.log(`Deleting all findings for file ID: ${fileId}`);

    // Check if the file exists
    const file = await db.File.findByPk(fileId);
    if (!file) {
      console.log(`File with ID ${fileId} not found`);
      res.status(404).json({ message: `File with id ${fileId} not found.` });
      return;
    }

    console.log(`File found: ${file.file_name}`);

    // Count existing findings before deletion
    const existingFindingsCount = await db.Finding.count({
      where: {
        file_id: fileId
      }
    });

    console.log(`Found ${existingFindingsCount} findings to delete for file ID: ${fileId}`);

    // Delete all findings associated with the file_id
    const deletedCount = await db.Finding.destroy({
      where: {
        file_id: fileId
      }
    });

    console.log(`Successfully deleted ${deletedCount} findings for file ID: ${fileId}`);

    res.status(200).json({
      message: `Successfully deleted all findings for file: ${file.file_name}`,
      deletedCount: deletedCount,
      fileId: fileId,
      fileName: file.file_name
    });
  } catch (error) {
    console.error(`Error in deleteAllFindingsByFileId for file ID ${req.params.id}:`, error);
    next(error);
  }
};

// Get findings by file ID - Use code snippets to find related findings
export const getFindingsByFileId = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const fileId = parseInt(req.params.id, 10);
    if (isNaN(fileId)) {
      res.status(400).json({ message: 'Invalid file ID format.' });
      return;
    }

    console.log(`Getting findings for file ID: ${fileId}`);

    // Check if the file exists
    const file = await db.File.findByPk(fileId);
    if (!file) {
      console.log(`File with ID ${fileId} not found`);
      res.status(404).json({ message: `File with id ${fileId} not found.` });
      return;
    }

    console.log(`File found: ${file.file_name}`);

    // Check if the file has an md5 hash
    if (!file.md5) {
      console.log(`File has no md5 hash, returning empty findings array`);
      res.status(200).json([]);
      return;
    }

    console.log(`Looking for findings with md5 hash: ${file.md5}`);

    // Find all findings associated with the file_id
    const findings = await db.Finding.findAll({
      where: {
        file_id: fileId
      }
    });

    console.log(`Found ${findings.length} findings for file with md5: ${file.md5}`);

    res.status(200).json(findings);
  } catch (error) {
    console.error(`Error in getFindingsByFileId for file ID ${req.params.id}:`, error);
    next(error);
  }
};

// Get findings by project ID
export const getFindingsByProjectId = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectId = parseInt(req.params.id, 10);
    if (isNaN(projectId)) {
      res.status(400).json({ message: 'Invalid project ID format.' });
      return;
    }

    console.log(`Getting findings for project ID: ${projectId}`);

    // Check if the project exists
    const project = await db.Project.findByPk(projectId);
    if (!project) {
      console.log(`Project with ID ${projectId} not found`);
      res.status(404).json({ message: `Project with id ${projectId} not found.` });
      return;
    }

    // Get all files for the project
    const files = await db.File.findAll({
      where: {
        project_id: projectId
      }
    });

    if (files.length === 0) {
      console.log(`No files found for project ID ${projectId}`);
      res.status(200).json([]);
      return;
    }

    // Get the file IDs
    const fileIds = files.map((file: any) => file.id);

    // Find all findings associated with the project's files
    const findings = await db.Finding.findAll({
      where: {
        file_id: fileIds
      }
    });

    console.log(`Found ${findings.length} findings for project ID: ${projectId}`);
    res.status(200).json(findings);
  } catch (error) {
    console.error(`Error in getFindingsByProjectId for project ID ${req.params.id}:`, error);
    next(error);
  }
};

// Get summary of findings by project ID
export const getFindingsSummaryByProjectId = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectId = parseInt(req.params.id, 10);
    if (isNaN(projectId)) {
      res.status(400).json({ message: 'Invalid project ID format.' });
      return;
    }

    console.log(`Getting findings summary for project ID: ${projectId}`);

    // Check if the project exists
    const project = await db.Project.findByPk(projectId);
    if (!project) {
      console.log(`Project with ID ${projectId} not found`);
      res.status(404).json({ message: `Project with id ${projectId} not found.` });
      return;
    }

    // Get all files for the project
    const files = await db.File.findAll({
      where: {
        project_id: projectId
      }
    });

    if (files.length === 0) {
      console.log(`No files found for project ID ${projectId}`);
      // Return empty summary with zeros
      res.status(200).json({
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        total: 0
      });
      return;
    }

    // Get the file IDs
    const fileIds = files.map((file: any) => file.id);

    // Count findings by severity
    const criticalCount = await db.Finding.count({
      where: {
        file_id: {
          [Op.in]: fileIds
        },
        severity: 'critical'
      }
    });

    const highCount = await db.Finding.count({
      where: {
        file_id: {
          [Op.in]: fileIds
        },
        severity: 'high'
      }
    });

    const mediumCount = await db.Finding.count({
      where: {
        file_id: {
          [Op.in]: fileIds
        },
        severity: 'medium'
      }
    });

    const lowCount = await db.Finding.count({
      where: {
        file_id: {
          [Op.in]: fileIds
        },
        severity: 'low'
      }
    });

    const totalCount = criticalCount + highCount + mediumCount + lowCount;

    // Build summary object
    const summary = {
      critical: criticalCount,
      high: highCount,
      medium: mediumCount,
      low: lowCount,
      total: totalCount
    };

    console.log(`Findings summary for project ID ${projectId}:`, summary);
    res.status(200).json(summary);
  } catch (error) {
    console.error(`Error in getFindingsSummaryByProjectId for project ID ${req.params.id}:`, error);
    next(error);
  }
};

// Get trends of findings by project ID
export const getFindingsTrendsByProjectId = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectId = parseInt(req.params.id, 10);
    if (isNaN(projectId)) {
      res.status(400).json({ message: 'Invalid project ID format.' });
      return;
    }

    console.log(`Getting findings trends for project ID: ${projectId}`);

    // Check if the project exists
    const project = await db.Project.findByPk(projectId);
    if (!project) {
      console.log(`Project with ID ${projectId} not found`);
      res.status(404).json({ message: `Project with id ${projectId} not found.` });
      return;
    }
    
    // For now, we'll return some mock data to demonstrate the trend chart
    // In a real implementation, this would come from historical scans
    const today = new Date();
    
    // Generate dates for the last 7 days
    const dates = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(today);
      date.setDate(date.getDate() - (6 - i));
      return date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
    });
    
    // Generate mock trend data
    const trendData = dates.map((date, index) => {
      // Generate some variation in the findings counts
      // Later iterations would use real historical data
      return {
        date,
        critical: Math.max(0, Math.floor(Math.random() * 3) + (index === 6 ? 2 : 0)),
        high: Math.floor(Math.random() * 5) + (index === 6 ? 3 : 1),
        medium: Math.floor(Math.random() * 8) + (index === 6 ? 5 : 2),
        low: Math.floor(Math.random() * 10) + (index === 6 ? 7 : 3)
      };
    });
    
    console.log(`Generated trend data for project ID ${projectId}`);
    res.status(200).json(trendData);
  } catch (error) {
    console.error(`Error in getFindingsTrendsByProjectId for project ID ${req.params.id}:`, error);
    next(error);
  }
};
