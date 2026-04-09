# Local Dev Resource Redirect

## Purpose
This Chrome extension intercepts network requests for specific production JavaScript (JS) and Cascading Style Sheet (CSS) files and redirects them to a local development server. It allows developers to test local code changes against a live production environment without modifying the production server's HTML.

## Installation
To install and use this extension in Google Chrome, follow these steps:

1.  Navigate to `chrome://extensions` in your browser.
2.  Enable **"Developer mode"** using the toggle switch in the top-right corner of the page.
3.  Click the **"Load unpacked"** button that appears on the top-left.
4.  In the file selection dialog, select the folder containing the extension's source code (the folder with `manifest.json`, `background.js`, and this `README.md`).
5.  The extension will now appear in your list of installed extensions. You can toggle it on or off from this page as needed.
