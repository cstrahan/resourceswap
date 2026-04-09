// When opened as a pop-out window, enable responsive layout.
if (window.location.search.includes("window=1")) {
    document.body.classList.add("popout");
}

document.addEventListener('DOMContentLoaded', () => {
    const addRuleForm = document.getElementById('addRuleForm');
    const rulesList = document.getElementById('rulesList');
    const extensionStatusToggle = document.getElementById('extensionStatus');
    const extensionStatusLabel = document.getElementById('extensionStatusLabel');
    const statusEl = document.getElementById('status');

    loadRules();
    loadExtensionStatus();

    function showStatus(message, type) {
        statusEl.textContent = message;
        statusEl.className = 'status ' + type;
    }

    addRuleForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const localUrl = document.getElementById('localUrl').value;
        const remoteUrlFilter = document.getElementById('remoteUrlFilter').value;
        const resourceType = document.getElementById('resourceType').value;

        const existingRules = await getStoredRules();
        const newId = existingRules.length > 0 ? Math.max(...existingRules.map(rule => rule.id)) + 1 : 1;

        const newRule = {
            id: newId,
            localUrl,
            remoteUrlFilter,
            resourceType,
            enabled: true
        };

        const updatedRules = [...existingRules, newRule];
        await saveRules(updatedRules);
        await applyRulesToExtension(updatedRules);
        loadRules();
        addRuleForm.reset();
        showStatus('Rule added', 'success');
    });

    rulesList.addEventListener('click', async (event) => {
        const btn = event.target.closest('button');
        if (!btn) return;

        if (btn.classList.contains('delete-rule')) {
            const ruleIdToDelete = parseInt(btn.dataset.id);
            const existingRules = await getStoredRules();
            const updatedRules = existingRules.filter(rule => rule.id !== ruleIdToDelete);
            await saveRules(updatedRules);
            await applyRulesToExtension(updatedRules);
            loadRules();
        } else if (btn.classList.contains('toggle-rule')) {
            const ruleIdToToggle = parseInt(btn.dataset.id);
            const existingRules = await getStoredRules();
            const updatedRules = existingRules.map(rule =>
                rule.id === ruleIdToToggle ? { ...rule, enabled: !rule.enabled } : rule
            );
            await saveRules(updatedRules);
            await applyRulesToExtension(updatedRules);
            loadRules();
        }
    });

    extensionStatusToggle.addEventListener('change', async (event) => {
        const isEnabled = event.target.checked;
        updateStatusLabel(isEnabled);
        await chrome.storage.local.set({ extensionEnabled: isEnabled });
        if (isEnabled) {
            const rules = await getStoredRules();
            await applyRulesToExtension(rules);
        } else {
            await applyRulesToExtension([]);
        }
    });

    function updateStatusLabel(isEnabled) {
        extensionStatusLabel.textContent = isEnabled ? 'Enabled' : 'Disabled';
        extensionStatusLabel.className = isEnabled ? 'label-enabled' : 'label-disabled';
    }

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
            rulesList.innerHTML = '<div class="empty-msg">No redirect rules added yet.</div>';
            return;
        }

        rules.forEach(rule => {
            const div = document.createElement('div');
            div.className = 'rule-item ' + (rule.enabled ? 'enabled' : 'disabled');
            div.innerHTML = `
                <div class="rule-info">
                    <p><span class="rule-label">Remote:</span> ${rule.remoteUrlFilter}</p>
                    <p><span class="rule-label">Local:</span> ${rule.localUrl}</p>
                    <p><span class="rule-label">Type:</span> ${rule.resourceType}</p>
                </div>
                <div class="rule-actions">
                    <button class="btn-toggle toggle-rule" data-id="${rule.id}">${rule.enabled ? 'Disable' : 'Enable'}</button>
                    <button class="btn-delete delete-rule" data-id="${rule.id}">Delete</button>
                </div>
            `;
            rulesList.appendChild(div);
        });
    }

    async function loadExtensionStatus() {
        chrome.storage.local.get({ extensionEnabled: true }, (result) => {
            extensionStatusToggle.checked = result.extensionEnabled;
            updateStatusLabel(result.extensionEnabled);
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
        showStatus('Exported ' + rules.length + ' rules', 'success');
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
                showStatus('Invalid JSON: expected an array of rules.', 'error');
                return;
            }
            await saveRules(rules);
            await applyRulesToExtension(rules);
            loadRules();
            showStatus('Imported ' + rules.length + ' rules', 'success');
        } catch (e) {
            showStatus('Failed to import: ' + e.message, 'error');
        }
        importFile.value = '';
    });

    // Pop out into a persistent window
    document.getElementById('popoutBtn').addEventListener('click', (e) => {
        e.preventDefault();
        const popWidth = 520;
        const popHeight = 600;
        chrome.windows.getCurrent((currentWindow) => {
            const left = Math.round(currentWindow.left + currentWindow.width - popWidth - 20);
            const top = currentWindow.top + 80;
            chrome.windows.create({
                url: chrome.runtime.getURL('index.html?window=1'),
                type: 'popup',
                width: popWidth,
                height: popHeight,
                left: left,
                top: top,
            });
            window.close();
        });
    });
});
