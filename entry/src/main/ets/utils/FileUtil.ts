import { ProjectContext, detectRuntime, RuntimeEnv } from '../env/ProjectContext';
import type { FileUtilAdapter } from './FileUtilAdapter';

function resolveRuntime(): RuntimeEnv {
  const ctx = ProjectContext.getInstanceOptional();
  return ctx?.runtime ?? detectRuntime();
}

export class FileUtil {
  private static adapter: FileUtilAdapter | null = null;
  private static adapterRuntime: RuntimeEnv | null = null;

  private static async getAdapter(): Promise<FileUtilAdapter> {
    const runtime = resolveRuntime();
    if (this.adapter && this.adapterRuntime === runtime) {
      return this.adapter;
    }
    this.adapterRuntime = runtime;

    if (runtime === 'harmony') {
      const mod: any = await import('./harmonyutils/FileUtilHarmony');
      this.adapter = await mod.HarmonyFileUtilAdapter.create();
      return this.adapter;
    }

    const mod: any = await import('./nodeutils/FileUtilNode');
    this.adapter = await mod.NodeFileUtilAdapter.create();
    return this.adapter;
}

  static async writeTextFile(filePath: string, content: string): Promise<void> {
    const adapter = await this.getAdapter();
    return adapter.writeTextFile(filePath, content);
  }

  static async readTextFile(filePath: string): Promise<string> {
    const adapter = await this.getAdapter();
    return adapter.readTextFile(filePath);
  }

  static async exists(path: string): Promise<boolean> {
    const adapter = await this.getAdapter();
    return adapter.exists(path);
  }

  static async isFile(path: string): Promise<boolean> {
    const adapter = await this.getAdapter();
    return adapter.isFile(path);
  }

  static async isDirectory(path: string): Promise<boolean> {
    const adapter = await this.getAdapter();
    return adapter.isDirectory(path);
  }

  static async mkdirp(path: string): Promise<void> {
    const adapter = await this.getAdapter();
    return adapter.mkdirp(path);
  }

  static async listDir(path: string): Promise<string[]> {
    const adapter = await this.getAdapter();
    return adapter.listDir(path);
  }
}
