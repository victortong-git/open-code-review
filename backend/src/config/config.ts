
interface Config {
  server: {
    port: number;
    host: string;
  };
  database: {
    host: string;
    port: number;
    name: string;
    user: string;
    password: string;
  };
  aiqToolkit: {
    baseUrl: string;
    timeout: number;
  };
  nemoAgentToolkit: {
    baseUrl: string;
    timeout: number;
  };
  websocket: {
    path: string;
    pingInterval: number;
  };
  security: {
    jwtSecret: string;
    jwtExpiresIn: string;
  };
  logging: {
    level: string;
    file: string;
  };
}

const config: Config = {
  server: {
    port: parseInt(process.env.PORT || '8001', 10),
    host: process.env.HOST || 'localhost',
  },
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    name: process.env.DB_NAME || 'code_review',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  },
  aiqToolkit: {
    baseUrl: process.env.AIQ_TOOLKIT_URL || 'http://aiqtoolkit:8000',
    timeout: parseInt(process.env.AIQ_TOOLKIT_TIMEOUT || '30000', 10),
  },
  nemoAgentToolkit: {
    baseUrl: process.env.NEMO_AGENT_TOOLKIT_URL || 'http://nvidia-nat:8000',
    timeout: parseInt(process.env.NEMO_AGENT_TOOLKIT_TIMEOUT || '300000', 10),
  },
  websocket: {
    path: '/ws',
    pingInterval: 30000, // 30 seconds
  },
  security: {
    jwtSecret: process.env.JWT_SECRET || 'dev-secret-key',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || '/docker/review-ui/logs/backend.log',
  },
};

export default config;
