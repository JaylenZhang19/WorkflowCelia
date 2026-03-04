import { SkillDefinition } from './types';

export interface ParsedSkillDocument extends SkillDefinition {
  compatibility?: string;
  license?: string;
  metadata?: Record<string, string>;
  instructions: string;
}

interface FrontmatterData {
  name?: string;
  description?: string;
  compatibility?: string;
  license?: string;
  metadata?: Record<string, string>;
  allowedTools?: string;
}

export class SkillSpec {
  static parseSkillMarkdown(directoryName: string, content: string): ParsedSkillDocument {
    const { frontmatter, body } = this.extractFrontmatter(content);
    const frontmatterData = this.parseFrontmatter(frontmatter);
    const skillName = (frontmatterData.name ?? '').trim();
    const description = (frontmatterData.description ?? '').trim();

    this.validateSkillName(skillName, directoryName);
    this.validateDescription(description);

    return {
      id: skillName,
      name: skillName,
      description,
      keywords: this.extractKeywords(description),
      allowedTools: this.parseAllowedTools(frontmatterData.allowedTools),
      compatibility: frontmatterData.compatibility?.trim(),
      license: frontmatterData.license?.trim(),
      metadata: frontmatterData.metadata,
      instructions: body.trim()
    };
  }

  private static extractFrontmatter(content: string): { frontmatter: string; body: string } {
    const trimmed = content.trimStart();
    if (!trimmed.startsWith('---')) {
      throw new Error('Invalid SKILL.md: missing YAML frontmatter.');
    }

    const lines = trimmed.split('\n');
    let endIndex = -1;
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim() === '---') {
        endIndex = i;
        break;
      }
    }

    if (endIndex <= 0) {
      throw new Error('Invalid SKILL.md: unclosed YAML frontmatter.');
    }

    const frontmatter = lines.slice(1, endIndex).join('\n');
    const body = lines.slice(endIndex + 1).join('\n');
    return { frontmatter, body };
  }

  private static parseFrontmatter(frontmatter: string): FrontmatterData {
    const result: FrontmatterData = {};
    const lines = frontmatter.split('\n');
    let inMetadata = false;
    let metadataIndent = 0;
    const metadata: Record<string, string> = {};

    for (const raw of lines) {
      const line = raw.replace(/\r/g, '');
      if (!line.trim()) {
        continue;
      }

      if (inMetadata) {
        const indent = line.search(/\S|$/);
        if (indent <= metadataIndent || !line.includes(':')) {
          inMetadata = false;
        } else {
          const [k, ...vParts] = line.trim().split(':');
          metadata[k.trim()] = vParts.join(':').trim().replace(/^['"]|['"]$/g, '');
          continue;
        }
      }

      const [keyRaw, ...valueParts] = line.split(':');
      const key = keyRaw.trim();
      const value = valueParts.join(':').trim().replace(/^['"]|['"]$/g, '');
      if (!key) {
        continue;
      }

      if (key === 'metadata') {
        inMetadata = true;
        metadataIndent = line.search(/\S|$/);
        continue;
      }
      if (key === 'name') {
        result.name = value;
      } else if (key === 'description') {
        result.description = value;
      } else if (key === 'compatibility') {
        result.compatibility = value;
      } else if (key === 'license') {
        result.license = value;
      } else if (key === 'allowed-tools') {
        result.allowedTools = value;
      }
    }

    if (Object.keys(metadata).length > 0) {
      result.metadata = metadata;
    }
    return result;
  }

  private static validateSkillName(name: string, directoryName: string): void {
    if (!name || name.length > 64) {
      throw new Error('Invalid skill name: must be 1-64 characters.');
    }
    const valid = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name);
    if (!valid) {
      throw new Error('Invalid skill name: use lowercase letters, numbers, and hyphens only.');
    }
    if (name !== directoryName) {
      throw new Error(`Invalid skill name: "${name}" must match directory "${directoryName}".`);
    }
  }

  private static validateDescription(description: string): void {
    if (!description || description.length > 1024) {
      throw new Error('Invalid skill description: must be 1-1024 characters.');
    }
  }

  private static parseAllowedTools(raw?: string): Array<{ namespace: string; name: string }> {
    if (!raw || !raw.trim()) {
      return [];
    }
    const tokens = raw
      .split(/\s+/)
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    const tools: Array<{ namespace: string; name: string }> = [];
    for (const token of tokens) {
      const matched = token.match(/^([A-Za-z0-9_-]+)\(([A-Za-z0-9_-]+):([A-Za-z0-9_*.-]+)\)$/);
      if (matched) {
        const namespace = matched[2];
        const name = matched[3];
        if (name.includes('*')) {
          continue;
        }
        tools.push({ namespace, name });
        continue;
      }
      if (token.includes('.')) {
        const [namespace, name] = token.split('.');
        if (namespace && name && !name.includes('*')) {
          tools.push({ namespace, name });
        }
      }
    }
    return tools;
  }

  private static extractKeywords(description: string): string[] {
    const cleaned = description.toLowerCase();
    const tokens = cleaned
      .split(/[^a-z0-9\u4e00-\u9fa5]+/g)
      .map((t) => t.trim())
      .filter((t) => t.length >= 2);
    return [...new Set(tokens)].slice(0, 30);
  }
}

