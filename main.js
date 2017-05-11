"use strict";

const alert = require("./modules/alert").alert;
const electron = require("electron");
const ipcMain = require("electron").ipcMain;
const shell = require('electron').shell;
const windows = require("./modules/windows");

const MOTD = `
Internal wikilinks look like [[this]].
Links to Wikipedia look like [[w:this]].
Everything else is Markdown.`;

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
			label: "Wiki",
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
					label: "Archive whole wiki (tar.gz)",
					click: () => {
						windows.send("archive", "");
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
					role: "quit"
				}
			]
		},

		{
			label: "View",
			submenu: [
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
				}
			]
		},

		{
			label: "Developer",
			submenu: [
				{
					label: "Github repo",
					click: () => {
						shell.openExternal("https://github.com/fohristiwhirl/eliki");
					}
				},
				{
					type: "separator"
				},
				{
					label: "Debug HTML",
					click: () => {
						windows.send("source", "");
					}
				},
				{
					role: "toggledevtools"
				}
			]
		}
	];

	const menu = electron.Menu.buildFromTemplate(template);
	electron.Menu.setApplicationMenu(menu);
}
