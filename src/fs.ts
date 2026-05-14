import { promises as fs } from 'node:fs';
import path from 'node:path';

const DEFAULT_IGNORES = new Set(['.git', 'node_modules', 'dist', 'coverage', '.next', '.turbo']);

export interface TextFile {
  absolutePath: string;
  relativePath: string;
  text: string;
}

export async function pathExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function readTextFile(absolutePath: string, root: string): Promise<TextFile> {
  return {
    absolutePath,
    relativePath: path.relative(root, absolutePath) || path.basename(absolutePath),
    text: await fs.readFile(absolutePath, 'utf8')
  };
}

export async function walkProject(root: string): Promise<TextFile[]> {
  const files: TextFile[] = [];

  async function visit(directory: string): Promise<void> {
    const entries = await fs.readdir(directory, { withFileTypes: true });
    for (const entry of entries) {
      if (DEFAULT_IGNORES.has(entry.name)) continue;
      const absolutePath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        await visit(absolutePath);
        continue;
      }
      if (!entry.isFile() || !isInterestingFile(entry.name)) continue;
      files.push(await readTextFile(absolutePath, root));
    }
  }

  await visit(root);
  return files.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
}

function isInterestingFile(name: string): boolean {
  if (name === 'package.json') return true;
  if (name.startsWith('.env')) return true;
  if (/docker-compose.*\.(ya?ml|json)$/i.test(name)) return true;
  if (/compose\.(ya?ml|json)$/i.test(name)) return true;
  return /\.(md|mdx|txt|ya?ml|json|toml|ini|conf|config|js|ts|mjs|cjs)$/i.test(name);
}

export function lineAndColumn(text: string, index: number): { line: number; column: number } {
  const before = text.slice(0, index);
  const lines = before.split('\n');
  return { line: lines.length, column: (lines.at(-1)?.length ?? 0) + 1 };
}
