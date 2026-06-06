require('./config/loadEnv');
const { validateEnv } = require('./config/validateEnv');
const http = require('http');
const { app, initDatabase } = require('./app');
const socketService = require('./services/socketService');
const { startScheduler, stopScheduler } = require('./services/schedulerService');
const { getSocketCorsOrigin } = require('./config/corsConfig');

validateEnv();

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
});

const PORT = process.env.PORT || 3000;
const server = http.createServer(app);

async function start() {
  try {
    await initDatabase();
    console.log('Datenbank verbunden und synchronisiert.');

    const { ensureBootstrapAdmin } = require('./services/bootstrapAdminService');
    await ensureBootstrapAdmin();

    socketService.init(server, { corsOrigin: getSocketCorsOrigin() });
    startScheduler();

    server.listen(PORT, () => {
      console.log(`WM 2026 Tippspiel v2.5 – Server läuft auf http://localhost:${PORT}`);
    });

    const shutdown = () => {
      stopScheduler();
      server.close(() => process.exit(0));
    };
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    console.error('Serverstart fehlgeschlagen:', error);
    process.exit(1);
  }
}

start();
