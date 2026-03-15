export class AgentQueue {
  private queue: Array<() => Promise<void>> = [];
  private isProcessing: boolean = false;

  public enqueue<T>(task: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await task();
          resolve(result);
        } catch (e) {
          reject(e);
        }
      });
      this.process();
    });
  }

  private async process(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;
    try {
      while (this.queue.length > 0) {
        const job = this.queue.shift();
        if (job) {
          await job();
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }
}
