"use strict";

const electron = require("electron");
const path = require("path");
const url = require("url");

const alert = require("./modules/alert_main");
const config_io = require("./modules/config_io");
const stringify = require("./modules/stringify");

config_io.load();
let config = config_io.config;

let menu = menu_build();
let win;						// We're supposed to keep global references to every window we make.

electron.app.whenReady().then(() => {
	startup();
});

// --------------------------------------------------------------------------------------------------------------

function startup() {

	let desired_zoomfactor = 1 / electron.screen.getPrimaryDisplay().scaleFactor;

	win = new electron.BrowserWindow({
		width: config.width,
		height: config.height,
		backgroundColor: "#000000",
		resizable: true,
		show: false,
		useContentSize: true,
		webPreferences: {
			backgroundThrottling: false,
			contextIsolation: false,
			nodeIntegration: true,
			spellcheck: false,
			zoomFactor: desired_zoomfactor			// Unreliable, see https://github.com/electron/electron/issues/10572
		}
	});

	win.once("ready-to-show", () => {
		try {
			win.webContents.setZoomFactor(desired_zoomfactor);	// This seems to work, note issue 10572 above.
		} catch (err) {
			win.webContents.zoomFactor = desired_zoomfactor;	// The method above "will be removed" in future.
		}
		win.show();
		win.focus();
	});

	win.once("close", (event) => {					// Note the once...
		event.preventDefault();						// We prevent the close one time only,
		win.webContents.send("call", "quit");		// to let renderer's "quit" method run once. It then sends "terminate" back.
	});

	electron.ipcMain.on("terminate", () => {
		win.close();
	});

	electron.app.on("window-all-closed", () => {
		electron.app.quit();
	});

	electron.ipcMain.on("alert", (event, msg) => {
		alert(msg);
	});

	// Actually load the page last, I guess, so the event handlers above are already set up.
	// Send some possibly useful info as a query.

	let query = {};
	query.user_data_path = electron.app.getPath("userData");
	query.zoomfactor = desired_zoomfactor;

	win.loadFile(
		path.join(__dirname, "renderer.html"),
		{query: query}
	);

	electron.Menu.setApplicationMenu(menu);
}

// --------------------------------------------------------------------------------------------------------------

function menu_build() {
	const template = [
		{
			label: "App",
			submenu: [
				{
					label: "About",
					click: () => {
						alert(`${electron.app.getName()} (${electron.app.getVersion()}) in Electron (${process.versions.electron})`);
					}
				},
				{
					role: "toggledevtools"
				},
				{
					type: "separator",
				},
				{
					label: `Show pages`,
					click: () => {
						electron.shell.showItemInFolder(path.join(electron.app.getPath("userData"), "pages"));
					}
				},
				{
					type: "separator",
				},
				{
					label: "Edit",
					accelerator: "CmdOrCtrl+E",
					click: () => {
						win.webContents.send("call", "edit");
					}
				},
				{
					label: "Index",
					accelerator: "CmdOrCtrl+I",
					click: () => {
						win.webContents.send("call", "index");
					}
				},
				{
					label: "Page list",
					accelerator: "CmdOrCtrl+L",
					click: () => {
						win.webContents.send("call", "page_list");
					}
				},
				{
					type: "separator",
				},
				{
					label: "Quit",
					accelerator: "CommandOrControl+Q",
					role: "quit"
				},
			]
		},
	];

	return electron.Menu.buildFromTemplate(template);
}

