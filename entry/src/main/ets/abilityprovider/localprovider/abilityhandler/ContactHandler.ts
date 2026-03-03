import { contact } from "@kit.ContactsKit";
import { abilityAccessCtrl, PermissionRequestResult, Permissions } from "@kit.AbilityKit";
import { globalContext } from "../../../entryability/EntryAbility";
import { logger } from "../../../utils";
import { InvokeResult } from "../../AbilityTypes";
import { AbsAbilityHandler } from "./AbsAbilityHandler";

const TAG: string = "ContactHandler";

export class ContactHandler extends AbsAbilityHandler {
  private isInit: boolean = false;

  public getNamespace(): string {
    return "Contact";
  }

  public async init(): Promise<void> {
    if (this.isInit) {
      return;
    }
    this.NAME_MAP = new Map([
      ["addContact", this.addContact],
      ["updateContact", this.updateContact],
      ["queryContact", this.queryContact],
    ]);
    const permissionResult = await this.requestPermission([
      "ohos.permission.READ_CONTACTS",
      "ohos.permission.WRITE_CONTACTS"
    ]);
    logger.info(TAG, `init permissionResult: ${JSON.stringify(permissionResult)}`);
    this.isInit = true;
  }

  private async requestPermission(permissions: Array<Permissions>): Promise<PermissionRequestResult> {
    const atManager: abilityAccessCtrl.AtManager = abilityAccessCtrl.createAtManager();
    let result: PermissionRequestResult = {} as PermissionRequestResult;
    try {
      result = await atManager.requestPermissionsFromUser(globalContext, permissions);
      logger.info(TAG, `requestPermission result: ${JSON.stringify(result)}`);
    } catch (err) {
      logger.error(TAG, `requestPermission error: ${JSON.stringify(err)}`);
    }
    return result;
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

  private addContact = async (args: Record<string, any>): Promise<InvokeResult> => {
    const contactData = args.contact;
    if (!contactData) {
      return {
        success: false,
        errorCode: "401",
        error: "Parameter error: contact is required."
      };
    }
    try {
      const id: number = await contact.addContact(globalContext, contactData as contact.Contact);
      return {
        success: true,
        outputs: {
          id
        }
      };
    } catch (error) {
      logger.error(TAG, `addContact error: ${JSON.stringify(error)}`);
      return {
        success: false,
        errorCode: "INVOKE_FAILED",
        error: JSON.stringify(error)
      };
    }
  }

  private updateContact = async (args: Record<string, any>): Promise<InvokeResult> => {
    const contactData = args.contact;
    const attrs = args.attrs;
    if (!contactData) {
      return {
        success: false,
        errorCode: "401",
        error: "Parameter error: contact is required."
      };
    }
    try {
      await contact.updateContact(globalContext, contactData as contact.Contact,
        attrs as contact.ContactAttributes | undefined);
      return {
        success: true
      };
    } catch (error) {
      logger.error(TAG, `updateContact error: ${JSON.stringify(error)}`);
      return {
        success: false,
        errorCode: "INVOKE_FAILED",
        error: JSON.stringify(error)
      };
    }
  }

  private queryContact = async (args: Record<string, any>): Promise<InvokeResult> => {
    const key: unknown = args.key;
    const holder = args.holder;
    const attrs = args.attrs;
    if (typeof key !== "string" || key.trim().length === 0) {
      return {
        success: false,
        errorCode: "401",
        error: "Parameter error: key is required."
      };
    }
    try {
      const data: contact.Contact = await contact.queryContact(globalContext, key,
        holder as contact.Holder | undefined, attrs as contact.ContactAttributes | undefined);
      return {
        success: true,
        outputs: {
          contact: data
        }
      };
    } catch (error) {
      logger.error(TAG, `queryContact error: ${JSON.stringify(error)}`);
      return {
        success: false,
        errorCode: "INVOKE_FAILED",
        error: JSON.stringify(error)
      };
    }
  }
}
