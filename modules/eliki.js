"use strict";

const {ipcRenderer} = require("electron");

const config_io = require("./config_io");
const page = require("./page");
const page_io = require("./page_io");


let current_page = null;


exports.quit = function() {

	config.width = Math.floor(window.innerWidth * zoomfactor);
	config.height = Math.floor(window.innerHeight * zoomfactor);

	config_io.save();								// As long as we use the sync save, this will complete before we
	ipcRenderer.send("terminate");					// send "terminate". Not sure about results if that wasn't so.

};

exports.go = function(title) {

	current_page = page.new_page(title);

	current_page.autoload();
	current_page.render();

};

exports.index = function() {
	exports.go("Index");
};

exports.edit = function() {
	current_page.edit();
};
