import * as vscode from 'vscode';

/**
 * Encapsulates VS Code LogOutputChannel for standardized extension logging.
 * Logs are routed to the 'Remote Image Preview' output channel in VS Code's Output panel.
 */
export class Logger implements vscode.Disposable {
  private channel: vscode.LogOutputChannel | undefined;
  private readonly channelName: string;

  constructor(channelName: string = 'Remote Image Preview') {
    this.channelName = channelName;
  }

  /**
   * Lazily initialize or retrieve the output channel.
   */
  private getChannel(): vscode.LogOutputChannel {
    if (!this.channel) {
      this.channel = vscode.window.createOutputChannel(this.channelName, { log: true });
    }
    return this.channel;
  }

  public trace(message: string, ...args: any[]): void {
    this.getChannel().trace(message, ...args);
  }

  public debug(message: string, ...args: any[]): void {
    this.getChannel().debug(message, ...args);
  }

  public info(message: string, ...args: any[]): void {
    this.getChannel().info(message, ...args);
  }

  public warn(message: string, ...args: any[]): void {
    this.getChannel().warn(message, ...args);
  }

  public error(error: string | Error, ...args: any[]): void {
    this.getChannel().error(error, ...args);
  }

  /**
   * Reveals the output channel in the VS Code Output panel.
   */
  public show(preserveFocus?: boolean): void {
    this.getChannel().show(preserveFocus);
  }

  /**
   * Disposes the underlying output channel.
   */
  public dispose(): void {
    if (this.channel) {
      this.channel.dispose();
      this.channel = undefined;
    }
  }
}

/**
 * Default global singleton logger instance for Remote Image Preview.
 */
export const logger = new Logger('Remote Image Preview');
