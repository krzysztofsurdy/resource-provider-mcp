import path from 'path';
import { fileURLToPath } from 'url';

export function getConfig() {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const projectRoot = path.resolve(__dirname, '../../');
  return {
    baseDir: process.env.MCP_RESOURCES_DIR
      ? path.resolve(process.env.MCP_RESOURCES_DIR)
      : path.join(projectRoot, 'resources'),
  };
}
