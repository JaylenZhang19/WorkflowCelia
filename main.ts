import fs from 'fs';
import path from 'path';
import { loadProjectConfig } from './src/config/loadConfig';
import { ProjectContext } from './src/env/ProjectContext';
import { AgentCore } from './src/agent/AgentCore';
import { logger } from './src/utils';

function parseArgs(argv: string[]): { configPath: string; input: string } {
  let configPath = process.env.PROJECT_CONFIG || 'config.json';
  const rest: string[] = [];

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--config' && argv[i + 1]) {
      configPath = argv[++i];
      continue;
    }
    rest.push(arg);
  }

  return { configPath, input: rest.join(' ').trim() };
}

async function main(): Promise<void> {
  const { configPath, input } = parseArgs(process.argv.slice(2));
  const absConfigPath = path.resolve(configPath);

  if (!fs.existsSync(absConfigPath)) {
    throw new Error(
      `Config not found: ${absConfigPath}\n` +
      `Create one by copying 'config.example.json' to 'config.json', then fill in apiUrl/apiKey/modelName.`
    );
  }

  const config = loadProjectConfig(absConfigPath);
  ProjectContext.init({ projectRoot: process.cwd(), configPath: absConfigPath, config });

  fs.mkdirSync(ProjectContext.getInstance().paths.agentWorkDir, { recursive: true });

  if (!input) {
    logger.info('Main', `Loaded config: ${ProjectContext.getInstance().paths.configPath}`);
    logger.info('Main', `Agent workDir: ${ProjectContext.getInstance().paths.agentWorkDir}`);
    console.log('Usage:');
    console.log('  node dist/main.js --config config.json "你的问题"');
    console.log('  # or (dev)');
    console.log('  npx tsx main.ts --config config.json "你的问题"');
    return;
  }

  const ctx = ProjectContext.getInstance();
  const agent = new AgentCore(ctx.paths.agentWorkDir);
  const result = await agent.run(input, undefined, ctx.config.agent.maxSteps ?? 20);
  process.stdout.write(result + '\n');
}

main().catch((e) => {
  const message = e instanceof Error ? e.message : String(e);
  console.error(message);
  process.exitCode = 1;
});
