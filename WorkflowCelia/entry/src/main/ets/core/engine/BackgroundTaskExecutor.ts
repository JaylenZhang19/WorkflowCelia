import { common } from '@kit.AbilityKit';
import { ExternalAbilityService, SmsParams, EmailParams, AbilityCallResult } from '../../providers/ExternalAbilityService';
import { logger } from '../../utils/Logger';

const TAG = 'BackgroundTaskExecutor';

/**
 * 任务类型
 */
export enum TaskType {
  SEND_SMS = 'send_sms',
  SEND_EMAIL = 'send_email'
}

/**
 * 任务状态
 */
export enum TaskStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

/**
 * 任务定义
 */
export interface TaskDefinition {
  id: string;
  type: TaskType;
  name: string;
  description?: string;
  inputs: Record<string, any>;
  status: TaskStatus;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  result?: AbilityCallResult;
  error?: string;
}

/**
 * 后台任务执行器
 * 负责在后台执行任务编排中心调度的任务
 */
export class BackgroundTaskExecutor {
  private static instance: BackgroundTaskExecutor;
  private abilityService: ExternalAbilityService;
  private taskQueue: TaskDefinition[] = [];
  private isProcessing: boolean = false;
  private context: common.UIAbilityContext | null = null;

  private constructor() {
    this.abilityService = ExternalAbilityService.getInstance();
  }

  /**
   * 获取单例实例
   */
  static getInstance(): BackgroundTaskExecutor {
    if (!BackgroundTaskExecutor.instance) {
      BackgroundTaskExecutor.instance = new BackgroundTaskExecutor();
    }
    return BackgroundTaskExecutor.instance;
  }

  /**
   * 初始化执行器
   */
  async initialize(context: common.UIAbilityContext): Promise<void> {
    this.context = context;
    await this.abilityService.initialize(context);
    logger.info(TAG, 'BackgroundTaskExecutor initialized');
  }

  /**
   * 添加任务到队列
   */
  addTask(task: Omit<TaskDefinition, 'id' | 'status' | 'createdAt'>): TaskDefinition {
    const taskDefinition: TaskDefinition = {
      ...task,
      id: this.generateTaskId(),
      status: TaskStatus.PENDING,
      createdAt: Date.now()
    };

    this.taskQueue.push(taskDefinition);
    logger.info(TAG, `Task added: ${taskDefinition.id}`);

    // 启动任务处理
    void this.processQueue();

    return taskDefinition;
  }

  /**
   * 立即执行任务（不加入队列）
   */
  async executeTask(task: Omit<TaskDefinition, 'id' | 'status' | 'createdAt' | 'startedAt' | 'completedAt'>): Promise<TaskDefinition> {
    const taskDefinition: TaskDefinition = {
      ...task,
      id: this.generateTaskId(),
      status: TaskStatus.RUNNING,
      createdAt: Date.now(),
      startedAt: Date.now()
    };

    logger.info(TAG, `Executing task immediately: ${taskDefinition.id}`);

    try {
      const result = await this.executeTaskInternal(taskDefinition);
      taskDefinition.result = result;
      taskDefinition.status = result.success ? TaskStatus.COMPLETED : TaskStatus.FAILED;
    } catch (err) {
      taskDefinition.error = JSON.stringify(err);
      taskDefinition.status = TaskStatus.FAILED;
    }

    taskDefinition.completedAt = Date.now();
    return taskDefinition;
  }

  /**
   * 处理任务队列
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.taskQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.taskQueue.length > 0) {
      const task = this.taskQueue.shift();
      if (!task) {
        continue;
      }

      task.status = TaskStatus.RUNNING;
      task.startedAt = Date.now();

      logger.info(TAG, `Processing task: ${task.id}`);

      try {
        const result = await this.executeTaskInternal(task);
        task.result = result;
        task.status = result.success ? TaskStatus.COMPLETED : TaskStatus.FAILED;
      } catch (err) {
        task.error = JSON.stringify(err);
        task.status = TaskStatus.FAILED;
        logger.error(TAG, `Task failed: ${task.id}, error: ${JSON.stringify(err)}`);
      }

      task.completedAt = Date.now();
      logger.info(TAG, `Task completed: ${task.id}, status: ${task.status}`);
    }

    this.isProcessing = false;
  }

  /**
   * 执行单个任务
   */
  private async executeTaskInternal(task: TaskDefinition): Promise<AbilityCallResult> {
    switch (task.type) {
      case TaskType.SEND_SMS:
        return this.executeSmsTask(task.inputs as SmsParams);
      case TaskType.SEND_EMAIL:
        return this.executeEmailTask(task.inputs as EmailParams);
      default:
        return {
          success: false,
          error: `Unknown task type: ${task.type}`,
          errorCode: 'UNKNOWN_TASK_TYPE'
        };
    }
  }

  /**
   * 执行短信任务
   */
  private async executeSmsTask(params: SmsParams): Promise<AbilityCallResult> {
    logger.info(TAG, 'Executing SMS task');
    return await this.abilityService.sendSms(params);
  }

  /**
   * 执行邮件任务
   */
  private async executeEmailTask(params: EmailParams): Promise<AbilityCallResult> {
    logger.info(TAG, 'Executing Email task');
    return await this.abilityService.sendEmail(params);
  }

  /**
   * 获取任务状态
   */
  getTaskStatus(taskId: string): TaskStatus | undefined {
    const task = this.taskQueue.find((t) => t.id === taskId);
    return task?.status;
  }

  /**
   * 获取所有任务
   */
  getAllTasks(): TaskDefinition[] {
    return [...this.taskQueue];
  }

  /**
   * 获取待处理任务
   */
  getPendingTasks(): TaskDefinition[] {
    return this.taskQueue.filter((t) => t.status === TaskStatus.PENDING);
  }

  /**
   * 获取已完成任务
   */
  getCompletedTasks(): TaskDefinition[] {
    return this.taskQueue.filter((t) => t.status === TaskStatus.COMPLETED);
  }

  /**
   * 获取失败任务
   */
  getFailedTasks(): TaskDefinition[] {
    return this.taskQueue.filter((t) => t.status === TaskStatus.FAILED);
  }

  /**
   * 取消任务
   */
  cancelTask(taskId: string): boolean {
    const task = this.taskQueue.find((t) => t.id === taskId && t.status === TaskStatus.PENDING);
    if (task) {
      task.status = TaskStatus.CANCELLED;
      logger.info(TAG, `Task cancelled: ${taskId}`);
      return true;
    }
    return false;
  }

  /**
   * 清空已完成任务
   */
  clearCompletedTasks(): number {
    const completedCount = this.taskQueue.filter((t) =>
      t.status === TaskStatus.COMPLETED || t.status === TaskStatus.CANCELLED
    ).length;

    this.taskQueue = this.taskQueue.filter((t) =>
      t.status !== TaskStatus.COMPLETED && t.status !== TaskStatus.CANCELLED
    );

    logger.info(TAG, `Cleared ${completedCount} completed tasks`);
    return completedCount;
  }

  /**
   * 生成任务 ID
   */
  private generateTaskId(): string {
    return `TASK_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }

  /**
   * 获取队列长度
   */
  getQueueLength(): number {
    return this.taskQueue.length;
  }

  /**
   * 是否正在处理
   */
  isBusy(): boolean {
    return this.isProcessing;
  }

  /**
   * 释放资源
   */
  dispose(): void {
    this.taskQueue = [];
    this.isProcessing = false;
    this.context = null;
    this.abilityService.dispose();
    logger.info(TAG, 'BackgroundTaskExecutor disposed');
  }
}
