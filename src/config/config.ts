import path from 'path';
import { fileURLToPath } from 'url';

export function getConfig() {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const projectRoot = path.resolve(__dirname, '../../');

  let baseDir: string;

  if (process.env.MCP_RESOURCES_DIR) {
    baseDir = path.isAbsolute(process.env.MCP_RESOURCES_DIR)
      ? process.env.MCP_RESOURCES_DIR
      : path.resolve(process.cwd(), process.env.MCP_RESOURCES_DIR);
  } else {
    baseDir = path.join(projectRoot, 'resources');
  }

  return {
    baseDir,
  };
}
