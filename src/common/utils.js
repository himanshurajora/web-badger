function hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
}

function intToHSL(integer) {
    const hash = Math.abs(integer);
    const hue = hash % 360;
    // Keep saturation and lightness somewhat constant but slightly varied
    const saturation = 70 + (hash % 15);
    const lightness = 50 + (hash % 10); // Brighter colors for visibility
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

function getDefaultColor(domain) {
    return intToHSL(hashCode(domain));
}

function getDefaultLabel(domain) {
    // Remove 'www.' if present
    const cleanedDomain = domain.startsWith('www.') ? domain.substring(4) : domain;
    // Take first two letters, or one if it's a short name
    const parts = cleanedDomain.split('.');
    const mainPart = parts[0];
    return mainPart.length >= 2 ? mainPart.substring(0, 2).toUpperCase() : mainPart.substring(0, 1).toUpperCase();
}

// NEW: Function to get default configuration for a domain
function getDefaultDomainConfig(domain) {
    return {
        enabled: false, // Defaults to disabled until explicitly enabled
        label: getDefaultLabel(domain),
        position: 'top-left',
        shape: 'rectangle',
        size: { width: 'auto', height: 'auto' },
        opacity: 1,
        font: {
            family: 'sans-serif',
            size: '12px',
            weight: 'bold',
            color: '#ffffff' // White text often contrasts well
        },
        background: {
            color: getDefaultColor(domain), // Use the generated default color
            gradient: {
                enabled: false,
                color1: getDefaultColor(domain),
                color2: '#000000', // Default second color, maybe adjust later
                angle: 45
            }
        },
        border: {
            width: 0, // No border by default
            style: 'none',
            color: '#000000',
            radius: '3px' // Slight rounding by default
        },
        effects: {
            animation: 'none',
            hover: 'none'
        }
    };
}

async function getSettings() {
    return new Promise((resolve) => {
        chrome.storage.sync.get('settings', (data) => {
            // Define the full default structure
            const defaults = {
                globalEnabled: true,
                darkMode: false,
                domains: {}
                // We might add globalDefaults here later
            };
            // Merge saved settings with defaults deep enough to ensure domains exist
            const loadedSettings = { ...defaults, ...(data.settings || {}) };
            loadedSettings.domains = loadedSettings.domains || {}; // Ensure domains object exists

            // Note: We don't automatically populate default domain configs here.
            // They are generated when a domain is first accessed/saved via the popup.
            resolve(loadedSettings);
        });
    });
}

async function saveSettings(settings) {
    return new Promise((resolve) => {
        chrome.storage.sync.set({ settings }, resolve);
    });
}

function getDomainFromUrl(url) {
    try {
        const parsedUrl = new URL(url);
        // Use hostname to handle ports etc.
        let hostname = parsedUrl.hostname;
        // Simple check for IP address, could be more robust
        if (/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) {
            return hostname; // Return IP address directly
        }
        // Basic subdomain handling: return the last two parts for common TLDs
        // or just the hostname if it's a local/special domain
        const parts = hostname.split('.');
        if (parts.length > 2) {
            // Check for common TLDs maybe? For now, just take last two parts.
            // This is a simplification. Real world needs a proper library (like psl)
            // but for a simple extension, this might suffice.
            return parts.slice(-2).join('.');
        }
        return hostname;
    } catch (e) {
        console.error("Error parsing URL:", url, e);
        return null;
    }
} 