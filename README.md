# Eliki

* Eliki is a personal wiki in Electron.

# Wiki Notes

* Internal wikilinks are formatted [[like so]].
* Pages are stored as individual files.
* Page titles are not case-sensitive but will purge some characters not allowed in filenames.
* Everything you write will be interpreted as Markdown.
* External links are opened in your main web browser.

# Example Page

```
Eliki *example* page...

# Internal links

* [[Dog]]
* [[Cat]]

# External links

* [Eliki Project](https://github.com/fohristiwhirl/eliki)
```

# Building

* npm install
* electron .

# Dependencies

* [escape-html](https://www.npmjs.com/package/escape-html)
* [marked](https://www.npmjs.com/package/marked)
* [sanitize-filename](https://www.npmjs.com/package/sanitize-filename)
* [unescape-html](https://www.npmjs.com/package/unescape-html)
