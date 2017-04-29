# Eliki

* Eliki is a personal wiki in Electron.

# Security Warnings

* This is a hobby project and *not safe against malicious inputs*.
* Simply inserting `<script>` blocks into your wiki isn't enough to get them to run, however.
* An actual hack would be `<img src="whatever.gif" onerror="alert('hi');" />`

# Wiki Notes

* Internal wikilinks are formatted [[like so]].
* Page titles are not case-sensitive.
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

* [marked](https://www.npmjs.com/package/marked)
