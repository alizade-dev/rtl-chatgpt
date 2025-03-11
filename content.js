function isTargetURL(url) {
    return url && typeof url === 'string' && url.includes('chatgpt.com');
}
const DirectionState = {
    get(callback) {
        chrome.storage.local.get(['isRTL'], (result) => {
            callback(result.isRTL || false);
        });
    },
    set(isRTL) {
        chrome.storage.local.set({ isRTL });
    },
};
function updateIcon(isRTL) {
    const iconPath = isRTL
        ? { "16": "icons/icon_rtl-128.png", "48": "icons/icon_rtl-128.png", "128": "icons/icon_rtl-128.png" }
        : { "16": "icons/icon_ltr-128.png", "48": "icons/icon_ltr-128.png", "128": "icons/icon_ltr-128.png" };
    chrome.action.setIcon({ path: iconPath });
}
function setRTLDirection(isRTL) {

	const chatElements = document.querySelectorAll("[class*='prose']");
	if(isRTL){
		chatElements.forEach((element) => {
			element.style.direction = "rtl";
			element.style.textAlign = "right";
		});		
	} else {
		chatElements.forEach((element) => {
			element.style.direction = "ltr";
			element.style.textAlign = "left";
		});		
	}
	
}

function stopObserver() {
    if (window._rtlObserver) {
        window._rtlObserver.disconnect();
        delete window._rtlObserver;
    }
}

function applyStoredDirection(tab) {
    if (isTargetURL(tab.url)) {
        DirectionState.get((isRTL) => {
            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                function: setRTLDirection,
                args: [isRTL],
            });
            updateIcon(isRTL);
        });
    }
}

chrome.action.onClicked.addListener((tab) => {
    if (isTargetURL(tab.url)) {
        DirectionState.get((isRTL) => {
            const newState = !isRTL;
            DirectionState.set(newState);
            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                function: setRTLDirection,
                args: [newState],
            });
            updateIcon(newState);
        });
    } else {
        chrome.tabs.update(tab.id, { url: 'https://chatgpt.com' });
    }
});

function handleTabChange(tab) {
    if (isTargetURL(tab.url)) {
        applyStoredDirection(tab);
    }
}

chrome.tabs.onActivated.addListener((activeInfo) => {
    chrome.tabs.get(activeInfo.tabId, handleTabChange);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && isTargetURL(tab.url)) {
        handleTabChange(tab);
    }
});

chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && changes.isRTL) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const tab = tabs[0];
            applyStoredDirection(tab);
        });
    }
});

chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.get(['isRTL'], (result) => {
        if (result.isRTL === undefined) {
            chrome.storage.local.set({ isRTL: true });
        }
    });
});
//create by Ali :)