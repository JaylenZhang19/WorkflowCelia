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
