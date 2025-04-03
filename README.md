# Website Color Tagger

A simple browser extension to visually tag websites with customizable colored labels.
Helps distinguish between different environments (e.g., dev, staging, prod) or similar-looking sites.

## Features

*   Adds a colored tag to the top-left of configured web pages.
*   Globally enable/disable the extension.
*   Enable/disable tags on a per-domain basis.
*   Customize tag color and label for each domain.
*   Automatic default color generation based on domain name.
*   Automatic default label generation (first 2 letters of domain).
*   Dark/Light mode support for the popup configuration.
*   Settings are synced across devices (if browser sync is enabled).
*   Option to reset settings per-site or globally.

## How to Use

1.  Install the extension.
2.  Click the extension icon in your browser toolbar to open the configuration popup.
3.  The popup shows settings for the **current website** you are visiting.
4.  **Enable Tag for this Site**: Check this box to activate the tag for the current domain.
5.  **Customize Label**: Enter a short text label (e.g., DEV, STAGE, PROD).
6.  **Customize Color**: Pick a color for the tag.
7.  Click **Save Site Settings**.
8.  The tag should now appear on the website (you might need to refresh the page).
9.  Use the **Global Settings** toggle to turn the entire extension on or off.
10. Manage all your configured sites under the **Configured Sites** section.
11. Use the **Reset** buttons carefully!

## Development

1.  Clone the repository.
2.  Load the extension in your browser (usually via `chrome://extensions/` or `about:debugging` and selecting "Load Unpacked").
3.  Make changes to the code.
4.  Reload the extension in your browser to see the changes.

## Files

*   `manifest.json`: Extension configuration.
*   `icons/`: Extension icons.
*   `src/background/background.js`: Background service worker (manages state, storage, communication).
*   `src/content/content.js`: Injected into web pages to display the tag.
*   `src/content/content.css`: Styles for the injected tag.
*   `src/popup/popup.html`: HTML structure for the configuration popup.
*   `src/popup/popup.css`: Styles for the popup (including light/dark themes).
*   `src/popup/popup.js`: JavaScript logic for the popup UI.
*   `src/common/utils.js`: Shared utility functions (settings management, defaults, etc.).
*   `README.md`: This file. 