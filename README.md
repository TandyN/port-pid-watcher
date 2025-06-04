# Port PID Watcher
A Visual Studio Code extension to monitor a specific port, detect changes in its associated PID, and automatically trigger a debugger when the PID changes.

Useful for hot-reloading environments (e.g., Python, Node.js) where the process is restarted on save or rebuild.

---

## 🚀 Features

- Monitors a configurable TCP port (default: `9091`) for process PID changes.
- Automatically attaches the debugger based on a named configuration from your `launch.json` (default: `Python Azure Function Port PID Watcher`).
- Supports **Windows** (`netstat`) and **Unix/Linux/macOS** (`lsof`).
- Custom Output Panel (`Port PID Watcher`) for live logs and diagnostics.
- Manual start/stop commands from the Command Palette.

---

## ⚙️ Configuration

Open VS Code Settings and search for `Port PID Watcher`. You can configure:

- **Port PID Watcher › Port**: Port number to monitor.  
  _Default: `9091`_
- **Port PID Watcher › Launch Config**: Debug configuration name to use from `launch.json`.  
  _Default: `Python Azure Function Port PID Watcher`_

---
