"use strict";

const fs = require('fs');
const path = require('path');
const app = require('electron').remote.app;
const ipcRenderer = require('electron').ipcRenderer;
const shell = require('electron').shell;
const marked = require('marked');
const alert = require('./modules/alert.js').alert;

// -----------------------------------------------------------------------------

const userdata_path = app.getPath('userData');
const pages_dir_path = path.join(userdata_path, 'pages');

// -----------------------------------------------------------------------------

ipcRenderer.on('view', (event, arg) => {
	view(arg);
});

ipcRenderer.on('list_all_pages', (event, arg) => {
	list_all_pages();
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

	// There are likely some dangers if we allow interesting characters.
	// e.g. escaping the directory or confusing the inlined JS in the HTML.

	let result = '';
	for (let n = 0; n < s.length; n++) {
		let c = s.charAt(n);
		if (c.match(/[a-zA-Z0-9 ]/)) {		// So just allow alphanumeric plus space.
			result += c;
		}
	}

	if (result.length > 255) {
		result = result.slice(0, 255);
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
		let target = m[1].slice(2, -2);
		target = sanitise(target);
		markup = markup.replace(m[1], `<a href="#" onclick="view('${target}'); return false;">${target}</a>`);
	}

	// Handle Markdown

	markup = marked(markup);

	return markup;
}

function display(content) {
	document.querySelector('#content').innerHTML = content;
	fix_a_tags();
}

function view(page) {
	page = sanitise(page);

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
	page = sanitise(page);

	let page_path = path.join(pages_dir_path, page.toLowerCase());

	if (fs.existsSync(page_path)) {
		let markup = fs.readFileSync(page_path, 'UTF8');
		make_editor(page, markup);
	} else {
		make_editor(page, '');
	}
}

function make_editor(page, markup) {
	page = sanitise(page);

	let content = '';
	content += `<h1>Editing <span id="title">${page}</span></h1>`;
	content += `<div><button onclick="save('${page}')">Save</button> &nbsp; <button onclick="view('${page}')">Cancel</button><br><br></div>`;
	content += `<div id="editordiv"><textarea id="editor"></textarea></div>`;
	display(content);
	document.querySelector('#editor').value = markup;
}

function save(page) {
	page = sanitise(page);

	let page_path = path.join(pages_dir_path, page.toLowerCase());
	let markup = document.querySelector('#editor').value;

	try {
		if (markup.trim() === '') {
			fs.unlinkSync(page_path);
		} else {
			fs.writeFileSync(page_path, markup, 'UTF8');
		}
	} catch(err) {
    	// This can happen when we try to unlink a non-existant file.
	}

	view(page);
}

function fix_a_tags() {

	// Change <a> tags in the document -- if href is not "#" -- to open in external browser.

	let a_tags = document.getElementsByTagName("a");
	for (let i = 0; i < a_tags.length; i++) {
		if (a_tags[i].getAttribute('href') !== '#') {
			a_tags[i].setAttribute('onclick', `shell.openExternal('${a_tags[i].href}'); return false;`);
			a_tags[i].setAttribute('class', 'external');
			a_tags[i].setAttribute('href', '#');
		}
	}
}

function list_all_pages() {
	let all_pages = fs.readdirSync(pages_dir_path);
	all_pages.sort();
	let content = '';
	content += `<h1>Special: <span id="title">All Pages</span></h1>`;
	content += `<ul>`;
	for (let n = 0; n < all_pages.length; n++) {
		let target = all_pages[n];
		content += `<li><a href="#" onclick="view('${target}'); return false;">${target}</a></li>`;
	}
	content += `</ul>`;
	display(content);
}
