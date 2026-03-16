import path from 'path';

export function isPathAllowed(targetPath: string, allowedDirs: string[] | null): boolean {
  if (!allowedDirs || allowedDirs.length === 0) {
    return true;
  }

  const resolvedTarget = path.resolve(targetPath);
  return allowedDirs.some((dir) => {
    const resolvedDir = path.resolve(dir);
    const rel = path.relative(resolvedDir, resolvedTarget);
    return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
  });
}
