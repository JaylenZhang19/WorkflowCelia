import { buffer } from "@kit.ArkTS";
import { fileIo as fs } from "@kit.CoreFileKit";
import { logger } from "../../../utils";
import { InvokeResult } from "../../AbilityTypes";
import { AbsAbilityHandler } from "./AbsAbilityHandler";

const TAG: string = "FileHandler";

export class FileHandler extends AbsAbilityHandler {
  private isInit: boolean = false;

  public getNamespace(): string {
    return "File";
  }

  public async init(): Promise<void> {
    if (this.isInit) {
      return;
    }
    this.NAME_MAP = new Map([
      ["access", this.access],
      ["read", this.read],
      ["write", this.write],
      ["listFile", this.listFile],
      ["mkdir", this.mkdir],
      ["stat", this.stat],
      ["unlink", this.unlink],
      ["rmdir", this.rmdir],
      ["rename", this.rename],
      ["copyFile", this.copyFile],
      ["moveFile", this.moveFile],
      ["open", this.open],
      ["close", this.close]
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

  private toErrorResult(action: string, error: unknown): InvokeResult {
    logger.error(TAG, `${action} error: ${JSON.stringify(error)}`);
    const errObj = error as Record<string, any>;
    const code = errObj?.code;
    const message = errObj?.message ?? JSON.stringify(error);
    return {
      success: false,
      errorCode: code !== undefined ? String(code) : "INVOKE_FAILED",
      error: String(message)
    };
  }

  private access = async (args: Record<string, any>): Promise<InvokeResult> => {
    if (typeof args.path !== "string" || args.path.length === 0) {
      return { success: false, errorCode: "401", error: "Parameter error: path is required." };
    }
    try {
      const exists: boolean = await fs.access(args.path, args.mode);
      return { success: true, outputs: { exists } };
    } catch (error) {
      return this.toErrorResult("access", error);
    }
  }

  private open = async (args: Record<string, any>): Promise<InvokeResult> => {
    if (typeof args.path !== "string" || args.path.length === 0) {
      return { success: false, errorCode: "401", error: "Parameter error: path is required." };
    }
    try {
      const file = await fs.open(args.path, args.mode);
      return {
        success: true,
        outputs: {
          fd: file.fd
        }
      };
    } catch (error) {
      return this.toErrorResult("open", error);
    }
  }

  private close = async (args: Record<string, any>): Promise<InvokeResult> => {
    const fileOrFd = args.fd ?? args.file;
    if (typeof fileOrFd !== "number" && typeof fileOrFd !== "object") {
      return { success: false, errorCode: "401", error: "Parameter error: fd or file is required." };
    }
    try {
      await fs.close(fileOrFd);
      return { success: true };
    } catch (error) {
      return this.toErrorResult("close", error);
    }
  }

  private read = async (args: Record<string, any>): Promise<InvokeResult> => {
    if (typeof args.fd !== "number") {
      return { success: false, errorCode: "401", error: "Parameter error: fd is required." };
    }
    const length: number = typeof args.length === "number" && args.length > 0 ? args.length : 4096;
    const arrayBuffer = new ArrayBuffer(length);
    const options: Record<string, any> = {};
    if (typeof args.offset === "number") {
      options.offset = args.offset;
    }
    if (typeof args.length === "number") {
      options.length = args.length;
    }
    try {
      const readLen: number = await fs.read(args.fd, arrayBuffer, Object.keys(options).length > 0 ? options : undefined);
      const content: string = buffer.from(arrayBuffer, 0, readLen).toString();
      return {
        success: true,
        outputs: {
          readLen,
          content
        }
      };
    } catch (error) {
      return this.toErrorResult("read", error);
    }
  }

  private write = async (args: Record<string, any>): Promise<InvokeResult> => {
    if (typeof args.fd !== "number") {
      return { success: false, errorCode: "401", error: "Parameter error: fd is required." };
    }
    const data = args.buffer ?? args.data;
    if (typeof data !== "string" && !(data instanceof ArrayBuffer)) {
      return { success: false, errorCode: "401", error: "Parameter error: buffer/data must be string or ArrayBuffer." };
    }
    const options: Record<string, any> = {};
    if (typeof args.offset === "number") {
      options.offset = args.offset;
    }
    if (typeof args.length === "number") {
      options.length = args.length;
    }
    if (typeof args.encoding === "string") {
      options.encoding = args.encoding;
    }
    try {
      const writeLen: number = await fs.write(args.fd, data, Object.keys(options).length > 0 ? options : undefined);
      return {
        success: true,
        outputs: {
          writeLen
        }
      };
    } catch (error) {
      return this.toErrorResult("write", error);
    }
  }

  private listFile = async (args: Record<string, any>): Promise<InvokeResult> => {
    if (typeof args.path !== "string" || args.path.length === 0) {
      return { success: false, errorCode: "401", error: "Parameter error: path is required." };
    }
    try {
      const fileNames: string[] = await fs.listFile(args.path, args.options);
      return {
        success: true,
        outputs: {
          fileNames
        }
      };
    } catch (error) {
      return this.toErrorResult("listFile", error);
    }
  }

  private mkdir = async (args: Record<string, any>): Promise<InvokeResult> => {
    if (typeof args.path !== "string" || args.path.length === 0) {
      return { success: false, errorCode: "401", error: "Parameter error: path is required." };
    }
    try {
      await fs.mkdir(args.path);
      return { success: true };
    } catch (error) {
      return this.toErrorResult("mkdir", error);
    }
  }

  private stat = async (args: Record<string, any>): Promise<InvokeResult> => {
    const file = args.file ?? args.path ?? args.fd;
    if (typeof file !== "string" && typeof file !== "number") {
      return { success: false, errorCode: "401", error: "Parameter error: file/path/fd is required." };
    }
    try {
      const stat = await fs.stat(file);
      return {
        success: true,
        outputs: {
          stat
        }
      };
    } catch (error) {
      return this.toErrorResult("stat", error);
    }
  }

  private unlink = async (args: Record<string, any>): Promise<InvokeResult> => {
    if (typeof args.path !== "string" || args.path.length === 0) {
      return { success: false, errorCode: "401", error: "Parameter error: path is required." };
    }
    try {
      await fs.unlink(args.path);
      return { success: true };
    } catch (error) {
      return this.toErrorResult("unlink", error);
    }
  }

  private rmdir = async (args: Record<string, any>): Promise<InvokeResult> => {
    if (typeof args.path !== "string" || args.path.length === 0) {
      return { success: false, errorCode: "401", error: "Parameter error: path is required." };
    }
    try {
      await fs.rmdir(args.path);
      return { success: true };
    } catch (error) {
      return this.toErrorResult("rmdir", error);
    }
  }

  private rename = async (args: Record<string, any>): Promise<InvokeResult> => {
    if (typeof args.oldPath !== "string" || args.oldPath.length === 0 || typeof args.newPath !== "string" || args.newPath.length === 0) {
      return { success: false, errorCode: "401", error: "Parameter error: oldPath and newPath are required." };
    }
    try {
      await fs.rename(args.oldPath, args.newPath);
      return { success: true };
    } catch (error) {
      return this.toErrorResult("rename", error);
    }
  }

  private copyFile = async (args: Record<string, any>): Promise<InvokeResult> => {
    const src = args.src;
    const dest = args.dest;
    if ((typeof src !== "string" && typeof src !== "number") || (typeof dest !== "string" && typeof dest !== "number")) {
      return { success: false, errorCode: "401", error: "Parameter error: src and dest are required." };
    }
    try {
      await fs.copyFile(src, dest, args.mode);
      return { success: true };
    } catch (error) {
      return this.toErrorResult("copyFile", error);
    }
  }

  private moveFile = async (args: Record<string, any>): Promise<InvokeResult> => {
    if (typeof args.src !== "string" || args.src.length === 0 || typeof args.dest !== "string" || args.dest.length === 0) {
      return { success: false, errorCode: "401", error: "Parameter error: src and dest are required." };
    }
    try {
      await fs.moveFile(args.src, args.dest, args.mode);
      return { success: true };
    } catch (error) {
      return this.toErrorResult("moveFile", error);
    }
  }
}
