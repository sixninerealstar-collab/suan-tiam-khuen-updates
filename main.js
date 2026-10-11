const { app, BrowserWindow, dialog } = require("electron");
const path = require("path");
const { autoUpdater } = require("electron-updater");

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: "สวนเที่ยงคืน",
    backgroundColor: "#0a0d09",
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  win.loadFile(path.join(__dirname, "สวนเที่ยงคืน.html"));

  win.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  win.webContents.on("will-navigate", (event, navigationUrl) => {
    const currentFile = path.resolve(__dirname, "สวนเที่ยงคืน.html");
    try {
      const target = new URL(navigationUrl);
      if (
        target.protocol !== "file:" ||
        path.resolve(decodeURIComponent(target.pathname)) !== currentFile
      ) {
        event.preventDefault();
      }
    } catch {
      event.preventDefault();
    }
  });
}

function setupAutoUpdater() {
  // ไม่ตรวจอัปเดตตอนรันจาก npm start ในโหมดพัฒนา
  // ตรวจเฉพาะตัวเกมที่ Build/ติดตั้งแล้ว
  if (!app.isPackaged) return;

  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on("checking-for-update", () => {
    console.log("[Updater] กำลังตรวจสอบอัปเดต...");
  });

  autoUpdater.on("update-available", (info) => {
    console.log(`[Updater] พบเวอร์ชันใหม่ ${info.version}`);
  });

  autoUpdater.on("update-not-available", (info) => {
    console.log(`[Updater] ใช้เวอร์ชันล่าสุดแล้ว (${info.version})`);
  });

  autoUpdater.on("download-progress", (progress) => {
    console.log(`[Updater] ดาวน์โหลด ${Math.round(progress.percent)}%`);
  });

  autoUpdater.on("update-downloaded", async (info) => {
    try {
      const result = await dialog.showMessageBox({
        type: "info",
        title: "สวนเที่ยงคืน — มีอัปเดตใหม่",
        message: `ดาวน์โหลดเวอร์ชัน ${info.version} เรียบร้อยแล้ว`,
        detail: "เลือกอัปเดตตอนนี้เพื่อปิดเกมและติดตั้งเวอร์ชันใหม่ หรือเลือกไว้ภายหลัง ระบบจะติดตั้งเมื่อคุณปิดเกม",
        buttons: ["รีสตาร์ตและอัปเดตตอนนี้", "ไว้ภายหลัง"],
        defaultId: 0,
        cancelId: 1,
        noLink: true
      });

      if (result.response === 0) {
        autoUpdater.quitAndInstall();
      }
    } catch (error) {
      console.error("[Updater] แสดงหน้าต่างแจ้งอัปเดตไม่สำเร็จ:", error);
    }
  });

  autoUpdater.on("error", (error) => {
    // หากตรวจอัปเดตไม่ได้ ให้เกมเดิมยังเปิดเล่นต่อได้
    console.error("[Updater] เกิดข้อผิดพลาด:", error);
  });

  // รอให้หน้าต่างเกมเปิดก่อนจึงตรวจอัปเดต
  setTimeout(() => {
    autoUpdater.checkForUpdates().catch((error) => {
      console.error("[Updater] ตรวจสอบอัปเดตไม่สำเร็จ:", error);
    });
  }, 5000);
}

app.whenReady().then(() => {
  createWindow();
  setupAutoUpdater();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
