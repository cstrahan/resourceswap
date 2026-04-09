// This function applies the redirect rules using declarativeNetRequest.
async function applyDeclarativeNetRequestRules(rulesToApply) {
  // Filter out rules that are disabled by the user
  const enabledRules = rulesToApply.filter(rule => rule.enabled);

  // Create the new redirect rules from the configuration array.
  // Each config generates a redirect rule + a CORS header rule
  const newRules = enabledRules.flatMap((config) => [
    // Redirect rule
    {
      id: config.id * 1000,
      priority: 1,
      action: {
        type: "redirect",
        redirect: { url: config.localUrl },
      },
      condition: {
        urlFilter: config.remoteUrlFilter,
        resourceTypes: [config.resourceType],
      },
    },
    // CORS header rule for localhost responses
    {
      id: config.id * 1000 + 1,
      priority: 1,
      action: {
        type: "modifyHeaders",
        responseHeaders: [
          {
            header: "Access-Control-Allow-Origin",
            operation: "set",
            value: "*",
          },
        ],
      },
      condition: {
        urlFilter: config.localUrl.split('/').slice(0, 3).join('/') + "/*",
        resourceTypes: [config.resourceType],
      },
    },
  ]);

  try {
    // Get ALL existing rule IDs and remove them in the same call that adds
    // the new ones. This is atomic — Chrome guarantees no ID conflicts.
    const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
    const removeRuleIds = existingRules.map((rule) => rule.id);

    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds,
      addRules: newRules,
    });
    console.log("Redirect rules applied:", newRules.length, "rules");
  } catch (e) {
    console.error("Error applying redirect rules:", e.message);
    console.error("Rules that failed:", JSON.stringify(newRules, null, 2));
  }
}

// Handle messages from the popup script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "updateRules") {
    applyDeclarativeNetRequestRules(request.rules);
    sendResponse({ status: "Rules updated" });
  }
});

// On extension install or update, initialize stored rules and apply them.
chrome.runtime.onInstalled.addListener(async () => {
  // Check if rules are already stored. If not, initialize with the default config.
  const result = await chrome.storage.local.get({ redirectRules: [] });
  if (result.redirectRules.length === 0) {
    const initialRedirectConfig = [];
    await chrome.storage.local.set({ redirectRules: initialRedirectConfig });
    await chrome.storage.local.set({ extensionEnabled: true });
    await applyDeclarativeNetRequestRules(initialRedirectConfig);
  } else {
    const extensionEnabled = (await chrome.storage.local.get({ extensionEnabled: true })).extensionEnabled;
    if (extensionEnabled) {
      await applyDeclarativeNetRequestRules(result.redirectRules);
    } else {
      await applyDeclarativeNetRequestRules([]);
    }
  }
});

// Listen for storage changes from popup to ensure background script reacts
chrome.storage.onChanged.addListener(async (changes, namespace) => {
  if (namespace === 'local' && changes.redirectRules) {
    const extensionEnabled = (await chrome.storage.local.get({ extensionEnabled: true })).extensionEnabled;
    if (extensionEnabled) {
      await applyDeclarativeNetRequestRules(changes.redirectRules.newValue);
    }
  } else if (namespace === 'local' && changes.extensionEnabled) {
    if (changes.extensionEnabled.newValue) {
      const result = await chrome.storage.local.get({ redirectRules: [] });
      await applyDeclarativeNetRequestRules(result.redirectRules);
    } else {
      await applyDeclarativeNetRequestRules([]);
    }
  }
});
