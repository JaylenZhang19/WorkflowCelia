import { logger } from "../../../utils";
import { InvokeResult } from "../../AbilityTypes";
import { AbsAbilityHandler } from "./AbsAbilityHandler";
import { globalContext } from "../../../entryability/EntryAbility";

const TAG: string = "SmsHandler";

export class SmsHandler extends AbsAbilityHandler {
  private isInit: boolean = false;

  public getNamespace(): string {
    return "Sms";
  }

  public async init(): Promise<void> {
    if (this.isInit) {
      return;
    }
    this.NAME_MAP = new Map([
      ["sendSms", this.sendSms],
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

  private sendSms = async (args: Record<string, any>): Promise<InvokeResult> => {
    const phoneNumbers: string[] = args.phoneNumbers;
    const body: string = args.body;

    // Validate body (optional)
    if (body !== undefined && typeof body !== "string") {
      return {
        success: false,
        errorCode: "401",
        error: "Parameter error: body must be string."
      };
    }

    logger.info(TAG, `sendSms phoneNumbers: ${phoneNumbers}, body: ${body}`);

    try {
      let smsUri = "sms:";

      for (let index = 0; index < phoneNumbers.length; index++) {
        const phoneNumber = phoneNumbers[index];
        if (phoneNumber !== undefined && typeof phoneNumber === "string" && phoneNumber.trim().length > 0) {
          if (index != 0) {
            smsUri += ',';
          }
          smsUri += phoneNumber.trim();
        }
      }
      
      // Add body if provided
      if (body !== undefined && typeof body === "string" && body.trim().length > 0) {
        const encodedBody = encodeURIComponent(body.trim());
        smsUri += `?body=${encodedBody}`;
      }

      logger.info(TAG, `sendSms constructed URI: ${smsUri}`);

      // Create Want to launch SMS app
      const want = {
        bundleName: "com.ohos.mms",
        action: "ohos.want.action.viewData",
        uri: smsUri
      };

      // Get context and start SMS ability
      const context = globalContext;
      if (!context) {
        return {
          success: false,
          errorCode: "CONTEXT_NOT_AVAILABLE",
          error: "Failed to get context"
        };
      }

      const result = await context.startAbility(want);

      logger.info(TAG, "sendSms success: SMS app launched");
      return {
        success: true,
        outputs: {
          result: result
        }
      };
    } catch (error) {
      logger.error(TAG, `sendSms error: ${JSON.stringify(error)}`);
      return {
        success: false,
        errorCode: "INVOKE_FAILED",
        error: JSON.stringify(error)
      };
    }
  }
}
