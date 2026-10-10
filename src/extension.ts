import * as vscode from 'vscode';
import { RemoteImageHoverProvider } from './hoverProvider';
import { GutterIconDecorator } from './decorator';

export function activate(context: vscode.ExtensionContext) {
  // Register Hover Provider for all document types
  const hoverProvider = new RemoteImageHoverProvider();
  context.subscriptions.push(
    vscode.languages.registerHoverProvider('*', hoverProvider)
  );

  // Initialize Gutter Icon Decorator
  const gutterDecorator = new GutterIconDecorator();
  context.subscriptions.push(gutterDecorator);

  // Register command to quickly configure CDN prefix
  const configureCommand = vscode.commands.registerCommand(
    'remoteImagePreview.configureCdn',
    async () => {
      const currentPrefix = vscode.workspace
        .getConfiguration('remoteImagePreview')
        .get<string>('cdnPrefix', '');

      const newPrefix = await vscode.window.showInputBox({
        title: 'Remote Image Preview: Configure CDN Prefix',
        prompt: 'Enter the CDN base URL (e.g. https://cdn.example.com)',
        value: currentPrefix,
        placeHolder: 'https://cdn.example.com'
      });

      if (newPrefix !== undefined) {
        await vscode.workspace
          .getConfiguration('remoteImagePreview')
          .update(
            'cdnPrefix',
            newPrefix.trim(),
            vscode.ConfigurationTarget.Global
          );
        vscode.window.showInformationMessage(
          `CDN Prefix updated to: ${newPrefix.trim()}`
        );
      }
    }
  );
  context.subscriptions.push(configureCommand);
}

export function deactivate() {
  // Cleanups handled via context.subscriptions
}
