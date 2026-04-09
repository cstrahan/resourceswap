document.addEventListener('DOMContentLoaded', () => {
    const addRuleForm = document.getElementById('addRuleForm');
    const rulesList = document.getElementById('rulesList');
    const extensionStatusToggle = document.getElementById('extensionStatus');
    // const clearAllRulesButton = document.getElementById('clearAllRules'); // REMOVE THIS LINE

    // Load rules and extension status when the popup opens
    loadRules();
    loadExtensionStatus();

    addRuleForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const localUrl = document.getElementById('localUrl').value;
        const remoteUrlFilter = document.getElementById('remoteUrlFilter').value;
        const resourceType = document.getElementById('resourceType').value;

        // Get existing rules to determine the next ID
        const existingRules = await getStoredRules();
        const newId = existingRules.length > 0 ? Math.max(...existingRules.map(rule => rule.id)) + 1 : 1;

        const newRule = {
            id: newId,
            localUrl,
            remoteUrlFilter,
            resourceType,
            enabled: true // New rules are enabled by default
        };

        const updatedRules = [...existingRules, newRule];
        await saveRules(updatedRules);
        await applyRulesToExtension(updatedRules);
        loadRules(); // Refresh the displayed list
        addRuleForm.reset();
    });

    rulesList.addEventListener('click', async (event) => {
        if (event.target.classList.contains('delete-rule')) {
            const ruleIdToDelete = parseInt(event.target.dataset.id);
            const existingRules = await getStoredRules();
            const updatedRules = existingRules.filter(rule => rule.id !== ruleIdToDelete);
            await saveRules(updatedRules);
            await applyRulesToExtension(updatedRules);
            loadRules();
        } else if (event.target.classList.contains('toggle-rule')) {
            const ruleIdToToggle = parseInt(event.target.dataset.id);
            const existingRules = await getStoredRules();
            const updatedRules = existingRules.map(rule =>
                rule.id === ruleIdToToggle ? { ...rule, enabled: !rule.enabled } : rule
            );
            await saveRules(updatedRules);
            await applyRulesToExtension(updatedRules);
            loadRules(); // Refresh to show updated status
        }
    });

    extensionStatusToggle.addEventListener('change', async (event) => {
        const isEnabled = event.target.checked;
        await chrome.storage.local.set({ extensionEnabled: isEnabled });
        if (isEnabled) {
            const rules = await getStoredRules();
            await applyRulesToExtension(rules);
        } else {
            await applyRulesToExtension([]); // Clear all rules if extension is disabled
        }
    });

    // REMOVE THIS BLOCK
    // clearAllRulesButton.addEventListener('click', async () => {
    //     if (confirm("Are you sure you want to clear all redirect rules?")) {
    //         await saveRules([]);
    //         await applyRulesToExtension([]);
    //         loadRules();
    //     }
    // });

    async function getStoredRules() {
        return new Promise((resolve) => {
            chrome.storage.local.get({ redirectRules: [] }, (result) => {
                resolve(result.redirectRules);
            });
        });
    }

    async function saveRules(rules) {
        return new Promise((resolve) => {
            chrome.storage.local.set({ redirectRules: rules }, () => {
                resolve();
            });
        });
    }

    async function loadRules() {
        const rules = await getStoredRules();
        rulesList.innerHTML = '';
        if (rules.length === 0) {
            rulesList.innerHTML = '<p style="text-align: center; color: #666; padding: 10px;">No redirect rules added yet.</p>';
            return;
        }

        rules.forEach(rule => {
            const li = document.createElement('li');
            li.innerHTML = `
                <div class="rule-info">
                    <p><strong>Local:</strong> ${rule.localUrl}</p>
                    <p><strong>Remote:</strong> ${rule.remoteUrlFilter}</p>
                    <p><strong>Type:</strong> ${rule.resourceType}</p>
                </div>
                <button class="toggle-rule" data-id="${rule.id}">${rule.enabled ? 'Disable' : 'Enable'}</button>
                <button class="delete-rule" data-id="${rule.id}">Delete</button>
            `;
            li.classList.add(rule.enabled ? 'enabled-rule' : 'disabled-rule');
            rulesList.appendChild(li);
        });
    }

    async function loadExtensionStatus() {
        chrome.storage.local.get({ extensionEnabled: true }, (result) => {
            extensionStatusToggle.checked = result.extensionEnabled;
        });
    }

    async function applyRulesToExtension(rules) {
        chrome.runtime.sendMessage({ action: "updateRules", rules: rules });
    }

    // Export rules as JSON
    document.getElementById('exportRules').addEventListener('click', async () => {
        const rules = await getStoredRules();
        const blob = new Blob([JSON.stringify(rules, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'redirect-rules.json';
        a.click();
        URL.revokeObjectURL(url);
    });

    // Import rules from JSON
    const importFile = document.getElementById('importFile');
    document.getElementById('importRules').addEventListener('click', () => {
        importFile.click();
    });
    importFile.addEventListener('change', async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        try {
            const text = await file.text();
            const rules = JSON.parse(text);
            if (!Array.isArray(rules)) {
                alert('Invalid JSON: expected an array of rules.');
                return;
            }
            await saveRules(rules);
            await applyRulesToExtension(rules);
            loadRules();
        } catch (e) {
            alert('Failed to import: ' + e.message);
        }
        importFile.value = '';
    });
});