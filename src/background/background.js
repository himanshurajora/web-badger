// Listens for messages from other parts of the extension (e.g., popup)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getSettings") {
        getSettings().then(settings => {
            sendResponse({ status: "success", settings });
        });
        return true; // Indicates asynchronous response
    } else if (request.action === "saveSettings") {
        saveSettings(request.settings).then(() => {
            sendResponse({ status: "success" });
            // Notify relevant tabs about the settings change
            notifyTabsAboutSettingsChange(request.settings);
        });
        return true; // Indicates asynchronous response
    } else if (request.action === "getCurrentTabDomain") {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs.length > 0 && tabs[0].url) {
                const domain = getDomainFromUrl(tabs[0].url);
                if (domain) {
                    sendResponse({ status: "success", domain });
                } else {
                    sendResponse({ status: "error", message: "Could not determine domain" });
                }
            } else {
                sendResponse({ status: "error", message: "No active tab found or URL missing" });
            }
        });
        return true; // Indicates asynchronous response
    }
});

// Function to notify content scripts on relevant tabs
async function notifyTabsAboutSettingsChange(settings) {
    chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
            const domain = getDomainFromUrl(tab.url);
            if (domain && (settings.domains[domain] || settings.globalEnabled)) {
                 // Only notify tabs whose domain is affected or if global setting changed
                chrome.tabs.sendMessage(tab.id, { action: "settingsUpdated", settings }).catch(error => {
                    // Catch errors if the content script isn't ready or the tab is closed
                    if (error.message.includes("Receiving end does not exist")) {
                       // console.log(`Content script not ready or tab closed for tab ID: ${tab.id}`);
                    } else {
                        console.error(`Error sending message to tab ${tab.id}:`, error);
                    }
                });
            }
        });
    });
}

// Import necessary functions (assuming utils.js is accessible)
// Note: In MV3 service workers, dynamic imports or script concatenation might be needed
// For simplicity, assuming utils.js functions are available globally or via importScripts if needed.
// If utils.js is not directly available, you'll need to adjust how getSettings, saveSettings, getDomainFromUrl are accessed.
// Example using importScripts (place at the top of background.js):
try {
  importScripts('../common/utils.js');
} catch (e) {
  console.error("Failed to import utils.js:", e);
}

// Initial setup or checks when the extension starts (optional)
// console.log("Website Color Tagger - Background service started."); 