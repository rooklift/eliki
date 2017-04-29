"use strict";

const fs = require('fs');
const path = require('path');
const app = require('electron').remote.app;
const alert = require('./modules/alert.js').alert;

const userdata_path = app.getPath('userData');
const pages_dir_path = path.join(userdata_path, 'pages');

main();

// --------------------------------

function main() {
	make_pages_dir();
	view('Index');
}

function make_pages_dir() {
	if (fs.existsSync(pages_dir_path) === false) {
	    fs.mkdirSync(pages_dir_path);
	}
}

/*
function sanitise(filename) {
	let result = '';
	for (let n = 0; n < filename.length; n++) {
		let c = filename.charAt(n);
		if (c.match(/[a-zA-Z0-9]/)) {
			result += c;
		}
	}
	return result;
}
*/

function parse_markup(markup) {
	return markup;
}

function display(content) {
	document.querySelector('#content').innerHTML = parse_markup(content);
}

function view(page) {
	let markup = '';
	let page_path = path.join(pages_dir_path, page);
	if (fs.existsSync(page_path)) {
		markup = fs.readFileSync(page_path);
	}

	let content = '';
	content += '<div id="pagename" style="display: none">' + page + '</div>\n';
	content += '<h1>' + page + ' (<a href="#" onclick="edit();return false;">edit</a>)</h1>'
	content += parse_markup(markup);
	display(content);
}

function edit(page) {
	if (page === undefined) {
		page = document.querySelector('#pagename').innerHTML;
	}

	let page_path = path.join(pages_dir_path, page);

	if (fs.existsSync(page_path)) {
		let markup = fs.readFileSync(page_path);
		make_editor(page, markup);
	} else {
		make_editor(page, '');
	}
}

function make_editor(page, markup) {
	let content = '';
	content += '<div id="pagename" style="display: none">' + page + '</div>\n';
	content += '<h1>Editing ' + page + '...</h1>\n';
	content += '<textarea id="editor">' + markup + '</textarea>\n';
	content += '<div><button onclick="save()">Save</button></div>\n';
	display(content);
}

function save() {
	let page = document.querySelector('#pagename').innerHTML;
	let markup = document.querySelector('#editor').value;
	let page_path = path.join(pages_dir_path, page);
	fs.writeFileSync(page_path, markup);
	view(page);
}
