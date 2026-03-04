import { SkillDefinition } from './types';

export class SkillRegistry {
  private readonly skills: SkillDefinition[] = [
    {
      id: 'file_ops',
      name: 'FileOps',
      description: '处理文件查看相关请求',
      keywords: ['file', '文件', '目录', 'list', 'ls', 'path'],
      allowedTools: [{ namespace: 'File', name: 'listFile' }]
    },
    {
      id: 'calendar_ops',
      name: 'CalendarOps',
      description: '处理日历查询请求',
      keywords: ['calendar', '日历', 'schedule', '会议', 'event'],
      allowedTools: [{ namespace: 'Calendar', name: 'getEvents' }]
    },
    {
      id: 'contact_ops',
      name: 'ContactOps',
      description: '处理联系人查询请求',
      keywords: ['contact', '联系人', 'phonebook'],
      allowedTools: [{ namespace: 'Contact', name: 'queryContact' }]
    },
    {
      id: 'general',
      name: 'General',
      description: '通用问答和澄清',
      keywords: [],
      allowedTools: []
    }
  ];

  resolveSkill(input: string): SkillDefinition {
    const lowerInput = input.toLowerCase();
    for (const skill of this.skills) {
      if (skill.id === 'general') {
        continue;
      }
      for (const keyword of skill.keywords) {
        if (lowerInput.includes(keyword)) {
          return skill;
        }
      }
    }
    return this.skills[this.skills.length - 1];
  }
}

