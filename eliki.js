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

function sanitise(s) {
	let result = '';
	for (let n = 0; n < s.length; n++) {
		let c = s.charAt(n);
		if (c.match(/[a-zA-Z0-9]/)) {
			result += c;
		}
	}
	return result;
}

function parse_markup(markup) {
	while (1) {
		let m = markup.match(/(\[\[.*?\]\])/);
		if (m === null) {
			break;
		}
		let inner = m[1].slice(2, -2);
		inner = sanitise(inner);
		markup = markup.replace(m[1], '<a href="#" onclick="view(\'' + inner + '\');return false;">' + inner + '</a>');
	}
	return markup;
}

function display(content) {
	document.querySelector('#content').innerHTML = content;
}

function view(page) {
	let markup = '';
	let page_path = path.join(pages_dir_path, page);
	if (fs.existsSync(page_path)) {
		markup = fs.readFileSync(page_path, "UTF8");
	}

	let content = '';
	content += '<div id="pagename" style="display: none">' + page + '</div>\n';
	content += '<h1>' + page + ' &nbsp; [<a href="#" onclick="edit();return false;">edit</a>]</h1>'
	content += parse_markup(markup);
	display(content);
}

function edit(page) {
	if (page === undefined) {
		page = document.querySelector('#pagename').innerHTML;
	}

	let page_path = path.join(pages_dir_path, page);

	if (fs.existsSync(page_path)) {
		let markup = fs.readFileSync(page_path, "UTF8");
		make_editor(page, markup);
	} else {
		make_editor(page, '');
	}
}

function make_editor(page, markup) {
	let content = '';
	content += '<div id="pagename" style="display: none">' + page + '</div>\n';
	content += '<h1>Editing ' + page + '...</h1>\n';
	content += '<div><button onclick="save()">Save</button><br><br></div>\n';
	content += '<div id="editordiv"><textarea id="editor">' + markup + '</textarea></div>\n';
	display(content);
}

function save() {
	let page = document.querySelector('#pagename').innerHTML;
	let markup = document.querySelector('#editor').value;
	let page_path = path.join(pages_dir_path, page);
	fs.writeFileSync(page_path, markup, "UTF8");
	view(page);
}
