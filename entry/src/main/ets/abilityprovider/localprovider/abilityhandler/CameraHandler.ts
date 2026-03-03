import { camera, cameraPicker as picker } from "@kit.CameraKit";
import { fileIo, fileUri } from "@kit.CoreFileKit";
import { globalContext } from "../../../entryability/EntryAbility";
import { logger } from "../../../utils";
import { InvokeResult } from "../../AbilityTypes";
import { AbsAbilityHandler } from "./AbsAbilityHandler";

const TAG: string = "CameraHandler";

export class CameraHandler extends AbsAbilityHandler {
  private isInit: boolean = false;

  public getNamespace(): string {
    return "Camera";
  }

  public async init(): Promise<void> {
    if (this.isInit) {
      return;
    }
    this.NAME_MAP = new Map([
      ["pick", this.pick]
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

  private buildPickerProfile(context: any, cameraPosition: number): picker.PickerProfile {
    const pathDir = context.filesDir;
    const fileName = `${new Date().getTime()}_${Math.floor(Math.random() * 1000)}`;
    const filePath = `${pathDir}/${fileName}.tmp`;
    fileIo.createRandomAccessFileSync(filePath, fileIo.OpenMode.CREATE);
    const uri = fileUri.getUriFromPath(filePath);
    return {
      cameraPosition,
      saveUri: uri
    };
  }

  private parseMediaTypes(args: Record<string, any>): picker.PickerMediaType[] {
    const type: string = typeof args.type === "string" ? args.type.toUpperCase() : "BOTH";
    if (type === "PHOTO") {
      return [picker.PickerMediaType.PHOTO];
    }
    if (type === "VIDEO") {
      return [picker.PickerMediaType.VIDEO];
    }
    return [picker.PickerMediaType.PHOTO, picker.PickerMediaType.VIDEO];
  }

  private parseCameraPosition(args: Record<string, any>): number {
    const cameraPosition = args.cameraPosition;
    if (cameraPosition === "FRONT" || cameraPosition === camera.CameraPosition.CAMERA_POSITION_FRONT) {
      return camera.CameraPosition.CAMERA_POSITION_FRONT;
    }
    return camera.CameraPosition.CAMERA_POSITION_BACK;
  }

  private pick = async (args: Record<string, any>): Promise<InvokeResult> => {
    if (!globalContext) {
      return {
        success: false,
        errorCode: "CONTEXT_NOT_READY",
        error: "UIAbility context is not ready."
      };
    }
    try {
      const cameraPosition = this.parseCameraPosition(args);
      const pickerProfile = this.buildPickerProfile(globalContext, cameraPosition);
      const result = await picker.pick(globalContext, this.parseMediaTypes(args), pickerProfile);
      logger.info(TAG, `pick result: ${JSON.stringify(result)}`);
      return {
        success: result.resultCode === 0,
        outputs: {
          resultCode: result.resultCode,
          resultUri: result.resultUri,
          mediaType: result.mediaType
        },
        errorCode: result.resultCode === 0 ? undefined : "PICKER_FAILED",
        error: result.resultCode === 0 ? undefined : "camera picker failed"
      };
    } catch (error) {
      logger.error(TAG, `pick error: ${JSON.stringify(error)}`);
      const errObj = error as Record<string, any>;
      return {
        success: false,
        errorCode: errObj?.code !== undefined ? String(errObj.code) : "INVOKE_FAILED",
        error: String(errObj?.message ?? JSON.stringify(error))
      };
    }
  }
}
