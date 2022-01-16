"use strict";

const {ipcRenderer} = require("electron");

const config_io = require("./config_io");
const page = require("./page");
const page_io = require("./page_io");


let current_page = null;


exports.quit = () => {

	config.width = Math.floor(window.innerWidth * zoomfactor);
	config.height = Math.floor(window.innerHeight * zoomfactor);

	config_io.save();								// As long as we use the sync save, this will complete before we
	ipcRenderer.send("terminate");					// send "terminate". Not sure about results if that wasn't so.

};

exports.go = (title) => {

	if (typeof title === "string" && title.length > 0) {
		current_page = page.new_page(title);
		current_page.autoload();
		current_page.render();
	}

};

exports.index = () => {
	exports.go("Index");
};

exports.edit = () => {
	current_page.edit();
};

exports.page_list = () => {

	let all_pages = page_io.get_page_list();

	let md = "";
	for (let item of all_pages) {
		md += `* [[${item}]]\n`;
	}

	current_page = page.new_page("Special: All Pages", true);
	current_page.set_markdown(md);
	current_page.render();
};

exports.page = () => {
	return current_page;
};

exports.source = () => {
	return current_page.html
};
