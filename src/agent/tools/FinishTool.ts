import { Tool } from './BaseTool';

/**
 * 任务完成工具 - 用于标记 Agent 任务结束并提交最终答案
 */
export class FinishTool extends Tool {
  // 使用 readonly 确保属性符合基类抽象要求且不可变
  public readonly name: string = "finish";

  public readonly description: string = "标记任务已完成并返回最终结果。当你已经完全回答了用户的问题、完成了所有请求的操作，或者无法继续执行时，调用此工具结束任务。";

  public readonly parameters: Record<string, any> = {
    "type": "object",
    "properties": {
      "result": {
        "type": "string",
        "description": "最终要返回给用户的答案或任务完成结果"
      }
    },
    "required": ["result"]
  };

  /**
   * 执行完成工具
   * @param args 包含 result 字段的参数对象
   * @returns 异步返回最终的答案字符串
   */
  public async execute(args: Record<string, any>): Promise<string> {
    // 逻辑与 Python 版本一致：直接提取 result 并返回
    // 这里的返回值会被 LocalAgent.ts 中的执行循环捕获并作为 run() 的最终输出
    const result = args["result"] !== undefined ? String(args["result"]) : "";
    return result;
  }
}
