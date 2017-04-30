"use strict";

const alert = require('./modules/alert.js').alert;
const app = require('electron').remote.app;
const escape = require('escape-html');
const fs = require('fs');
const ipcRenderer = require('electron').ipcRenderer;
const marked = require('marked');
const path = require('path');
const sanitize = require('sanitize-filename');
const shell = require('electron').shell;
const unescape = require('unescape-html');

// -----------------------------------------------------------------------------

marked.setOptions({sanitize: true});	// Important!

const userdata_path = app.getPath('userData');
const pages_dir_path = path.join(userdata_path, 'pages');

// -----------------------------------------------------------------------------

let eliki = {

	page: "",		// Page name this.go() was called with
	escaped: "",	// Escaped version of the page name
	filename: "",	// Page name with only alphanumeric chars (plus space)
	filepath: "",	// Complete path for the file we are dealing with
	internal: [],	// All internal links
	external: [],	// All external links
	markup: "",		// Markup read from the file
	content: "",	// Result after parsing the markup

	go: function(s) {
		if (s === undefined) {
			s = this.page;
		}
		if (typeof s === 'number') {
			s = this.internal[s];
		}
		this.page = s;
		this.escaped = escape(s);
		this.set_paths();

		if (this.filename === '') {
			alert("Tried to go to <empty string>");
			this.go("Index");
		}

		if (fs.existsSync(this.filepath)) {
			this.markup = fs.readFileSync(this.filepath, 'UTF8');
		} else {
			this.markup = ''
		}
		this.parse();
		this.view();
	},

	set_paths: function() {
		let page_lower = this.page.toLowerCase();
		this.filename = sanitize(page_lower);
		this.filepath = path.join(pages_dir_path, this.filename);
	},

	parse: function() {

		let result = this.markup;
		result = marked(result);

		// Each internal [[link]] gets put in the array of links, so
		// they can be referred to by number, which is safer.

		this.internal = [];

		while (1) {
			let m = result.match(/(\[\[.*?\]\])/);
			if (m === null) {
				break;
			}

			// marked is set (elsewhere) to sanitize input, i.e. escape HTML chars.
			// So for our records, we must unescape them.

			let target_escaped = m[1].slice(2, -2);
			let target_raw = unescape(target_escaped);
			this.internal.push(target_raw);

			let id = this.internal.length - 1;
			result = result.replace(m[1], `<a href="#" onclick="eliki.go(${id}); return false;">${target_escaped}</a>`);
		}

		this.content = result;
	},

	view: function() {
		let everything = '';
		everything += `<h1><span id="title"></span> &nbsp; [<a href="#" onclick="eliki.edit(); return false;">edit</a>]</h1>`;
		everything += this.content;
		document.querySelector('#everything').innerHTML = everything;
		document.querySelector('#title').innerHTML = this.escaped;

		// We replace all external <a> tags with calls to this.open_external()
		// storing targets in the this.external array so we can refer by number...

		this.external = [];

		let a_tags = document.getElementsByTagName("a");

		for (let i = 0; i < a_tags.length; i++) {
			if (a_tags[i].getAttribute('href') !== '#') {
				let target = encodeURI(a_tags[i].getAttribute('href'))
				this.external.push(target);
				let id = this.external.length - 1;
				a_tags[i].setAttribute('onclick', `eliki.open_external(${id}); return false;`);
				a_tags[i].setAttribute('class', 'external');
				a_tags[i].setAttribute('href', '#');
			}
		}
	},

	edit: function() {
		let everything = '';
		everything += `<h1>Editing <span id="title"></span></h1>`;
		everything += `<div><button onclick="eliki.save()">Save</button> &nbsp; <button onclick="eliki.go()">Cancel</button><br><br></div>`;
		everything += `<div id="editordiv"><textarea id="editor"></textarea></div>`;
		document.querySelector('#everything').innerHTML = everything;
		document.querySelector('#editor').value = this.markup;
		document.querySelector('#title').innerHTML = this.escaped;
		allow_tabs();
	},

	save: function() {
		let new_markup = document.querySelector('#editor').value;
		if (new_markup.trim() === '') {
			if (fs.existsSync(this.filepath)) {
				fs.unlinkSync(this.filepath);
			}
		} else {
			fs.writeFileSync(this.filepath, new_markup, 'UTF8');
		}
		this.go();
	},

	open_external: function(i) {
		try {
			shell.openExternal(this.external[i]);
		} catch (err) {
			// I dunno what could go wrong.
		}
	}
}

// -----------------------------------------------------------------------------

function allow_tabs() {

	// http://stackoverflow.com/questions/22668818/undo-tab-in-textarea
	// Maybe Chrome specific, but this is Chrome, so...

	let ta = document.querySelector("#editor");
	ta.addEventListener("keydown", function(e) {
		if (e.which === 9) {
			e.preventDefault();
			document.execCommand("insertText", false, "\t");
		}
	}, false);
}

function list_all_pages() {
	let all_pages = fs.readdirSync(pages_dir_path);
	all_pages.sort();
	let everything = '';
	everything += `<h1>Special: <span id="title">All Pages</span></h1>`;
	everything += `<ul>`;
	for (let n = 0; n < all_pages.length; n++) {
		let target = all_pages[n];
		everything += `<li><a href="#" onclick="eliki.go('${escape(target)}'); return false;">${escape(target)}</a></li>`;
	}
	everything += `</ul>`;
	document.querySelector('#everything').innerHTML = everything;
}

// -----------------------------------------------------------------------------

ipcRenderer.on('view', (event, arg) => {
	eliki.go(arg);
});

ipcRenderer.on('list_all_pages', (event, arg) => {
	list_all_pages();
});

if (fs.existsSync(pages_dir_path) === false) {
	fs.mkdirSync(pages_dir_path);
}

eliki.go("Index");
