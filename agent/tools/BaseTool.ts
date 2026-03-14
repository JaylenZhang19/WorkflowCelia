export abstract class Tool {
  private readonly _TYPE_MAP: Record<string, string> = {
    "string": "string",
    "integer": "number",
    "number": "number",
    "boolean": "boolean",
    "array": "object",
    "object": "object",
  };

  /** 工具名称，用于模型识别 */
  public abstract readonly name: string;

  /** 工具功能描述 */
  public abstract readonly description: string;

  /** 工具参数的 JSON Schema 描述 */
  public abstract readonly parameters: Record<string, any>;

  /**
   * 执行工具逻辑
   * @param args 工具参数
   * @returns 异步返回执行结果字符串
   */
  public abstract execute(args: Record<string, any>): Promise<string>;

  /**
   * 根据 JSON Schema 校验参数
   * @param params 模型传入的参数
   * @returns 错误信息列表（为空表示校验通过）
   */
  public validateParams(params: Record<string, any>): string[] {
    const schema = this.parameters || {};
    if (schema["type"] !== undefined && schema["type"] !== "object") {
      throw new Error(`Schema must be object type, got ${schema["type"]}`);
    }
    return this._validate(params, { ...schema, "type": "object" }, "");
  }

  /**
   * 递归校验逻辑
   */
  private _validate(val: any, schema: Record<string, any>, path: string): string[] {
    const type = schema["type"] as string;
    const label = path || "parameter";
    const errors: string[] = [];

    // 1. 基础类型校验
    if (this._TYPE_MAP[type]) {
      const actualType = typeof val;
      if (type === "array") {
        if (!Array.isArray(val)) {
          errors.push(`${label} should be array`);
        }
      } else if (type === "integer") {
        if (actualType !== "number" || !Number.isInteger(val)) {
          errors.push(`${label} should be integer`);
        }
      } else if (actualType !== this._TYPE_MAP[type]) {
        errors.push(`${label} should be ${type}`);
      }
    }

    if (errors.length > 0) return errors;

    // 2. 枚举校验
    if (schema["enum"] && Array.isArray(schema["enum"])) {
      if (!schema["enum"].includes(val)) {
        errors.push(`${label} must be one of [${schema["enum"].join(", ")}]`);
      }
    }

    // 3. 数值范围校验
    if (type === "integer" || type === "number") {
      if (schema["minimum"] !== undefined && val < schema["minimum"]) {
        errors.push(`${label} must be >= ${schema["minimum"]}`);
      }
      if (schema["maximum"] !== undefined && val > schema["maximum"]) {
        errors.push(`${label} must be <= ${schema["maximum"]}`);
      }
    }

    // 4. 字符串长度校验
    if (type === "string") {
      if (schema["minLength"] !== undefined && val.length < schema["minLength"]) {
        errors.push(`${label} must be at least ${schema["minLength"]} chars`);
      }
      if (schema["maxLength"] !== undefined && val.length > schema["maxLength"]) {
        errors.push(`${label} must be at most ${schema["maxLength"]} chars`);
      }
    }

    // 5. 对象属性校验
    if (type === "object" && val !== null) {
      const props = (schema["properties"] as Record<string, any>) || {};
      const required = (schema["required"] as string[]) || [];

      // 校验必填项
      for (const key of required) {
        if (val[key] === undefined) {
          errors.push(`missing required ${path ? path + "." + key : key}`);
        }
      }

      // 递归校验现有属性
      for (const key in val) {
        if (props[key]) {
          const subPath = path ? `${path}.${key}` : key;
          errors.push(...this._validate(val[key], props[key], subPath));
        }
      }
    }

    // 6. 数组项校验
    if (type === "array" && schema["items"] && Array.isArray(val)) {
      for (let i = 0; i < val.length; i++) {
        const subPath = `${path}[${i}]`;
        errors.push(...this._validate(val[i], schema["items"], subPath));
      }
    }

    return errors;
  }

  /**
   * 转换为模型可识别的 OpenAI Function Schema 格式
   */
  public toSchema(): Record<string, any> {
    return {
      "type": "function",
      "function": {
        "name": this.name,
        "description": this.description,
        "parameters": this.parameters,
      }
    };
  }
}