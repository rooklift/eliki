"use strict";

const electron = require("electron");
const page_io = require("./page_io");
const marked = require("marked");


const magic_left  = "db73nx91izs7d8egr2gu283a9gh";
const magic_right = "b6x9ahr12fgf20fg2f82f7ofg48";


exports.new_page = function(title, special) {

	return Object.assign(Object.create(page_prototype), {
		title: title,
		markdown: null,
		html: null,
		special: special ? true : false,
	});
	
};


const page_prototype = {				// We also set this.html, which requires multiple steps...

	set_markdown: function(s) {

		this.markdown = s;

		// 1. Escaping for HTML safety:

		s = s.replace(/&/g, `&amp;`);
		s = s.replace(/</g, `&lt;`);
		s = s.replace(/>/g, `&gt;`);
		s = s.replace(/'/g, `&apos;`);
		s = s.replace(/"/g, `&quot;`);

		// 2. Markdown parser:

		s = marked.marked(s);

		// 3. Obfuscate [[stuff like this]] from <code> tags so it doesn't get turned into internal links later.
		// I can't see a better way to do this than creating a DOM and finding the <code> tags that way:

		let foo = document.createElement("html");
		foo.innerHTML = s;

		for (let item of foo.getElementsByTagName("code")) {
			item.innerHTML = item.innerHTML.replace(/\[\[(.*?)\]\]/g, `${magic_left}$1${magic_right}`);
		}

		s = foo.innerHTML;			// So after this point, we are once again working on a string, not a DOMish thing.

		// 4. Parse actual internal links:

		s = s.replace(/\[\[(.*?)\]\]/g, `<span class="internal">$1</span>`);

		// 5. Restore [[stuff]] which we obfuscated above:

		let regex = new RegExp(`${magic_left}(.*?)${magic_right}`, "g");

		s = s.replace(regex, `[[$1]]`);

		// 6. Done:

		this.html = s;
	},

	autoload: function() {
		this.set_markdown(page_io.load(this.title));
	},

	autosave: function() {
		page_io.save(this.title, this.markdown);
	},

	render: function() {

		let everything = "";

		everything += `<h1 class="top"><span id="title">${this.title}</span> ${!this.special ? `[<span id="editbutton">edit</span>]` : ""}</h1>\n`;
		everything += `<hr />`;
		everything += this.html;

		document.body.innerHTML = everything;			// Do this first so the getElement lookups below work.

		// ---

		let editbutton = document.getElementById("editbutton");

		if (editbutton) {
			editbutton.addEventListener("click", () => {
				eliki.edit();
			});
		}

		let int_links = document.getElementsByClassName("internal");

		for (let item of int_links) {
			item.addEventListener("click", () => {
				eliki.go(item.innerHTML);
			});
		}

		let ext_links = document.getElementsByTagName("a");

		for (let item of ext_links) {
			item.addEventListener("click", (event) => {
				event.preventDefault();
				electron.shell.openExternal(item.href);
			});
		}

	},

	edit: function() {

		if (this.special) {
			alert("Cannot edit special pages.");
			return;
		}

		let everything = "";

		everything += `<h1 class="top">Editing <span id="title">${this.title}</span></h1>\n`;
		everything += `<button id="savebutton">Save</button> &nbsp; <button id="cancelbutton">Cancel</button><br><br>\n`;
		everything += `<textarea id="editor"></textarea>\n`;

		document.body.innerHTML = everything;						// Do this first so the getElement lookups below work.

		// ---

		let editor = document.getElementById("editor");
		editor.style.height = Math.max(window.innerHeight - editor.getBoundingClientRect().top - 48, 100).toString() + "px";
		editor.value = this.markdown;

		editor.addEventListener("keydown", (event) => {				// This allows the tab key to be used in the textarea.
			if (event.which === 9) {
				event.preventDefault();
				document.execCommand("insertText", false, "\t");
			}
		});

		document.getElementById("savebutton").addEventListener("click", () => {
			let editor = document.getElementById("editor");
			if (editor) {
				this.set_markdown(editor.value);
				this.autosave();
				this.render();
			}
		});

		document.getElementById("cancelbutton").addEventListener("click", () => {
			this.render();
		});
	},

};
