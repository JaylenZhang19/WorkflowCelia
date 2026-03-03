import { AbilityCategory, CapabilityDataType, MockProviderToolCapability, QueryMessage } from "../AbilityTypes";


export const MOCK_PROVIDER_TOOLS: MockProviderToolCapability[] = [
  {
    id: "calendar.addEvent",
    namespace: "Calendar",
    name: "addEvent",
    displayName: "新增日历事件",
    description: "调用 CalendarKit 创建日历事件",
    version: "1.0.0",
    category: AbilityCategory.CALENDAR,
    inputs: [
      { name: "title", type: CapabilityDataType.STRING, required: true, description: "事件标题" },
      { name: "startTime", type: CapabilityDataType.NUMBER, required: true, description: "开始时间戳（毫秒）" },
      { name: "endTime", type: CapabilityDataType.NUMBER, required: true, description: "结束时间戳（毫秒）" },
      { name: "description", type: CapabilityDataType.STRING, required: false, description: "备注描述" },
      { name: "isAllDay", type: CapabilityDataType.BOOLEAN, required: false, description: "是否全天事件" },
      { name: "location", type: CapabilityDataType.STRING, required: false, description: "地点" }
    ],
    outputs: [
      { name: "id", type: CapabilityDataType.NUMBER, required: true, description: "新增事件 ID" }
    ],
    tags: ["calendar", "create", "event"]
  },
  {
    id: "calendar.deleteEvent",
    namespace: "Calendar",
    name: "deleteEvent",
    displayName: "删除日历事件",
    description: "按事件 ID 删除日历事件",
    version: "1.0.0",
    category: AbilityCategory.CALENDAR,
    inputs: [
      { name: "id", type: CapabilityDataType.NUMBER, required: true, description: "事件 ID" }
    ],
    outputs: [
      { name: "id", type: CapabilityDataType.NUMBER, required: true, description: "已删除事件 ID" }
    ],
    tags: ["calendar", "delete", "event"]
  },
  {
    id: "calendar.getEvents",
    namespace: "Calendar",
    name: "getEvents",
    displayName: "查询日历事件",
    description: "查询当前日历中的事件列表",
    version: "1.0.0",
    category: AbilityCategory.CALENDAR,
    inputs: [],
    outputs: [
      { name: "events", type: CapabilityDataType.ARRAY, required: true, description: "事件列表" }
    ],
    tags: ["calendar", "query", "event"]
  },
  {
    id: "camera.pick",
    namespace: "Camera",
    name: "pick",
    displayName: "拉起相机拍摄",
    description: "拉起系统相机选择器，支持拍照或录像并返回 URI",
    version: "1.0.0",
    category: AbilityCategory.MEDIA,
    inputs: [
      { name: "type", type: CapabilityDataType.STRING, required: false, description: "PHOTO | VIDEO | BOTH，默认 BOTH" },
      { name: "cameraPosition", type: CapabilityDataType.STRING, required: false, description: "FRONT | BACK，默认 BACK" }
    ],
    outputs: [
      { name: "resultCode", type: CapabilityDataType.NUMBER, required: true, description: "选择器结果码，0 为成功" },
      { name: "resultUri", type: CapabilityDataType.STRING, required: false, description: "拍摄结果 URI" },
      { name: "mediaType", type: CapabilityDataType.NUMBER, required: false, description: "媒体类型" }
    ],
    tags: ["camera", "picker", "photo", "video"]
  },
  {
    id: "call.makeCall",
    namespace: "Call",
    name: "makeCall",
    displayName: "跳转拨号界面",
    description: "打开系统拨号界面并显示待拨号码",
    version: "1.0.0",
    category: AbilityCategory.COMMUNICATION,
    inputs: [
      { name: "phoneNumber", type: CapabilityDataType.STRING, required: true, description: "电话号码" }
    ],
    outputs: [],
    tags: ["call", "phone", "dialer"]
  },
  {
    id: "contact.addContact",
    namespace: "Contact",
    name: "addContact",
    displayName: "新增联系人",
    description: "调用 ContactsKit 新增联系人",
    version: "1.0.0",
    category: AbilityCategory.CONTACTS,
    inputs: [
      { name: "contact", type: CapabilityDataType.OBJECT, required: true, description: "联系人对象" }
    ],
    outputs: [
      { name: "id", type: CapabilityDataType.NUMBER, required: true, description: "联系人 ID" }
    ],
    tags: ["contact", "add", "write"]
  },
  {
    id: "contact.updateContact",
    namespace: "Contact",
    name: "updateContact",
    displayName: "更新联系人",
    description: "调用 ContactsKit 更新联系人",
    version: "1.0.0",
    category: AbilityCategory.CONTACTS,
    inputs: [
      { name: "contact", type: CapabilityDataType.OBJECT, required: true, description: "联系人对象，需包含 id" },
      { name: "attrs", type: CapabilityDataType.OBJECT, required: false, description: "联系人属性列表" }
    ],
    outputs: [],
    tags: ["contact", "update", "write"]
  },
  {
    id: "contact.queryContact",
    namespace: "Contact",
    name: "queryContact",
    displayName: "查询联系人",
    description: "按 key 查询联系人",
    version: "1.0.0",
    category: AbilityCategory.CONTACTS,
    inputs: [
      { name: "key", type: CapabilityDataType.STRING, required: true, description: "联系人 key" },
      { name: "holder", type: CapabilityDataType.OBJECT, required: false, description: "创建应用信息过滤条件" },
      { name: "attrs", type: CapabilityDataType.OBJECT, required: false, description: "联系人属性列表" }
    ],
    outputs: [
      { name: "contact", type: CapabilityDataType.OBJECT, required: true, description: "联系人信息" }
    ],
    tags: ["contact", "query", "read"]
  },
  {
    id: "file.access",
    namespace: "File",
    name: "access",
    displayName: "检查文件可访问性",
    description: "检查文件或目录是否存在，或校验权限",
    version: "1.0.0",
    category: AbilityCategory.SYSTEM,
    inputs: [
      { name: "path", type: CapabilityDataType.STRING, required: true, description: "应用沙箱路径" },
      { name: "mode", type: CapabilityDataType.NUMBER, required: false, description: "AccessModeType" }
    ],
    outputs: [
      { name: "exists", type: CapabilityDataType.BOOLEAN, required: true, description: "是否存在/可访问" }
    ],
    tags: ["file", "access"]
  },
  {
    id: "file.open",
    namespace: "File",
    name: "open",
    displayName: "打开文件",
    description: "打开文件或目录并返回文件描述符",
    version: "1.0.0",
    category: AbilityCategory.SYSTEM,
    inputs: [
      { name: "path", type: CapabilityDataType.STRING, required: true, description: "应用沙箱路径" },
      { name: "mode", type: CapabilityDataType.NUMBER, required: false, description: "OpenMode 按位组合值" }
    ],
    outputs: [
      { name: "fd", type: CapabilityDataType.NUMBER, required: true, description: "文件描述符" }
    ],
    tags: ["file", "open"]
  },
  {
    id: "file.close",
    namespace: "File",
    name: "close",
    displayName: "关闭文件",
    description: "关闭文件描述符或文件对象",
    version: "1.0.0",
    category: AbilityCategory.SYSTEM,
    inputs: [
      { name: "fd", type: CapabilityDataType.NUMBER, required: false, description: "文件描述符" },
      { name: "file", type: CapabilityDataType.OBJECT, required: false, description: "文件对象" }
    ],
    outputs: [],
    tags: ["file", "close"]
  },
  {
    id: "file.read",
    namespace: "File",
    name: "read",
    displayName: "读取文件",
    description: "从文件描述符读取内容",
    version: "1.0.0",
    category: AbilityCategory.SYSTEM,
    inputs: [
      { name: "fd", type: CapabilityDataType.NUMBER, required: true, description: "文件描述符" },
      { name: "offset", type: CapabilityDataType.NUMBER, required: false, description: "读取偏移量" },
      { name: "length", type: CapabilityDataType.NUMBER, required: false, description: "读取长度" }
    ],
    outputs: [
      { name: "readLen", type: CapabilityDataType.NUMBER, required: true, description: "读取字节数" },
      { name: "content", type: CapabilityDataType.STRING, required: true, description: "UTF-8 解码内容" }
    ],
    tags: ["file", "read"]
  },
  {
    id: "file.write",
    namespace: "File",
    name: "write",
    displayName: "写入文件",
    description: "向文件描述符写入字符串或二进制数据",
    version: "1.0.0",
    category: AbilityCategory.SYSTEM,
    inputs: [
      { name: "fd", type: CapabilityDataType.NUMBER, required: true, description: "文件描述符" },
      { name: "data", type: CapabilityDataType.STRING, required: false, description: "待写入字符串" },
      { name: "buffer", type: CapabilityDataType.OBJECT, required: false, description: "待写入 ArrayBuffer" },
      { name: "offset", type: CapabilityDataType.NUMBER, required: false, description: "写入偏移量" },
      { name: "length", type: CapabilityDataType.NUMBER, required: false, description: "写入长度" },
      { name: "encoding", type: CapabilityDataType.STRING, required: false, description: "字符串编码，默认 utf-8" }
    ],
    outputs: [
      { name: "writeLen", type: CapabilityDataType.NUMBER, required: true, description: "写入字节数" }
    ],
    tags: ["file", "write"]
  },
  {
    id: "file.listFile",
    namespace: "File",
    name: "listFile",
    displayName: "列出目录内容",
    description: "列出目录文件名或递归相对路径",
    version: "1.0.0",
    category: AbilityCategory.SYSTEM,
    inputs: [
      { name: "path", type: CapabilityDataType.STRING, required: true, description: "目录路径" },
      { name: "options", type: CapabilityDataType.OBJECT, required: false, description: "ListFileOptions" }
    ],
    outputs: [
      { name: "fileNames", type: CapabilityDataType.ARRAY, required: true, description: "文件名数组" }
    ],
    tags: ["file", "list"]
  },
  {
    id: "file.mkdir",
    namespace: "File",
    name: "mkdir",
    displayName: "创建目录",
    description: "在应用沙箱中创建目录",
    version: "1.0.0",
    category: AbilityCategory.SYSTEM,
    inputs: [
      { name: "path", type: CapabilityDataType.STRING, required: true, description: "目录路径" }
    ],
    outputs: [],
    tags: ["file", "mkdir"]
  },
  {
    id: "file.stat",
    namespace: "File",
    name: "stat",
    displayName: "查询文件属性",
    description: "获取文件或目录详细属性信息",
    version: "1.0.0",
    category: AbilityCategory.SYSTEM,
    inputs: [
      { name: "file", type: CapabilityDataType.OBJECT, required: false, description: "path 或 fd" },
      { name: "path", type: CapabilityDataType.STRING, required: false, description: "文件路径" },
      { name: "fd", type: CapabilityDataType.NUMBER, required: false, description: "文件描述符" }
    ],
    outputs: [
      { name: "stat", type: CapabilityDataType.OBJECT, required: true, description: "Stat 对象" }
    ],
    tags: ["file", "stat"]
  },
  {
    id: "file.unlink",
    namespace: "File",
    name: "unlink",
    displayName: "删除文件",
    description: "删除单个文件",
    version: "1.0.0",
    category: AbilityCategory.SYSTEM,
    inputs: [
      { name: "path", type: CapabilityDataType.STRING, required: true, description: "文件路径" }
    ],
    outputs: [],
    tags: ["file", "unlink"]
  },
  {
    id: "file.rmdir",
    namespace: "File",
    name: "rmdir",
    displayName: "删除目录",
    description: "删除目录及其子目录和文件",
    version: "1.0.0",
    category: AbilityCategory.SYSTEM,
    inputs: [
      { name: "path", type: CapabilityDataType.STRING, required: true, description: "目录路径" }
    ],
    outputs: [],
    tags: ["file", "rmdir"]
  },
  {
    id: "file.rename",
    namespace: "File",
    name: "rename",
    displayName: "重命名",
    description: "重命名文件或目录",
    version: "1.0.0",
    category: AbilityCategory.SYSTEM,
    inputs: [
      { name: "oldPath", type: CapabilityDataType.STRING, required: true, description: "原路径" },
      { name: "newPath", type: CapabilityDataType.STRING, required: true, description: "新路径" }
    ],
    outputs: [],
    tags: ["file", "rename"]
  },
  {
    id: "file.copyFile",
    namespace: "File",
    name: "copyFile",
    displayName: "复制文件",
    description: "复制文件到目标路径",
    version: "1.0.0",
    category: AbilityCategory.SYSTEM,
    inputs: [
      { name: "src", type: CapabilityDataType.OBJECT, required: true, description: "源路径或源 fd" },
      { name: "dest", type: CapabilityDataType.OBJECT, required: true, description: "目标路径或目标 fd" },
      { name: "mode", type: CapabilityDataType.NUMBER, required: false, description: "覆盖模式，默认 0" }
    ],
    outputs: [],
    tags: ["file", "copy"]
  },
  {
    id: "file.moveFile",
    namespace: "File",
    name: "moveFile",
    displayName: "移动文件",
    description: "移动文件到目标路径",
    version: "1.0.0",
    category: AbilityCategory.SYSTEM,
    inputs: [
      { name: "src", type: CapabilityDataType.STRING, required: true, description: "源路径" },
      { name: "dest", type: CapabilityDataType.STRING, required: true, description: "目标路径" },
      { name: "mode", type: CapabilityDataType.NUMBER, required: false, description: "移动模式，默认 0" }
    ],
    outputs: [],
    tags: ["file", "move"]
  }
];

export function getMockProviderTools(): MockProviderToolCapability[] {
  return [...MOCK_PROVIDER_TOOLS];
}

export function getMockProviderToolById(id: string): MockProviderToolCapability | null {
  const capability = MOCK_PROVIDER_TOOLS.find((item: MockProviderToolCapability) => item.id === id);
  return capability ?? null;
}

export function getMockProviderTool(namespace: string, name: string): MockProviderToolCapability | null {
  const capability = MOCK_PROVIDER_TOOLS.find((item: MockProviderToolCapability) => {
    return item.namespace === namespace && item.name === name;
  });
  return capability ?? null;
}

export function buildQueryMessage(namespace: string, name: string, args: Record<string, any>): QueryMessage {
  return {
    header: {
      namespace,
      name
    },
    payload: {
      args
    }
  };
}

export function buildQueryMessageByToolId(toolId: string, args: Record<string, any>): QueryMessage | null {
  const capability = getMockProviderToolById(toolId);
  if (!capability) {
    return null;
  }
  return buildQueryMessage(capability.namespace, capability.name, args);
}
