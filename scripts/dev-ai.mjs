import { spawn } from 'node:child_process';
import { createAIService } from '../server/ai-service.mjs';
const server = createAIService();
server.listen(5276, '127.0.0.1', () => {
  process.stdout.write(
    'First Thread local AI service ready. API keys stay in this process.\n',
  );
  const child = spawn(
    process.execPath,
    [
      'node_modules/vite/bin/vite.js',
      '--config',
      'vite.pages.config.ts',
      '--host',
      '127.0.0.1',
      '--port',
      '5274',
      '--strictPort',
    ],
    { stdio: 'inherit', env: { ...process.env, FIRST_THREAD_AI: '1' } },
  );
  const stop = () => {
    child.kill('SIGTERM');
    server.close();
  };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
  child.on('exit', () => server.close());
});
server.on('error', (error) => {
  process.stderr.write(`Could not start local AI service: ${error.message}\n`);
  process.exitCode = 1;
});
