import * as vscode from 'vscode';
import * as cp from 'child_process';

const outputChannel = vscode.window.createOutputChannel('Port PID Watcher');

let startedWatcher: NodeJS.Timeout | undefined;
let lastPid: string | null = null;

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function vsCodePopUpInfoMessage(message: string): void {
  vscode.window.showInformationMessage(`[Port PID Watcher] ${message}`);
  outputChannel.appendLine(`[Port PID Watcher][INFO] ${message}`);
}

function vsCodePopUpErrorMessage(message: string): void {
  vscode.window.showErrorMessage(`[Port PID Watcher] ${message}`);
  outputChannel.appendLine(`[Port PID Watcher][ERROR] ${message}`);
}

function vsCodeConsoleInfo(message: string): void {
  outputChannel.appendLine(`[Port PID Watcher][INFO] ${message}`);
}

function vsCodeConsoleDebug(message: string): void {
  outputChannel.appendLine(`[Port PID Watcher][DEBUG] ${message}`);
}

function vsCodeConsoleError(message: string): void {
  outputChannel.appendLine(`[Port PID Watcher][ERROR] ${message}`);
}

export function activate(context: vscode.ExtensionContext): void {
  outputChannel.clear();
  outputChannel.show(true);

  const startCommand = vscode.commands.registerCommand('portPIDWatcher.start', async () => {
    vsCodePopUpInfoMessage('Setting configuration...');

    const config = vscode.workspace.getConfiguration('portPIDWatcher');
    const portToCheck = config.get<string>('port') || '9091';
    const launchConfigName = config.get<string>('launchConfigName') || 'Python Azure Function Port PID Watcher';

    const workspaceFolder = await vscode.window.showWorkspaceFolderPick();
    if (!workspaceFolder) {
      vsCodePopUpErrorMessage('No workspace folder selected. Aborting.');
      return;
    }

    vsCodePopUpInfoMessage(`Monitoring port "${portToCheck}" in workspace "${workspaceFolder.name}" with launch config "${launchConfigName}".`);

    const launchConfigs = vscode.workspace.getConfiguration('launch', workspaceFolder.uri).get<any[]>('configurations') || [];
    const configExists = launchConfigs.some(cfg => cfg.name === launchConfigName);
    if (!configExists) {
      vsCodePopUpErrorMessage(`Debug configuration "${launchConfigName}" not found in launch.json of "${workspaceFolder.name}". Aborting.`);
      return;
    }

    lastPid = await getPortPid(portToCheck);
    vsCodeConsoleInfo(`Initial PID on port ${portToCheck}: ${lastPid}`);

    startedWatcher = setInterval(async () => {
      const currentPid = await getPortPid(portToCheck);
      vsCodeConsoleDebug(`Current PID: ${currentPid}`);

      if (currentPid !== lastPid) {
        vsCodePopUpInfoMessage(`PID changed on port ${portToCheck}. Waiting to attach debugger...`);
        lastPid = currentPid;

        try {
          if (lastPid !== null) {
            const success = await vscode.debug.startDebugging(workspaceFolder, launchConfigName);
            vsCodePopUpInfoMessage(`Debugger started.`);
            await sleep(3000);
          } else {
            vsCodeConsoleDebug(`Null PID. Waiting on connection.`);
          }
        } catch (error: any) {
          vsCodePopUpErrorMessage(`Error starting debugger - ${JSON.stringify(error)}`);
        }
      } else {
        vsCodeConsoleDebug(`No PID change detected. Last PID: ${lastPid}, Current PID: ${currentPid}`);
      }
    }, 1000);
  });

  const stopCommand = vscode.commands.registerCommand('portPIDWatcher.stop', () => {
    if (startedWatcher) {
      clearInterval(startedWatcher);
      startedWatcher = undefined;
      vsCodePopUpInfoMessage('Port PID Watcher: Monitoring stopped.');
    } else {
      vsCodePopUpInfoMessage('Port PID Watcher: Not currently running.');
    }
  });

  context.subscriptions.push(startCommand, stopCommand);
}

export function deactivate(): void {
  if (startedWatcher) {
    clearInterval(startedWatcher);
  }
}

async function getPortPid(port: string): Promise<string | null> {
  return new Promise((resolve) => {
    const command = process.platform === 'win32'
      ? `netstat -ano | findstr :${port}`
      : `lsof -iTCP:${port} -sTCP:LISTEN -Pn`;

    vsCodeConsoleDebug(`Command: ${command}`);

    cp.exec(command, (err, stdout) => {
      if (err || !stdout) {
        resolve(null);
        return;
      }

      const lines = stdout.split('\n').filter(Boolean);

      for (const line of lines) {
        const trimmed = line.trim();
        vsCodeConsoleDebug(`Trimmed output line: ${trimmed}`);

        if (process.platform === 'win32' && trimmed.includes('LISTENING')) {
          const parts = trimmed.split(/\s+/);
          const pid = parts[parts.length - 1];
          vsCodeConsoleDebug(`PID to compare (Windows): ${pid}`);
          resolve(pid);
          return;
        }

        if (process.platform !== 'win32') {
          const pid = trimmed.split(/\s+/)[1];
          vsCodeConsoleDebug(`PID to compare (Unix): ${pid}`);
          resolve(pid);
          return;
        }
      }

      resolve(null);
    });
  });
}
