import { Request, Response } from 'express';
import * as codeSnippetController from './codeSnippetController';
import { db } from '../models';

// Mock dependencies
jest.mock('../models', () => {
  const mockCodeSnippet = {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
  };
  const mockFile = {
    findByPk: jest.fn(),
  };
  return {
    db: {
      CodeSnippet: mockCodeSnippet,
      File: mockFile,
    },
  };
});

describe('CodeSnippetController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn(),
    };
    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllCodeSnippets', () => {
    it('should return all code snippets', async () => {
      const mockSnippets = [{ id: 1, code: 'test code' }];
      mockRequest.query = {};
      (db.CodeSnippet.findAll as jest.Mock).mockResolvedValue(mockSnippets);

      await codeSnippetController.getAllCodeSnippets(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(db.CodeSnippet.findAll).toHaveBeenCalledWith({ where: {} });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockSnippets);
    });

    it('should filter by fileId if provided', async () => {
      const mockSnippets = [{ id: 1, code: 'test code' }];
      mockRequest.query = { fileId: '1' };
      (db.CodeSnippet.findAll as jest.Mock).mockResolvedValue(mockSnippets);

      await codeSnippetController.getAllCodeSnippets(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(db.CodeSnippet.findAll).toHaveBeenCalledWith({ where: { file_id: 1 } });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockSnippets);
    });

    it('should handle invalid fileId', async () => {
      mockRequest.query = { fileId: 'invalid' };

      await codeSnippetController.getAllCodeSnippets(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Invalid fileId format.' });
    });
  });

  // Add more tests for other controller methods
});
