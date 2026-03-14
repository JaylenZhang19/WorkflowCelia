import fs from 'fs';
import path from 'path';
import { logger } from '../utils/Logger';

/**
 * 技能元信息
 */
export class SkillMetadata {
  name: string;
  description: string;
  trigger: string;
  category: string;
  location: string;

  constructor(
    name: string,
    description: string,
    trigger: string = "",
    category: string = "",
    location: string = ""
  ) {
    this.name = name;
    this.description = description;
    this.trigger = trigger;
    this.category = category;
    this.location = location;
  }

  toDict(): Record<string, string> {
    return {
      "name": this.name,
      "description": this.description,
      "trigger": this.trigger,
      "category": this.category,
      "location": this.location
    };
  }
}

const TAG: string = 'SkillLoader';

/**
 * 技能加载器 - 适配 HarmonyOS 沙箱文件系统
 */
export class SkillLoader {
  private skillsDir: string;
  public skillMetadata: Map<string, SkillMetadata> = new Map();
  public skillFullDocs: Map<string, string> = new Map();

  constructor(skillsDir: string) {
    logger.info(TAG, `skillDir: ${skillsDir}`);
    this.skillsDir = skillsDir;
  }

  /**
   * 加载所有技能
   */
  public async loadAllSkills(): Promise<void> {
    logger.info(TAG, `[SkillLoader] 正在从 ${this.skillsDir} 加载技能...`);

    try {
      if (!fs.existsSync(this.skillsDir)) {
        logger.warn(TAG, `[SkillLoader] 技能目录不存在: ${this.skillsDir}`);
        return;
      }

      const entries = fs.readdirSync(this.skillsDir, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        const skillFolderName = entry.name;
        const skillFolderPath = path.join(this.skillsDir, skillFolderName);

        const skillDocPath = path.join(skillFolderPath, 'SKILL.md');
        if (!fs.existsSync(skillDocPath)) {
          logger.warn(TAG, `[SkillLoader] 跳过 ${skillFolderName}: 缺少 SKILL.md`);
          continue;
        }

        try {
          // 读取文件内容
          const content: string = fs.readFileSync(skillDocPath, 'utf-8');

          // 提取元数据
          let metadata = this.extractMetadata(skillFolderName, content, skillDocPath);
          this.skillMetadata.set(skillFolderName, metadata);
          this.skillFullDocs.set(skillFolderName, content);

          // 检查 scripts 目录
          let scriptsPath = path.join(skillFolderPath, 'scripts');
          let hasScripts = false;
          if (fs.existsSync(scriptsPath)) {
            const scripts = fs.readdirSync(scriptsPath);
            hasScripts = scripts.length > 0;
          }

          let label = hasScripts ? "文档 + 脚本" : "纯文档";
          logger.info(TAG, `[SkillLoader] 已加载技能: ${skillFolderName} (${label})`);
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          logger.error(TAG, `[SkillLoader] 加载 ${skillFolderName} 失败: ${msg}`);
          this.skillMetadata.set(skillFolderName, new SkillMetadata(
            skillFolderName,
            `技能: ${skillFolderName}（加载失败）`
          ));
        }
      }
      logger.info(TAG, `[SkillLoader] 共加载 ${this.skillMetadata.size} 个技能`);
    } catch (e) {
      logger.error(TAG, `[SkillLoader] 目录遍历失败: ${JSON.stringify(e)}`);
    }
  }

  /**
   * 从 SKILL.md 中提取元信息 (正则表达式适配)
   */
  private extractMetadata(skillName: string, content: string, skillMdPath: string): SkillMetadata {
    let metadataObj: Record<string, string> = {
      "name": skillName,
      "description": "",
      "trigger": "",
      "category": "",
      "location": skillMdPath
    };

    // 匹配 YAML Front Matter (--- ... ---)
    const yamlRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/;
    const match = content.match(yamlRegex);

    if (match) {
      let yamlContent = match[1];
      let lines = yamlContent.split('\n');
      for (let line of lines) {
        if (line.includes(':')) {
          let parts = line.split(':');
          let key = parts[0].trim();
          let value = parts.slice(1).join(':').trim().replace(/^['"]|['"]$/g, '');

          if (metadataObj.hasOwnProperty(key)) {
            metadataObj[key] = value;
          }
        }
      }
    }

    // 如果没有描述，提取第一段文字
    if (!metadataObj["description"]) {
      let cleanContent = content.replace(yamlRegex, '');
      let paragraphs = cleanContent.trim().split('\n\n');
      let firstPara = paragraphs[0].replace(/^#+\s*/, '').trim();
      metadataObj["description"] = firstPara.substring(0, 200);
    }

    return new SkillMetadata(
      metadataObj["name"],
      metadataObj["description"],
      metadataObj["trigger"],
      metadataObj["category"],
      metadataObj["location"]
    );
  }

  /**
   * 获取元信息摘要 JSON 字符串
   */
  public getMetadataSummary(): string {
    let summary: Record<string, Object> = {};
    this.skillMetadata.forEach((meta, name) => {
      summary[name] = {
        "description": meta.description,
        "trigger": meta.description // 保持与原 Python 逻辑一致，此处 trigger 取的是 description
      };
    });
    return JSON.stringify(summary, null, 2);
  }

  public getSkillPrompt(): string {
    const skillBlocks = Array.from(this.skillMetadata.values()).map(skill => {
      return `
      <skill>
        <name>${skill.name}</name>
        <description>${skill.description}</description>
        <location>${skill.location}</location>
      </skill>`
    });
    return `<available_skills>
    ${skillBlocks.join("\n")}
    <\available_skills>`;
  }
}
