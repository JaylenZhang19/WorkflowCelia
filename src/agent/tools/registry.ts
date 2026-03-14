import { Tool } from './BaseTool';
import { ReadFileTool, WriteFileTool, EditFileTool, ListDirTool } from './FileTool';
import { FinishTool } from './FinishTool';

export interface ToolFactoryContext {
  workspace: string | null;
  allowedDir: string | null;
}

export type ToolFactory = (ctx: ToolFactoryContext) => Tool;

export const TOOL_REGISTRY: Record<string, ToolFactory> = {
  read_file: (ctx) => new ReadFileTool(ctx.workspace, ctx.allowedDir),
  write_file: (ctx) => new WriteFileTool(ctx.workspace, ctx.allowedDir),
  edit_file: (ctx) => new EditFileTool(ctx.workspace, ctx.allowedDir),
  list_dir: (ctx) => new ListDirTool(ctx.workspace, ctx.allowedDir),
  finish: () => new FinishTool()
};
