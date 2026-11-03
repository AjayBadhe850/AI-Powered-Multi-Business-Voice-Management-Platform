import 'dotenv/config';
import app from './app.js';
import prisma from './config/db.js';

const PORT = process.env.PORT || 5000;

// Handle transient connection drops without crashing the server process
process.on('unhandledRejection', (reason) => {
  console.warn('Unhandled Rejection (handled safely):', reason?.message || reason);
});

process.on('uncaughtException', (err) => {
  console.warn('Uncaught Exception (handled safely):', err?.message || err);
});

async function startServer() {
  try {
    // Verify DB connectivity
    await prisma.$connect();
    console.log('PostgreSQL database connection established successfully.');

    app.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(` Multi-Business Voice Management Platform Backend API`);
      console.log(` Running on port: http://localhost:${PORT}`);
      console.log(` Health check:    http://localhost:${PORT}/api/health`);
      console.log(`=======================================================`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();

