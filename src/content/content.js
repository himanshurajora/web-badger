/* Constants */
const TAG_ID = 'website-color-tagger-tag';

/* State */
let currentSettings = null;
let currentDomain = null;
let tagElement = null;

/* Functions */
function removeTag() {
    if (tagElement) {
        tagElement.remove();
        tagElement = null;
    }
}

function createOrUpdateTag() {
    if (!currentSettings || !currentDomain) {
        removeTag();
        return;
    }

    const { globalEnabled, domains } = currentSettings;
    const domainSettings = domains[currentDomain];

    if (!globalEnabled || !domainSettings || !domainSettings.enabled) {
        removeTag();
        return;
    }

    const color = domainSettings.color || getDefaultColor(currentDomain);
    const label = domainSettings.label || getDefaultLabel(currentDomain);

    if (!tagElement) {
        tagElement = document.createElement('div');
        tagElement.id = TAG_ID;
        document.body.appendChild(tagElement);
    }

    tagElement.textContent = label;
    tagElement.style.backgroundColor = color;
    tagElement.style.display = 'block'; // Ensure it's visible
}

async function initialize() {
    // Get the domain for the current page
    // Note: Using document.location.href might be blocked by CSP on some sites.
    // Relying on background script might be more reliable if issues arise.
    currentDomain = getDomainFromUrl(document.location.href);

    if (!currentDomain) {
        // console.log("Could not determine domain for tag.");
        return; // Cannot proceed without a domain
    }

    // Fetch initial settings
    try {
        // Directly call getSettings if utils.js is loaded
        currentSettings = await getSettings();
        createOrUpdateTag(); // Create tag based on initial settings
    } catch (error) {
        console.error("Error fetching initial settings:", error);
        // Attempt to get settings via message passing as fallback
        chrome.runtime.sendMessage({ action: "getSettings" }, (response) => {
            if (chrome.runtime.lastError) {
                console.error("Error sending message to background:", chrome.runtime.lastError.message);
                return;
            }
            if (response && response.status === "success") {
                currentSettings = response.settings;
                createOrUpdateTag();
            } else {
                console.error("Failed to get settings from background:", response);
            }
        });
    }
}

/* Event Listeners */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "settingsUpdated") {
        currentSettings = request.settings;
        createOrUpdateTag(); // Re-evaluate tag based on new settings
        sendResponse({ status: "success" }); // Acknowledge message
    }
    return true;
});

// --- Initialization --- 
// Use DOMContentLoaded or run_at: document_idle if issues arise with body availability
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
} else {
    initialize();
} 