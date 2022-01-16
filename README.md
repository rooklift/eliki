# Eliki

* Eliki is a personal wiki in Electron.

# Wiki Notes

* Pages are stored as individual files.
* Page titles are not case-sensitive but will purge some characters not allowed in filenames.
* Internal wikilinks are formatted [[like so]].
* Everything else you write will be interpreted as Markdown.
* External links are opened in your main web browser.

# Example Page

```
Eliki *example* page...

# Internal links

* [[Dog]]
* [[Cat]]

# External links

* [Eliki Project](https://github.com/rooklift/eliki)
```

# Building

* npm install
* electron .

# Dependencies

* [marked](https://www.npmjs.com/package/marked)
