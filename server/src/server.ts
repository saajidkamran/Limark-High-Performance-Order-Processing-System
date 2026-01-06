import { buildApp } from './app';

const start = async () => {
  const app = buildApp();

  const port = parseInt(process.env.PORT || '3002', 10);
  const host = process.env.HOST || '0.0.0.0';

  try {
    await app.listen({ port, host });
    console.log(`🚀 Server running on http://${host}:${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
