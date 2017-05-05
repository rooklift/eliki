"use strict";

const electron = require("electron");
const ipcMain = require("electron").ipcMain;
const windows = require("./modules/windows");
const alert = require("./modules/alert").alert;

const MOTD = `
Make wikilinks [[like so]].
Everything else is Markdown.`

electron.app.on("ready", () => {
	windows.new({width: 1600, height: 900, page: "eliki.html"});
	menu_build();
});

electron.app.on("window-all-closed", () => {
	electron.app.quit();
});

function menu_build() {
	const template = [
		{
			label: "Menu",
			submenu: [
				{
					label: "Help",
					click: () => {
						let name = electron.app.getName();
						let app_v = electron.app.getVersion();
						let electron_v = process.versions.electron;
						alert(`${name} ${app_v} running under Electron ${electron_v}\n${MOTD}`);
					}
				},
				{
					type: "separator"
				},
				{
					label: "Edit this page",
					accelerator: "CmdOrCtrl+E",
					click: () => {
						windows.send("edit", "");
					}
				},
				{
					label: "Save",
					accelerator: "CmdOrCtrl+S",
					click: () => {
						windows.send("save", "");
					}
				},
				{
					type: "separator"
				},
				{
					label: "Go to Index",
					click: () => {
						windows.send("view", "Index");
					}
				},
				{
					label: "List all pages",
					click: () => {
						windows.send("list_all_pages", "");
					}
				},
				{
					type: "separator"
				},
				{
					label: "Zoom out",
					accelerator: "CmdOrCtrl+-",
					click: () => {
						windows.change_zoom(-0.1);
					}
				},
				{
					accelerator: "CmdOrCtrl+=",
					label: "Zoom in",
					click: () => {
						windows.change_zoom(0.1);
					}
				},
				{
					label: "Reset zoom",
					click: () => {
						windows.set_zoom(1.0);
					}
				},
				{
					type: "separator"
				},
				{
					role: "toggledevtools"
				},
				{
					type: "separator"
				},
				{
					role: "quit"
				}
			]
		}
	];

	const menu = electron.Menu.buildFromTemplate(template);
	electron.Menu.setApplicationMenu(menu);
}
