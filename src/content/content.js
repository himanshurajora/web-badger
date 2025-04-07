/* Constants */
const TAG_ID = 'website-color-tagger-tag';

/* State */
let currentSettings = null;
let currentDomain = null;
let tagElement = null;
let originalPositionClass = null; // Store the original position for hover reset
let mouseEnterListener = null; // Store listener references for removal
let mouseLeaveListener = null;

/* Functions */
function removeTag() {
    if (tagElement) {
        // Remove event listeners if they exist
        if (mouseEnterListener) {
            tagElement.removeEventListener('mouseenter', mouseEnterListener);
            mouseEnterListener = null;
        }
        if (mouseLeaveListener) {
            tagElement.removeEventListener('mouseleave', mouseLeaveListener);
            mouseLeaveListener = null;
        }
        tagElement.remove();
        tagElement = null;
        originalPositionClass = null;
    }
}

function getOppositePosition(position) {
    switch (position) {
        case 'top-left': return 'bottom-right';
        case 'top-right': return 'bottom-left';
        case 'bottom-left': return 'top-right';
        case 'bottom-right': return 'top-left';
        default: return 'top-left'; // Fallback
    }
}

function applyTagStyles(config) {
    if (!tagElement) return;

    console.log('Applying tag styles with config:', config);
    const style = tagElement.style;

    // --- Apply styles via CSS Variables --- 

    // Background - Apply CSS variables first
    style.setProperty('--wct-bg-color', config.background.color);
    style.setProperty('--wct-bg-gradient', 'none'); // Default to no gradient
    
    // Then apply direct styles which have higher precedence
    if (config.background.gradient && config.background.gradient.enabled) {
        const gradientValue = `linear-gradient(${config.background.gradient.angle}deg, ${config.background.gradient.color1}, ${config.background.gradient.color2})`;
        style.setProperty('--wct-bg-gradient', gradientValue);
        style.background = gradientValue; // Direct gradient application
    } else {
        // Direct solid color application
        style.background = config.background.color;
    }

    // Font
    style.setProperty('--wct-font-color', config.font.color);
    style.setProperty('--wct-font-size', config.font.size);
    style.setProperty('--wct-font-weight', config.font.weight);
    style.setProperty('--wct-font-family', config.font.family || 'sans-serif');

    // Size & Opacity
    style.setProperty('--wct-width', config.size.width);
    style.setProperty('--wct-height', config.size.height);
    style.setProperty('--wct-opacity', config.opacity);

    // Border
    style.setProperty('--wct-border-width', `${config.border.width}px`);
    style.setProperty('--wct-border-style', config.border.style);
    style.setProperty('--wct-border-color', config.border.color);
    style.setProperty('--wct-border-radius', config.border.radius);

    // Padding (adjust for circle shape)
    const padding = (config.shape === 'circle') ? '0' : '5px 10px'; // Example padding, could be configurable
    style.setProperty('--wct-padding', padding);
    
    // Set transition duration based on hover effect
    // For move-opposite-corner, we need no transition
    if (config.effects.hover === 'move-opposite-corner') {
        style.setProperty('--wct-transition-duration', '0s');
    } else {
        style.setProperty('--wct-transition-duration', '0.2s');
    }

    // --- Apply classes for state/variation --- 
    tagElement.className = ''; // Clear previous classes
    console.log('Setting position class:', config.position);

    // Position
    tagElement.classList.add(`position-${config.position}`);

    // Shape
    tagElement.classList.add(`shape-${config.shape}`);

    // Animation (add after a short delay to ensure transition works)
    const animationClass = config.effects.animation !== 'none' ? `animate-${config.effects.animation}` : null;
    if (animationClass) {
        // Add animation class slightly after display to trigger it
        setTimeout(() => {
            if(tagElement) tagElement.classList.add(animationClass);
        }, 50);
    }

    // Hover Effects
    // Remove existing listeners first
    if (mouseEnterListener) {
        tagElement.removeEventListener('mouseenter', mouseEnterListener);
        mouseEnterListener = null;
    }
    if (mouseLeaveListener) {
        tagElement.removeEventListener('mouseleave', mouseLeaveListener);
        mouseLeaveListener = null;
    }

    if (config.effects.hover === 'move-opposite-corner') {
        // Get current position from the config
        let currentPosition = config.position;
        
        // Define the cycle order
        const positionCycle = {
            'top-left': 'top-right',
            'top-right': 'bottom-right',
            'bottom-right': 'bottom-left',
            'bottom-left': 'top-left'
        };
        
        mouseEnterListener = () => {
            if (!tagElement) return;
            
            // Disable transitions for instant position change
            tagElement.style.transition = 'none';
            
            // Get current position from class list
            const currentPositionClass = Array.from(tagElement.classList)
                .find(cls => cls.startsWith('position-'));
            
            if (currentPositionClass) {
                currentPosition = currentPositionClass.replace('position-', '');
                tagElement.classList.remove(currentPositionClass);
            }
            
            // Get next position in cycle
            currentPosition = positionCycle[currentPosition] || 'top-left';
            
            // Update the config with the new position
            // This makes the position "sticky" after hover
            if (currentSettings && currentSettings.domains && currentDomain && 
                currentSettings.domains[currentDomain]) {
                // Update config in memory
                currentSettings.domains[currentDomain].position = currentPosition;
                // Update the storage asynchronously to remember the position
                saveSettings(currentSettings).catch(e => console.error("Error saving position:", e));
            }
            
            // Apply new position class
            tagElement.classList.add(`position-${currentPosition}`);
            
            // Force reflow to ensure position change happens before re-enabling transitions
            void tagElement.offsetWidth;
            
            // Restore original transitions
            setTimeout(() => {
                tagElement.style.transition = '';
            }, 50);
        };
        
        tagElement.addEventListener('mouseenter', mouseEnterListener);
    } else if (config.effects.hover === 'change-opacity') {
        tagElement.classList.add('hover-change-opacity');
    } else if (config.effects.hover === 'grow') {
        tagElement.classList.add('hover-grow');
    }
    // 'none' hover doesn't need a class or listener

}

function createOrUpdateTag() {
    if (!currentSettings || !currentDomain) {
        removeTag();
        return;
    }

    const { globalEnabled, domains } = currentSettings;
    const savedDomainConfig = domains?.[currentDomain];
    const defaultDomainConfig = getDefaultDomainConfig(currentDomain);

    // *** Corrected: Deep merge saved config onto defaults ***
    // This ensures all properties exist for styling, using saved values where available.
    const effectiveConfig = {
        ...defaultDomainConfig,
        ...(savedDomainConfig || {}),
        size: { ...defaultDomainConfig.size, ...(savedDomainConfig?.size || {}) },
        font: { ...defaultDomainConfig.font, ...(savedDomainConfig?.font || {}) },
        background: {
            ...defaultDomainConfig.background,
            ...(savedDomainConfig?.background || {}),
            // Ensure gradient object exists and merges properly
            gradient: {
                ...defaultDomainConfig.background.gradient,
                ...(savedDomainConfig?.background?.gradient || {})
            }
        },
        border: { ...defaultDomainConfig.border, ...(savedDomainConfig?.border || {}) },
        effects: { ...defaultDomainConfig.effects, ...(savedDomainConfig?.effects || {}) },
        // Ensure 'enabled' comes from saved config if it exists, otherwise default is false.
        enabled: savedDomainConfig ? savedDomainConfig.enabled : defaultDomainConfig.enabled
    };

    // Check if tag should be displayed (using the merged config's enabled status)
    if (!globalEnabled || !effectiveConfig.enabled) {
        removeTag();
        return;
    }

    // Tag element creation
    if (!tagElement) {
        tagElement = document.createElement('div');
        tagElement.id = TAG_ID;
        // Append to body, might need different logic for shadow DOMs etc.
        if (document.body) {
             document.body.appendChild(tagElement);
        } else {
             // Fallback if body isn't ready? Should be handled by DOMContentLoaded
             document.addEventListener('DOMContentLoaded', () => document.body.appendChild(tagElement));
        }
    }

    // Set the label text
    tagElement.textContent = effectiveConfig.label;

    // Apply all styles and classes
    applyTagStyles(effectiveConfig);

    // Make tag visible
    tagElement.style.display = (effectiveConfig.shape === 'circle') ? 'flex' : 'block';
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