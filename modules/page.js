"use strict";

const page_io = require("./page_io");
const marked = require("marked");


exports.new_page = function(title) {

	return Object.assign(Object.create(page_prototype), {
		title: title,
		markdown: null,
		html: null,
	});
	
};


const page_prototype = {

	set_markdown: function(s) {
		this.markdown = s;
		this.html = marked.marked(this.markdown);
	},

	autoload: function() {
		this.set_markdown(page_io.get(this.title));
	},

	autosave: function() {
		page_io.save(this.title, this.markdown);
	},

	render: function() {

		let everything = "";

		everything += `<h1 class="top"><span id="title">${this.title}</span> [<a id="editbutton" href="#">edit</a>]</h1>\n`;
		everything += `<hr />`;
		everything += this.html;

		document.getElementById("content").innerHTML = everything;			// Do this first so the getElement lookups below work.

		document.getElementById("editbutton").addEventListener("click", () => {
			eliki.edit();
		});
		
	},

	edit: function() {

		let everything = "";

		everything += `<h1 class="top">Editing <span id="title">${this.title}</span></h1>\n`;
		everything += `<button id="savebutton">Save</button> &nbsp; <button id="cancelbutton">Cancel</button><br><br>\n`;
		everything += `<textarea id="editor"></textarea>\n`;

		document.getElementById("content").innerHTML = everything;			// Do this first so the getElement lookups below work.

		document.getElementById("editor").value = this.markdown;

		document.getElementById("savebutton").addEventListener("click", () => {
			let editor = document.getElementById("editor");
			if (editor) {
				this.set_markdown(editor.value);
				this.autosave();
				this.render();
			}
		});

		document.getElementById("cancelbutton").addEventListener("click", () => {
			eliki.go(this.title);
		});
	},

};
