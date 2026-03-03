import { common, wantConstant } from "@kit.AbilityKit";
import { globalContext } from "../../../entryability/EntryAbility";
import { logger } from "../../../utils";
import { InvokeResult } from "../../AbilityTypes";
import { AbsAbilityHandler } from "./AbsAbilityHandler";

const TAG: string = "MailHandler";

export class MailHandler extends AbsAbilityHandler {
  private isInit: boolean = false;

  public getNamespace(): string {
    return "Mail";
  }

  public async init(): Promise<void> {
    if (this.isInit) {
      return;
    }
    this.NAME_MAP = new Map([
      ["send", this.send]
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

  private encodeStringArray(value: unknown): string[] | undefined {
    if (!Array.isArray(value)) {
      return undefined;
    }
    return value.filter((item) => typeof item === "string").map((item) => encodeURI(item as string));
  }

  private send = async (args: Record<string, any>): Promise<InvokeResult> => {
    if (!globalContext) {
      return {
        success: false,
        errorCode: "CONTEXT_NOT_READY",
        error: "UIAbility context is not ready."
      };
    }

    const context = globalContext as common.UIAbilityContext;
    const wantParam: Record<string, any> = {
      sceneType: typeof args.sceneType === "number" ? args.sceneType : 1
    };

    const email = this.encodeStringArray(args.email);
    const cc = this.encodeStringArray(args.cc);
    const bcc = this.encodeStringArray(args.bcc);
    const streamUris = this.encodeStringArray(args.streamUris ?? args["ability.params.stream"]);

    if (email && email.length > 0) {
      wantParam.email = email;
    }
    if (cc && cc.length > 0) {
      wantParam.cc = cc;
    }
    if (bcc && bcc.length > 0) {
      wantParam.bcc = bcc;
    }
    if (typeof args.subject === "string") {
      wantParam.subject = encodeURI(args.subject);
    }
    if (typeof args.body === "string") {
      wantParam.body = encodeURI(args.body);
    }
    if (streamUris && streamUris.length > 0) {
      wantParam["ability.params.stream"] = streamUris;
      wantParam["ability.want.params.uriPermissionFlag"] =
        typeof args.uriPermissionFlag === "number"
          ? args.uriPermissionFlag
          : wantConstant.Flags.FLAG_AUTH_READ_URI_PERMISSION;
    }

    return new Promise((resolve) => {
      let settled = false;
      const finish = (result: InvokeResult) => {
        if (settled) {
          return;
        }
        settled = true;
        resolve(result);
      };

      const abilityStartCallback: common.AbilityStartCallback = {
        onError: (code: number, name: string, message: string) => {
          logger.error(TAG, `onError code ${code} name: ${name} message: ${message}`);
          finish({
            success: false,
            errorCode: String(code),
            error: message,
            metadata: { name }
          });
        },
        onResult: (result) => {
          logger.info(TAG, `onResult: ${JSON.stringify(result)}`);
        }
      };

      context.startAbilityByType("mail", wantParam, abilityStartCallback, (err) => {
        if (err) {
          logger.error(TAG, `startAbilityByType fail: ${JSON.stringify(err)}`);
          const errObj = err as Record<string, any>;
          finish({
            success: false,
            errorCode: errObj?.code !== undefined ? String(errObj.code) : "INVOKE_FAILED",
            error: String(errObj?.message ?? JSON.stringify(err))
          });
          return;
        }
        finish({
          success: true,
          outputs: {
            started: true
          }
        });
      });
    });
  }
}
