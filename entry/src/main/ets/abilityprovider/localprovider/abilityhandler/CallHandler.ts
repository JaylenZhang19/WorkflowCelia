import { call } from "@kit.TelephonyKit";
import { logger } from "../../../utils";
import { InvokeResult } from "../../AbilityTypes";
import { AbsAbilityHandler } from "./AbsAbilityHandler";

const TAG: string = "CallHandler";

export class CallHandler extends AbsAbilityHandler {
  private isInit: boolean = false;

  public getNamespace(): string {
    return "Call";
  }

  public async init(): Promise<void> {
    if (this.isInit) {
      return;
    }
    this.NAME_MAP = new Map([
      ["makeCall", this.makeCall],
    ]);
    this.isInit = true;
  }

  public async handleRequest(name: string, args: Record<string, any>): Promise<InvokeResult> {
    if (!this.NAME_MAP.has(name)) {
      return {
        success: false,
        errorCode: "NAME_NOT_FOUND",
        error: `no name: ${name}`
      };
    }
    const method = this.NAME_MAP.get(name);
    if (!method) {
      return {
        success: false,
        errorCode: "METHOD_NOT_FOUND",
        error: `method not found: ${name}`
      };
    }
    return method(args);
  }

  private makeCall = async (args: Record<string, any>): Promise<InvokeResult> => {
    const phoneNumber: unknown = args.phoneNumber;
    if (typeof phoneNumber !== "string") {
      return {
        success: false,
        errorCode: "401",
        error: "Parameter error: phoneNumber must be string."
      };
    }
    if (phoneNumber.trim().length === 0) {
      return {
        success: false,
        errorCode: "8300001",
        error: "Invalid parameter value: phoneNumber is empty."
      };
    }
    logger.info(TAG, `makeCall phoneNumber: ${phoneNumber}`);
    try {
      await call.makeCall(phoneNumber);
      return {
        success: true,
        outputs: {
          phoneNumber
        }
      };
    } catch (error) {
      logger.error(TAG, `makeCall error: ${JSON.stringify(error)}`);
      return {
        success: false,
        errorCode: "INVOKE_FAILED",
        error: JSON.stringify(error)
      };
    }
  }
}
