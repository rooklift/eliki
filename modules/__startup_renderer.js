"use strict";

const {ipcRenderer} = require("electron");
const querystring = require("querystring");

const config_io = require("./config_io");
const stringify = require("./stringify");

config_io.load();

// ------------------------------------------------------------------------------------------------
// Globals, only want a few...

global.alert = (msg) => {
	ipcRenderer.send("alert", stringify(msg));
};

global.zoomfactor = parseFloat(querystring.parse(global.location.search).zoomfactor);
global.config = config_io.config;
global.eliki = require("./eliki");

// ------------------------------------------------------------------------------------------------
// Menu handlers...

ipcRenderer.on("call", (event, msg) => {
	eliki[msg]();
});

// ------------------------------------------------------------------------------------------------

window.addEventListener("error", (event) => {
	alert("An uncaught exception happened in the renderer process. See the dev console for details. The app might now be in a bad state.");
}, {once: true});

// ------------------------------------------------------------------------------------------------

eliki.go("Index");
