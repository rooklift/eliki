"use strict";

const WIKIPEDIA_BASE = "http://en.wikipedia.org/wiki/";

// -----------------------------------------------------------------------------

const alert = require('./modules/alert');
const escape = require('escape-html');
const fs = require('fs');
const ipcRenderer = require('electron').ipcRenderer;
const marked = require('marked');
const path = require('path');
const querystring = require('querystring');
const sanitize = require('sanitize-filename');
const shell = require('electron').shell;
const targz = require('targz');
const unescape = require('unescape-html');

marked.setOptions({sanitize: true, breaks: true});

const userdata_path = querystring.parse(global.location.search)["?user_data_path"];
const pages_dir_path = path.join(userdata_path, 'pages');

// -----------------------------------------------------------------------------

let eliki = {

	reset: function() {
		this.page = "";				// Page name this.go() was called with
		this.escaped = "";			// Escaped version of the page name
		this.filename = "";			// Page name with only alphanumeric chars (plus space)
		this.filepath = "";			// Complete path for the file we are dealing with

		this.markup = "";			// Markup read from the file
		this.content = "";			// Result after parsing the markup - but without fixing external links
		this.internal = [];			// All internal links
		this.external = [];			// All external links

		this.editable = false;		// Are we allowed to edit this
	},

	go: function(s) {

		if (s === undefined) {
			s = this.page;
		}
		if (typeof s === 'number') {
			s = this.internal[s];
		}

		this.setup(s);

		if (this.filename === '') {
			shell.beep();
			alert("Tried to go to <empty string>");
			this.go("Index");
		}

		if (fs.existsSync(this.filepath)) {
			this.markup = fs.readFileSync(this.filepath, 'UTF8');
		} else {
			this.markup = '';
		}

		this.editable = true;

		this.parse_and_view();
	},

	setup: function(s) {
		this.reset();
		this.page = s;
		this.escaped = escape(s);
		this.filename = sanitize(this.page.toLowerCase());
		this.filepath = path.join(pages_dir_path, this.filename);
	},

	parse: function() {

		let result = this.markup;

		// First convert [[w:links]] to external Markdown style:
		// [[w:Foo]] --> [Foo](http://en.wikipedia.org/wiki/Foo)

		while (1) {
			let m = result.match(/(\[\[w:.*?\]\])/);
			if (m === null) {
				break;
			}

			let subject = m[1].slice(4, -2);
			let url = WIKIPEDIA_BASE + subject;
			result = result.replace(m[1], "[" + subject + "](" + url + ")");
		}

		// Now apply the Markdown parser...

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
		if (this.editable) {
			if (this.content === "") {
				everything += '<h1 class="top"><span id="title"></span> &nbsp; [<a href="#" onclick="eliki.edit(); return false;">create</a>]</h1>\n<hr />';
			} else {
				everything += '<h1 class="top"><span id="title"></span> &nbsp; [<a href="#" onclick="eliki.edit(); return false;">edit</a>]</h1>\n<hr />';
			}
		} else {
			everything += '<h1 class="top">Special: <span id="title"></span></h1>\n<hr />';
		}
		everything += this.content;
		document.querySelector('#everything').innerHTML = everything;
		document.querySelector('#title').innerHTML = this.escaped;

		// We replace all external <a> tags with calls to this.open_external()
		// storing targets in the this.external array so we can refer by number...

		this.external = [];

		let a_tags = document.getElementsByTagName("a");

		for (let i = 0; i < a_tags.length; i++) {
			if (a_tags[i].getAttribute('href') !== '#') {
				let target = encodeURI(a_tags[i].getAttribute('href'));
				this.external.push(target);
				let id = this.external.length - 1;
				a_tags[i].setAttribute('onclick', `eliki.open_external(${id}); return false;`);
				a_tags[i].setAttribute('class', 'external');
				a_tags[i].setAttribute('href', '#');
			}
		}
	},

	parse_and_view: function() {
		this.parse();
		this.view();
	},

	edit: function() {
		if (this.editable === false) {
			shell.beep();
			alert("Cannot edit this page.");
			return;
		}
		let everything = '';
		everything += '<h1 class="top">Editing <span id="title"></span></h1>\n';
		everything += '<button onclick="eliki.save()">Save</button> &nbsp; <button onclick="eliki.go()">Cancel</button><br><br>\n';
		everything += '<textarea id="editor"></textarea>\n';
		document.querySelector('#everything').innerHTML = everything;
		document.querySelector('#editor').value = this.markup;
		document.querySelector('#title').innerHTML = this.escaped;
		allow_tabs();
		fix_textarea_height();
	},

	save: function() {
		let editor = document.querySelector('#editor');
		if (editor === null) {
			return;
		}
		let new_markup = editor.value.trim();
		if (new_markup === '') {
			if (fs.existsSync(this.filepath)) {
				fs.unlinkSync(this.filepath);
			}
		} else {
			fs.writeFileSync(this.filepath, new_markup, 'UTF8');
		}
		this.go();
	},

	source: function() {
		let everything = escape(document.querySelector('#everything').innerHTML).replace("\n", "<br>");
		document.querySelector('#everything').innerHTML = everything;
	},

	open_external: function(i) {
		let success = shell.openExternal(this.external[i]);
		if (success === false) {
			shell.beep();
			alert("Couldn't open. Invalid URL?");
		}
	},

	list_all_pages: function() {
		this.setup("List All Pages");

		let all_pages = fs.readdirSync(pages_dir_path);
		all_pages.sort();

		for (let n = 0; n < all_pages.length; n++) {
			this.markup += "* [[" + all_pages[n] + "]]\n";
		}

		this.parse_and_view();
	},

	archive: function() {

		alert("fixme");

		/*

		let filters = [{name: 'tar.gz', extensions: ['tar.gz']}];
		let target = dialog.showSaveDialog({filters: filters});

		if (target) {
			targz.compress({src: pages_dir_path, dest: target}, function(err) {
				if (err) {
					shell.beep();
					alert(err);
				}
			});
		}

		*/
	}
};

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

function fix_textarea_height() {
	let ta = document.querySelector("#editor");
	let ta_top = ta.getBoundingClientRect().top;
	let window_height = window.innerHeight;
	let new_ta_height = Math.floor(window_height - ta_top) - 50;
	new_ta_height = Math.max(new_ta_height, 100);
	ta.style.height = new_ta_height.toString() + "px";
}

// -----------------------------------------------------------------------------

ipcRenderer.on('edit', (event, arg) => {
	eliki.edit();
});

ipcRenderer.on('save', (event, arg) => {
	eliki.save();
});

ipcRenderer.on('view', (event, arg) => {
	eliki.go(arg);
});

ipcRenderer.on('source', (event, arg) => {
	eliki.source();
});

ipcRenderer.on('list_all_pages', (event, arg) => {
	eliki.list_all_pages();
});

ipcRenderer.on('archive', (event, arg) => {
	eliki.archive();
});

if (fs.existsSync(pages_dir_path) === false) {
	fs.mkdirSync(pages_dir_path);
}

eliki.go("Index");
