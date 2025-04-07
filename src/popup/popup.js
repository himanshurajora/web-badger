document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const themeSwitch = document.getElementById('theme-switch');
    const globalEnableSwitch = document.getElementById('global-enable-switch');
    const currentDomainSpan = document.getElementById('current-domain');
    const siteEnableSwitch = document.getElementById('site-enable-switch');
    const siteLabelInput = document.getElementById('site-label-input');
    const sitePositionSelect = document.getElementById('site-position-select');
    const siteShapeSelect = document.getElementById('site-shape-select');
    const siteSizeWidthInput = document.getElementById('site-size-width');
    const siteSizeHeightInput = document.getElementById('site-size-height');
    const siteOpacityInput = document.getElementById('site-opacity-input');
    const opacityValueSpan = document.getElementById('opacity-value');
    const siteFontSizeInput = document.getElementById('site-font-size-input');
    const siteFontWeightSelect = document.getElementById('site-font-weight-select');
    const siteFontColorPicker = document.getElementById('site-font-color-picker');
    const siteBgColorPicker = document.getElementById('site-bg-color-picker');
    const resetSiteColorButton = document.getElementById('reset-site-color');
    const siteGradientEnable = document.getElementById('site-gradient-enable');
    const gradientOptionsContainer = document.getElementById('gradient-options-container');
    const siteGradientColor1 = document.getElementById('site-gradient-color1');
    const siteGradientColor2 = document.getElementById('site-gradient-color2');
    const siteGradientAngle = document.getElementById('site-gradient-angle');
    const siteBorderWidthInput = document.getElementById('site-border-width-input');
    const siteBorderStyleSelect = document.getElementById('site-border-style-select');
    const siteBorderColorPicker = document.getElementById('site-border-color-picker');
    const siteBorderRadiusInput = document.getElementById('site-border-radius-input');
    const siteAnimationSelect = document.getElementById('site-animation-select');
    const siteHoverSelect = document.getElementById('site-hover-select');
    const saveSiteSettingsButton = document.getElementById('save-site-settings');
    const resetSiteSettingsButton = document.getElementById('reset-site-settings');
    const domainListUl = document.getElementById('domain-list');
    const resetAllSettingsButton = document.getElementById('reset-all-settings');
    const statusMessageP = document.getElementById('status-message');
    const currentSiteSettingsSection = document.querySelector('.current-site-settings');

    // All configurable inputs for enabling/disabling
    const siteConfigInputs = [
        siteLabelInput, sitePositionSelect, siteShapeSelect, siteSizeWidthInput, siteSizeHeightInput,
        siteOpacityInput, siteFontSizeInput, siteFontWeightSelect, siteFontColorPicker,
        siteBgColorPicker, resetSiteColorButton, siteGradientEnable, siteGradientColor1,
        siteGradientColor2, siteGradientAngle, siteBorderWidthInput, siteBorderStyleSelect,
        siteBorderColorPicker, siteBorderRadiusInput, siteAnimationSelect, siteHoverSelect
    ];

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
        const sortedDomains = Object.keys(settings.domains || {}).sort();

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
            const bgColor = (domainConfig.background?.gradient?.enabled)
                            ? `linear-gradient(${domainConfig.background.gradient.angle || 0}deg, ${domainConfig.background.gradient.color1 || '#ccc'}, ${domainConfig.background.gradient.color2 || '#eee'})`
                            : (domainConfig.background?.color || getDefaultColor(domain));

            colorPreview.style.backgroundColor = domainConfig.background?.color || getDefaultColor(domain);
            colorPreview.style.border = `${domainConfig.border?.width || 0}px ${domainConfig.border?.style || 'solid'} ${domainConfig.border?.color || 'transparent'}`;
            colorPreview.style.borderRadius = domainConfig.border?.radius || '0';

            const contrastBorderColor = getContrastYIQ(colorPreview.style.backgroundColor) === '#fff' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.2)';
            colorPreview.style.borderColor = contrastBorderColor;

            const domainNameSpan = document.createElement('span');
            domainNameSpan.className = 'domain-name';
            domainNameSpan.textContent = domain;

            const domainLabelSpan = document.createElement('span');
            domainLabelSpan.className = 'domain-label';
            domainLabelSpan.textContent = `(${domainConfig.enabled ? 'Enabled' : 'Disabled'}, ${domainConfig.label || getDefaultLabel(domain)})`;

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
        const savedDomainConfig = settings.domains?.[domain];
        const defaultDomainConfig = getDefaultDomainConfig(domain);

        // *** Refined: Deep merge defaults and saved config for UI population ***
        const displayConfig = {
            ...defaultDomainConfig,
            ...(savedDomainConfig || {}),
            size: { ...defaultDomainConfig.size, ...(savedDomainConfig?.size || {}) },
            font: { ...defaultDomainConfig.font, ...(savedDomainConfig?.font || {}) },
            background: {
                ...defaultDomainConfig.background,
                ...(savedDomainConfig?.background || {}),
                gradient: {
                    ...defaultDomainConfig.background.gradient,
                    ...(savedDomainConfig?.background?.gradient || {})
                }
            },
            border: { ...defaultDomainConfig.border, ...(savedDomainConfig?.border || {}) },
            effects: { ...defaultDomainConfig.effects, ...(savedDomainConfig?.effects || {}) },
            // Get enabled status specifically from saved if it exists, else false
            enabled: savedDomainConfig?.enabled ?? false
        };


        // Use merged config to populate UI
        siteEnableSwitch.checked = displayConfig.enabled;

        // Populate General
        siteLabelInput.value = displayConfig.label === getDefaultLabel(domain) ? '' : displayConfig.label; // Show placeholder if default
        sitePositionSelect.value = displayConfig.position;
        siteShapeSelect.value = displayConfig.shape;
        siteSizeWidthInput.value = displayConfig.size.width;
        siteSizeHeightInput.value = displayConfig.size.height;
        siteOpacityInput.value = displayConfig.opacity;
        opacityValueSpan.textContent = parseFloat(displayConfig.opacity).toFixed(2);

        // Populate Font
        siteFontSizeInput.value = displayConfig.font.size;
        siteFontWeightSelect.value = displayConfig.font.weight;
        siteFontColorPicker.value = displayConfig.font.color;

        // Populate Background
        siteBgColorPicker.value = displayConfig.background.color;
        siteGradientEnable.checked = displayConfig.background.gradient.enabled;
        siteGradientColor1.value = displayConfig.background.gradient.color1;
        siteGradientColor2.value = displayConfig.background.gradient.color2;
        siteGradientAngle.value = displayConfig.background.gradient.angle;
        gradientOptionsContainer.style.display = displayConfig.background.gradient.enabled ? 'block' : 'none';

        // Populate Border
        siteBorderWidthInput.value = displayConfig.border.width;
        siteBorderStyleSelect.value = displayConfig.border.style;
        siteBorderColorPicker.value = displayConfig.border.color;
        siteBorderRadiusInput.value = displayConfig.border.radius;

        // Populate Effects
        siteAnimationSelect.value = displayConfig.effects.animation;
        siteHoverSelect.value = displayConfig.effects.hover;

        updateSiteInputStates();
    }

    function updateSiteInputStates() {
         const enabled = siteEnableSwitch.checked;
         siteConfigInputs.forEach(input => {
             input.disabled = !enabled;
         });
         // Special handling for gradient options based on its own checkbox
         const gradientEnabled = siteGradientEnable.checked && enabled;
         siteGradientColor1.disabled = !gradientEnabled;
         siteGradientColor2.disabled = !gradientEnabled;
         siteGradientAngle.disabled = !gradientEnabled;
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

    // Listener for opacity slider
    siteOpacityInput.addEventListener('input', (event) => {
        opacityValueSpan.textContent = parseFloat(event.target.value).toFixed(2);
    });

    // Listener for gradient enable checkbox
    siteGradientEnable.addEventListener('change', (event) => {
        gradientOptionsContainer.style.display = event.target.checked ? 'block' : 'none';
        updateSiteInputStates(); // Re-evaluate disabled state of gradient inputs
    });

    resetSiteColorButton.addEventListener('click', () => {
        if (currentDomain) {
            const defaultColor = getDefaultColor(currentDomain);
            siteBgColorPicker.value = defaultColor;
            // Also reset gradient color 1 if gradient is enabled
            if (siteGradientEnable.checked) {
                siteGradientColor1.value = defaultColor;
            }
        }
    });

    saveSiteSettingsButton.addEventListener('click', () => {
        if (!currentDomain) return;

        const isEnabled = siteEnableSwitch.checked;
        const defaultConf = getDefaultDomainConfig(currentDomain);

        // *** Refined: Construct config using defaults for empty/invalid inputs ***
        const currentDomainConfig = {
            enabled: isEnabled,
            label: siteLabelInput.value.trim() || defaultConf.label,
            position: sitePositionSelect.value,
            shape: siteShapeSelect.value,
            size: {
                width: siteSizeWidthInput.value.trim() || defaultConf.size.width,
                height: siteSizeHeightInput.value.trim() || defaultConf.size.height
            },
            opacity: parseFloat(siteOpacityInput.value) || defaultConf.opacity,
            font: {
                family: 'sans-serif', // Hardcoded for now
                size: siteFontSizeInput.value.trim() || defaultConf.font.size,
                weight: siteFontWeightSelect.value,
                color: siteFontColorPicker.value
            },
            background: {
                color: siteBgColorPicker.value,
                gradient: {
                    enabled: siteGradientEnable.checked,
                    color1: siteGradientColor1.value,
                    color2: siteGradientColor2.value,
                    // Ensure angle is a number, default if invalid
                    angle: parseInt(siteGradientAngle.value, 10) || defaultConf.background.gradient.angle
                }
            },
            border: {
                // Ensure width is a number, default if invalid
                width: parseInt(siteBorderWidthInput.value, 10) >= 0 ? parseInt(siteBorderWidthInput.value, 10) : defaultConf.border.width,
                style: siteBorderStyleSelect.value,
                color: siteBorderColorPicker.value,
                radius: siteBorderRadiusInput.value.trim() || defaultConf.border.radius
            },
            effects: {
                animation: siteAnimationSelect.value,
                hover: siteHoverSelect.value
            }
        };

        // Logic: Save if enabled, delete if disabled
        if (isEnabled) {
            settings.domains = settings.domains || {};
            settings.domains[currentDomain] = currentDomainConfig;
        } else {
            if (settings.domains && settings.domains[currentDomain]) {
                delete settings.domains[currentDomain];
                showStatus("Tag disabled and settings removed for this site.", "info");
            } else {
                 // If it wasn't enabled and wasn't saved, do nothing.
                 showStatus("Tag not enabled. No settings saved.", "info");
                 return; // Exit early, no need to save/update
            }
        }

        const settingsToSave = JSON.parse(JSON.stringify(settings));

        saveSettingsAndUpdate(settingsToSave).then(() => {
            showStatus("Site settings saved!");
            populateDomainList();

            // --- START IMMEDIATE UPDATE --- 
            // Directly notify the current active tab to update its tag instantly
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (chrome.runtime.lastError) {
                    console.error("Error querying active tab:", chrome.runtime.lastError.message);
                    return;
                }
                if (tabs && tabs.length > 0 && tabs[0].id) {
                    const activeTabId = tabs[0].id;
                    // Send the updated settings directly to the content script of the active tab
                    chrome.tabs.sendMessage(activeTabId, { action: "settingsUpdated", settings: settingsToSave }, (response) => {
                        if (chrome.runtime.lastError) {
                            // This might happen if the content script isn't injected or ready yet, or the page is restricted
                            // console.warn(`Could not send immediate update to tab ${activeTabId}: ${chrome.runtime.lastError.message}`);
                        } else {
                            // console.log("Immediate update message sent to active tab.");
                        }
                    });
                }
            });
             // --- END IMMEDIATE UPDATE --- 

        }).catch(err => {
            showStatus("Error saving settings", "error");
            console.error("Save error:", err);
            // Restore previous settings state in the UI potentially?
            // For now, just log the error.
        });
    });

    resetSiteSettingsButton.addEventListener('click', () => {
        if (!currentDomain) return; // Check currentDomain first
        const domainExists = settings.domains?.[currentDomain]; // Check if exists
        if (!domainExists) {
            showStatus(`No settings saved for ${currentDomain} to reset.`, "info");
            return; // Nothing to reset
        }

        if (confirm(`Are you sure you want to reset all customizations for ${currentDomain}? The tag will be disabled.`)) {
            delete settings.domains[currentDomain];
            const settingsToSave = JSON.parse(JSON.stringify(settings));
            saveSettingsAndUpdate(settingsToSave).then(() => {
                loadCurrentSiteSettings(currentDomain); // Reload inputs for current site (will show defaults)
                populateDomainList();
                showStatus(`Settings for ${currentDomain} reset.`);
            }).catch(err => {
                showStatus("Error resetting site settings", "error");
                console.error("Reset error:", err);
            });
        }
    });

    function handleDeleteDomain(domain) {
        if (!settings.domains?.[domain]) return; // Check existence safely

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