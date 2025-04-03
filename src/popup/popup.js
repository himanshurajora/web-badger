document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const themeSwitch = document.getElementById('theme-switch');
    const globalEnableSwitch = document.getElementById('global-enable-switch');
    const currentDomainSpan = document.getElementById('current-domain');
    const siteEnableSwitch = document.getElementById('site-enable-switch');
    const siteLabelInput = document.getElementById('site-label-input');
    const siteColorPicker = document.getElementById('site-color-picker');
    const resetSiteColorButton = document.getElementById('reset-site-color');
    const saveSiteSettingsButton = document.getElementById('save-site-settings');
    const resetSiteSettingsButton = document.getElementById('reset-site-settings');
    const domainListUl = document.getElementById('domain-list');
    const resetAllSettingsButton = document.getElementById('reset-all-settings');
    const statusMessageP = document.getElementById('status-message');
    const currentSiteSettingsSection = document.querySelector('.current-site-settings');

    let settings = {};
    let currentDomain = null;

    // --- Utility Functions ---
    function applyTheme(isDark) {
        document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    }

    function showStatus(message, type = 'success', duration = 3000) {
        statusMessageP.textContent = message;
        statusMessageP.className = `status-message ${type}`;
        setTimeout(() => {
            statusMessageP.className = 'status-message';
        }, duration);
    }

    function hexToRgb(hex) {
        let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    function getContrastYIQ(hexcolor){
        const rgb = hexToRgb(hexcolor);
        if (!rgb) return '#000'; // Default to black if conversion fails
        const yiq = ((rgb.r * 299) + (rgb.g * 587) + (rgb.b * 114)) / 1000;
        return (yiq >= 128) ? '#000' : '#fff'; // Return black for light backgrounds, white for dark
    }

    // --- Load and Display Settings ---
    async function loadSettings() {
        settings = await getSettings(); // From utils.js
        applyTheme(settings.darkMode);
        themeSwitch.checked = settings.darkMode;
        globalEnableSwitch.checked = settings.globalEnabled;
        populateDomainList();
        getCurrentTabDomain();
    }

    function populateDomainList() {
        domainListUl.innerHTML = ''; // Clear existing list
        const sortedDomains = Object.keys(settings.domains).sort();

        if (sortedDomains.length === 0) {
             domainListUl.innerHTML = '<li>No sites configured yet.</li>';
             return;
        }

        sortedDomains.forEach(domain => {
            const domainConfig = settings.domains[domain];
            if (!domainConfig) return; // Skip if somehow null/undefined

            const li = document.createElement('li');

            const domainInfoDiv = document.createElement('div');
            domainInfoDiv.className = 'domain-info';

            const colorPreview = document.createElement('span');
            colorPreview.className = 'domain-color-preview';
            const bgColor = domainConfig.color || getDefaultColor(domain);
            colorPreview.style.backgroundColor = bgColor;
            // Set border color based on contrast for better visibility
            const borderColor = getContrastYIQ(bgColor) === '#fff' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.2)';
            colorPreview.style.borderColor = borderColor;

            const domainNameSpan = document.createElement('span');
            domainNameSpan.className = 'domain-name';
            domainNameSpan.textContent = domain;

            const domainLabelSpan = document.createElement('span');
            domainLabelSpan.className = 'domain-label';
            domainLabelSpan.textContent = `(${domainConfig.enabled ? 'Enabled' : 'Disabled'}, Label: ${domainConfig.label || getDefaultLabel(domain)})`;

            domainInfoDiv.appendChild(colorPreview);
            domainInfoDiv.appendChild(domainNameSpan);
            domainInfoDiv.appendChild(domainLabelSpan);

            const deleteButton = document.createElement('button');
            deleteButton.className = 'delete-domain';
            deleteButton.innerHTML = '&times;'; // Multiplication sign as delete icon
            deleteButton.title = `Remove settings for ${domain}`;
            deleteButton.addEventListener('click', () => handleDeleteDomain(domain));

            li.appendChild(domainInfoDiv);
            li.appendChild(deleteButton);
            domainListUl.appendChild(li);
        });
    }

    function getCurrentTabDomain() {
        // Ask background script for the current tab's domain
        chrome.runtime.sendMessage({ action: "getCurrentTabDomain" }, (response) => {
            if (chrome.runtime.lastError) {
                 console.error("Error getting current domain:", chrome.runtime.lastError.message);
                 currentDomainSpan.textContent = "Error";
                 currentSiteSettingsSection.classList.add('hidden'); // Hide section if no domain
                 return;
            }
            if (response && response.status === "success") {
                currentDomain = response.domain;
                currentDomainSpan.textContent = currentDomain;
                loadCurrentSiteSettings(currentDomain);
                currentSiteSettingsSection.classList.remove('hidden');
            } else {
                currentDomainSpan.textContent = "N/A";
                currentSiteSettingsSection.classList.add('hidden'); // Hide if not a valid page/domain
                // console.log("Could not get domain for current tab:", response?.message);
            }
        });
    }

    function loadCurrentSiteSettings(domain) {
        const domainConfig = settings.domains[domain] || {};
        siteEnableSwitch.checked = domainConfig.enabled === undefined ? false : domainConfig.enabled; // Default to false if never set
        siteLabelInput.value = domainConfig.label || ''; // Show empty if no custom label
        siteColorPicker.value = domainConfig.color || getDefaultColor(domain);

        // Disable inputs if site is not explicitly enabled
        updateSiteInputStates();
    }

    function updateSiteInputStates() {
         const enabled = siteEnableSwitch.checked;
         siteLabelInput.disabled = !enabled;
         siteColorPicker.disabled = !enabled;
         resetSiteColorButton.disabled = !enabled;
    }

    // --- Event Handlers ---
    themeSwitch.addEventListener('change', (event) => {
        const isDark = event.target.checked;
        settings.darkMode = isDark;
        applyTheme(isDark);
        saveSettingsAndUpdate(settings);
    });

    globalEnableSwitch.addEventListener('change', (event) => {
        settings.globalEnabled = event.target.checked;
        saveSettingsAndUpdate(settings);
    });

    siteEnableSwitch.addEventListener('change', updateSiteInputStates);

    resetSiteColorButton.addEventListener('click', () => {
        if (currentDomain) {
            siteColorPicker.value = getDefaultColor(currentDomain);
        }
    });

    saveSiteSettingsButton.addEventListener('click', () => {
        if (!currentDomain) return;

        const isEnabled = siteEnableSwitch.checked;
        const newLabel = siteLabelInput.value.trim();
        const newColor = siteColorPicker.value;

        // Only create/update the domain entry if it's enabled or was previously configured
        if (isEnabled || settings.domains[currentDomain]) {
            settings.domains[currentDomain] = {
                enabled: isEnabled,
                label: newLabel === '' ? null : newLabel, // Store null if empty to use default
                color: newColor === getDefaultColor(currentDomain) ? null : newColor // Store null if default
            };
             // Clean up entry if disabled and has no custom settings
            if (!isEnabled && !settings.domains[currentDomain].label && !settings.domains[currentDomain].color) {
                delete settings.domains[currentDomain];
            }
        } else {
            // If the site was never configured and is being saved in a disabled state, do nothing.
            showStatus("Enable the tag first to save settings.", "error");
            return;
        }

        saveSettingsAndUpdate(settings).then(() => {
            showStatus("Site settings saved!");
            populateDomainList(); // Update the list immediately
        }).catch(err => {
            showStatus("Error saving settings", "error");
            console.error("Save error:", err);
        });
    });

    resetSiteSettingsButton.addEventListener('click', () => {
        if (!currentDomain || !settings.domains[currentDomain]) return; // Nothing to reset

        if (confirm(`Are you sure you want to reset settings for ${currentDomain}?`)) {
            delete settings.domains[currentDomain];
            saveSettingsAndUpdate(settings).then(() => {
                loadCurrentSiteSettings(currentDomain); // Reload inputs for current site
                populateDomainList();
                showStatus(`Settings for ${currentDomain} reset.`);
            }).catch(err => {
                showStatus("Error resetting site settings", "error");
                console.error("Reset error:", err);
            });
        }
    });

    function handleDeleteDomain(domain) {
        if (!settings.domains[domain]) return;

        // Confirmation is good practice
        if (confirm(`Are you sure you want to remove all settings for ${domain}?`)) {
            delete settings.domains[domain];
            saveSettingsAndUpdate(settings).then(() => {
                populateDomainList();
                // If the deleted domain is the current one, update the form
                if (domain === currentDomain) {
                    loadCurrentSiteSettings(currentDomain);
                }
                showStatus(`${domain} settings removed.`);
            }).catch(err => {
                showStatus(`Error removing ${domain} settings`, "error");
                console.error("Delete error:", err);
            });
        }
    }

    resetAllSettingsButton.addEventListener('click', () => {
        if (confirm("Are you sure you want to reset ALL settings (global and all sites)? This cannot be undone.")) {
            settings.domains = {};
            settings.globalEnabled = true; // Reset to default global state
            // Keep dark mode preference
            saveSettingsAndUpdate(settings).then(() => {
                loadSettings(); // Reload everything
                showStatus("All settings have been reset.");
            }).catch(err => {
                showStatus("Error resetting all settings", "error");
                console.error("Reset all error:", err);
            });
        }
    });

    async function saveSettingsAndUpdate(newSettings) {
         // Use the saveSettings from utils.js which messages the background script
        await saveSettings(newSettings);
        settings = newSettings; // Update local copy
        // No need to manually message tabs here, background script handles it
    }

    // --- Initialization ---
    loadSettings();
}); 