"use strict";

const fs = require("fs");
const path = require("path");
const querystring = require("querystring");

const user_data_path = querystring.parse(global.location.search)["?user_data_path"];
const pages_dir_path = path.join(user_data_path, "pages");


try {
	fs.mkdirSync(pages_dir_path);
} catch(err) {
	// pass
}


function safe_filename(s) {
	s = s.replace(/\./g, "");
	return s;
}


exports.load = function(title) {

	let filepath = path.join(pages_dir_path, safe_filename(title));

	if (fs.existsSync(filepath) === false) {
		return "";
	}

	return fs.readFileSync(filepath, "utf8");
};

exports.save = function(title, markdown) {

	let filepath = path.join(pages_dir_path, safe_filename(title));

	if (markdown.length > 0) {
		fs.writeFileSync(filepath, markdown, "utf8");
	} else {
		try {
			fs.rmSync(filepath);
		} catch(err) {
			// pass
		}
	}
};

