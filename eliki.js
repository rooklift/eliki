"use strict";

const fs = require('fs');
const path = require('path');
const app = require('electron').remote.app;
const ipcRenderer = require('electron').ipcRenderer;
const shell = require('electron').shell;
const alert = require('./modules/alert.js').alert;

// -----------------------------------------------------------------------------

const userdata_path = app.getPath('userData');
const pages_dir_path = path.join(userdata_path, 'pages');

// -----------------------------------------------------------------------------

ipcRenderer.on('view', (event, arg) => {
	view(arg);
});

make_pages_dir();
view('Index');

// -----------------------------------------------------------------------------

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

	// Handle [[links]]

	while (1) {
		let m = markup.match(/(\[\[.*?\]\])/);
		if (m === null) {
			break;
		}
		let inner = m[1].slice(2, -2);
		inner = sanitise(inner);
		markup = markup.replace(m[1], `<a href="#" onclick="view('${inner}'); return false;">${inner}</a>`);
	}

	// Handle newlines

	while (1) {
		let m = markup.match(/(\n)/);
		if (m === null) {
			break;
		}
		markup = markup.replace(m[1], '<br>');
	}

	return markup;
}

function display(content) {
	document.querySelector('#content').innerHTML = content;
	fix_a_tags();
}

function view(page) {
	let markup = '';
	let page_path = path.join(pages_dir_path, page.toLowerCase());
	if (fs.existsSync(page_path)) {
		markup = fs.readFileSync(page_path, 'UTF8');
	}

	let content = '';
	content += `<h1><span id="title">${page}</span> &nbsp; [<a href="#" onclick="edit('${page}'); return false;">edit</a>]</h1>`;
	content += parse_markup(markup);
	display(content);
}

function edit(page) {
	let page_path = path.join(pages_dir_path, page.toLowerCase());

	if (fs.existsSync(page_path)) {
		let markup = fs.readFileSync(page_path, 'UTF8');
		make_editor(page, markup);
	} else {
		make_editor(page, '');
	}
}

function make_editor(page, markup) {
	let content = '';
	content += `<h1>Editing <span id="title">${page}</span></h1>`;
	content += `<div><button onclick="save('${page}')">Save</button> &nbsp; <button onclick="view('${page}')">Cancel</button><br><br></div>`;
	content += `<div id="editordiv"><textarea id="editor">${markup}</textarea></div>`;
	display(content);
}

function save(page) {
	let markup = document.querySelector('#editor').value;
	let page_path = path.join(pages_dir_path, page.toLowerCase());
	fs.writeFileSync(page_path, markup, 'UTF8');
	view(page);
}

function fix_a_tags() {

	// Change <a> tags in the document -- if href is not "#" -- to open in external browser.

	let a_tags = document.getElementsByTagName("a");
	for (let i = 0; i < a_tags.length; i++) {
		if (a_tags[i].getAttribute('href') !== '#') {
			a_tags[i].setAttribute('onclick', `shell.openExternal('${a_tags[i].href}'); return false;`);
			a_tags[i].href = '#';
		}
	}
}
