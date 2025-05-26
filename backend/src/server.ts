import { server } from './app';
import { sequelize } from './models'; // To be created later
import config from './config/config';

const PORT = 8001; // Fixed port for consistency with Docker mappings

const startServer = async () => {
  try {
    // await sequelize.sync({ alter: true }); // Sync database models. Use { force: true } to drop and recreate tables.
    // console.log('Database synced successfully.'); // To be uncommented once models are set up

    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`WebSocket server is running on ws://localhost:${PORT}${config.websocket.path}`);
    });
  } catch (error) {
    console.error('Unable to connect to the database or start server:', error);
    process.exit(1); // Exit process with failure
  }
};

startServer();