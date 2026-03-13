import fs from '@ohos.file.fs';
import { BusinessError } from '@ohos.base';

/**
 * 技能元信息
 */
export class SkillMetadata {
  name: string;
  description: string;
  trigger: string;
  category: string;

  constructor(name: string, description: string, trigger: string = "", category: string = "") {
    this.name = name;
    this.description = description;
    this.trigger = trigger;
    this.category = category;
  }

  toDict(): Record<string, string> {
    return {
      "name": this.name,
      "description": this.description,
      "trigger": this.trigger,
      "category": this.category
    };
  }
}

/**
 * 技能加载器 - 适配 HarmonyOS 沙箱文件系统
 */
export class SkillLoader {
  private skillsDir: string;
  public skillMetadata: Map<string, SkillMetadata> = new Map();
  public skillFullDocs: Map<string, string> = new Map();

  constructor(skillsDir: string) {
    this.skillsDir = skillsDir;
  }

  /**
   * 加载所有技能
   */
  public async loadAllSkills(): Promise<void> {
    console.info(`[SkillLoader] 正在从 ${this.skillsDir} 加载技能...`);

    try {
      if (!fs.accessSync(this.skillsDir)) {
        console.warn(`[SkillLoader] 技能目录不存在: ${this.skillsDir}`);
        return;
      }

      let filenames = fs.listFileSync(this.skillsDir);
      for (let skillFolderName of filenames) {
        let skillFolderPath = `${this.skillsDir}/${skillFolderName}`;

        // 检查是否为目录
        let stat = fs.statSync(skillFolderPath);
        if (!stat.isDirectory()) continue;

        let skillDocPath = `${skillFolderPath}/SKILL.md`;
        if (!fs.accessSync(skillDocPath)) {
          console.warn(`[SkillLoader] 跳过 ${skillFolderName}: 缺少 SKILL.md`);
          continue;
        }

        try {
          // 读取文件内容
          let content = fs.readTextSync(skillDocPath);

          // 提取元数据
          let metadata = this.extractMetadata(skillFolderName, content);
          this.skillMetadata.set(skillFolderName, metadata);
          this.skillFullDocs.set(skillFolderName, content);

          // 检查 scripts 目录 (鸿蒙环境下仅做存在性检查，通常无法直接运行 py 脚本)
          let scriptsPath = `${skillFolderPath}/scripts`;
          let hasScripts = false;
          if (fs.accessSync(scriptsPath)) {
            let scripts = fs.listFileSync(scriptsPath);
            hasScripts = scripts.length > 0;
          }

          let label = hasScripts ? "文档 + 脚本" : "纯文档";
          console.info(`[SkillLoader] 已加载技能: ${skillFolderName} (${label})`);
        } catch (e) {
          let err = e as BusinessError;
          console.error(`[SkillLoader] 加载 ${skillFolderName} 失败: ${err.message}`);
          this.skillMetadata.set(skillFolderName, new SkillMetadata(
            skillFolderName,
            `技能: ${skillFolderName}（加载失败）`
          ));
        }
      }
      console.info(`[SkillLoader] 共加载 ${this.skillMetadata.size} 个技能`);
    } catch (e) {
      console.error(`[SkillLoader] 目录遍历失败: ${JSON.stringify(e)}`);
    }
  }

  /**
   * 从 SKILL.md 中提取元信息 (正则表达式适配)
   */
  private extractMetadata(skillName: string, content: string): SkillMetadata {
    let metadataObj: Record<string, string> = {
      "name": skillName,
      "description": "",
      "trigger": "",
      "category": ""
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
      metadataObj["category"]
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
}