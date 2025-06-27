import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import mainRouter from './routes';
import WebSocket from 'ws';
import http from 'http';
import { setupWebSocketHandlers } from './controllers/analysisController';
import config from './config/config';

dotenv.config();

const app: Application = express();
const server = http.createServer(app);

// Create WebSocket server
const wss = new WebSocket.Server({
  server,
  path: config.websocket.path
});

// Configure CORS with specific options
const corsOptions = {
  origin: '*', // In production, you should restrict this to your frontend domain
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

// Middlewares
app.use(cors(corsOptions)); // Enable CORS with configured options
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Apply rate limiting to all requests
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
app.use(limiter);

// Log requests for debugging
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Basic Route for testing
app.get('/', (req: Request, res: Response) => {
  res.send('Backend server is running!');
});

// API Routes
app.use('/api', mainRouter);

// Set up WebSocket handlers for analysis updates
setupWebSocketHandlers(wss);

// WebSocket connection handling
wss.on('connection', (ws: WebSocket) => {
  console.log('WebSocket client connected');
  
  // Send a welcome message
  ws.send(JSON.stringify({
    type: 'connection_established',
    message: 'Connected to Code Review WebSocket Server',
    timestamp: new Date().toISOString()
  }));
  
  // Set up ping-pong to keep the connection alive
  const pingInterval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.ping();
    }
  }, config.websocket.pingInterval);
  
  // Handle client messages
  ws.on('message', (message: string) => {
    try {
      const data = JSON.parse(message);
      console.log('Received message:', data);
      
      // Handle different message types here if needed
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  });
  
  // Handle connection close
  ws.on('close', () => {
    console.log('WebSocket client disconnected');
    clearInterval(pingInterval);
  });
  
  // Handle errors
  ws.on('error', (error: Error) => {
    console.error('WebSocket error:', error);
  });
});

// Error Handling Middleware (Example)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Export both the Express app and HTTP server
export { app, server };