import fs from 'fs';
import path from 'path';
import * as readline from 'readline';
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

  const ctx = ProjectContext.getInstance();
  const agent = new AgentCore(ctx.paths.agentWorkDir);

  if (!input) {
    logger.info('Main', `Loaded config: ${ProjectContext.getInstance().paths.configPath}`);
    logger.info('Main', `Agent workDir: ${ProjectContext.getInstance().paths.agentWorkDir}`);
    console.log('Entering interactive REPL mode. Type "exit" or "quit" to stop.');
    console.log('Heartbeat scheduler initialized in background.\n');
    
    agent.startHeartbeat();

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: 'Agent> '
    });

    rl.prompt();

    rl.on('line', (line) => {
      const trimmed = line.trim();
      if (trimmed.toLowerCase() === 'exit' || trimmed.toLowerCase() === 'quit') {
        agent.stopHeartbeat();
        rl.close();
        return;
      }
      if (trimmed) {
        agent.submitTask(trimmed, undefined, ctx.config.agent.maxSteps ?? 20)
             .then(res => { console.log(`\n✅ 结果: ${res}\n`); rl.prompt(); })
             .catch(err => { console.error(`\n❌ 报错: ${err}\n`); rl.prompt(); });
      } else {
        rl.prompt();
      }
    });

    rl.on('close', () => {
      console.log('Goodbye!');
      process.exit(0);
    });
    return;
  }

  const result = await agent.submitTask(input, undefined, ctx.config.agent.maxSteps ?? 20);
  process.stdout.write(result + '\n');
}

main().catch((e) => {
  const message = e instanceof Error ? e.message : String(e);
  console.error(message);
  process.exitCode = 1;
});
