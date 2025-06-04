# Port PID Watcher
A Visual Studio Code extension to monitor a specific port, detect changes in its associated PID, and automatically trigger a debugger when the PID changes.

Useful for hot-reloading environments (e.g., Python, Node.js) where the process is restarted on save or rebuild.


## 🚀 Features

- Monitors a configurable TCP port (default: `9091`) for process PID changes.
- Automatically attaches the debugger based on a named configuration from your `launch.json` (default: `Python Azure Function Port PID Watcher`).
- Supports **Windows** (`netstat`) and **Unix/Linux/macOS** (`lsof`).
- Custom Output Panel (`Port PID Watcher`) for live logs and diagnostics.
- Manual start/stop commands from the Command Palette.

## ⚙️ Configuration

Open VS Code Settings and search for `Port PID Watcher`. You can configure:

- **Port PID Watcher › Port**: Port number to monitor.  
  _Default: `9091`_
- **Port PID Watcher › Launch Config**: Debug configuration name to use from `launch.json`.  
  _Default: `Python Azure Function Port PID Watcher`_

## Why I Made This
*This was created because writing python functions with Azure Functions Core Tools & `debugpy` don't play well together when trying to debug with hot reload. Since `func host start` hot reload kills the child process and spawns a new one, the original attached debugger dies. This was created since `restart: true` does not yet exist for `debugpy`, so I made this.*

*To use this with Azure Functions, run this first...
`func host start --verbose --language-worker -- '-m debugpy --listen 127.0.0.1:9091'`*

*This way we can attach a debugger to the 9091 port separately with vscode debug console. Then make sure the launch.json config's name you want to run matches the extensions name. By default, I have it set to look for `Python Azure Function Port PID Watcher`*

*The idea is when the debugger is attached to the Azure Function, when hot reload occurs it should kill the debug session since the process is technically being destroyed for port 9091. Once it respawns, it tries to reconnect the debugger*