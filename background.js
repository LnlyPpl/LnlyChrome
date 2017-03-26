let storage = {};

let initPromise = new Promise(resolve => {
    chrome.storage.sync.get(data => {
        storage = data;

        // Verify fields exist, otherwise create them
        if (!storage.hasOwnProperty("active")) {
            storage.active = true;
        }
        storage.friends = storage.friends || [];
        storage.websites = storage.websites || [];
        storage.textHistory = storage.textHistory || 0;
        storage.webHistory = storage.webHistory || [];
        storage.name = storage.name || "";
        storage.messageChoice = storage.messageChoice || 1;
        resolve();
    });
});

let contains = (obj1, obj2) => {
    return obj1.indexOf(obj2) !== -1;
}

/*
* Website Tracking Helpers
*/

let activeWebsites = {};
// websiteName: { openTabs: [tabIds], intervalId: 0 };
let activeTabs = {}
// tabId : [websiteNames]

let decrementActiveWebsite = (website, tabId) => {
    activeWebsites[website].openTabs = activeWebsites[website].openTabs.filter(x => x !== tabId);

    if (activeWebsites[website].openTabs.length !== 0) {
        return;
    }

    clearInterval(activeWebsites[website].intervalId);
    delete activeWebsites[website];
}

let incrementActiveWebsite = (website, tabId) => {
    if (!activeWebsites[website]) {
        activeWebsites[website] = { openTabs: [tabId] };

        let websiteInfo = storage.websites.filter(x => x.url === website)[0];

        activeWebsites[website].intervalId = createTriggerFunction(website, websiteInfo.time);
    } else {
        activeWebsites[website].openTabs.push(tabId);
    }
}

let convertToTimeString = (time) => {
    let hours = Math.floor(time / 3600000);
    time %= 3600000;
    let minutes = Math.floor(time / 60000);
    time %= 60000;
    let seconds = Math.floor(time / 1000);

    return `${hours}h ${minutes}m ${seconds}s`;
};

let submitSendTextRequests = (websiteUrl, time) => {
    let shuffled = storage.friends.slice(0).sort(() => .5 - Math.random());
    let selectedFriends = shuffled.slice(0, 3);

    for (let friend of selectedFriends) {

        let xhr = new XMLHttpRequest();
        var url = "http://www.lnlyppl.com/sendtext";
        xhr.open("POST", url, true);

        xhr.setRequestHeader("Content-type", "application/json");
        var data = JSON.stringify({
            messageChoice: storage.messageChoice,
            name: storage.name,
            website: websiteUrl,
            time: convertToTimeString(time),
            phoneNumber: friend.phoneNumber
        });

        xhr.send(data);
    }
};

let createTriggerFunction = (url, time) => {
    return setInterval(() => {
        if (!storage.active) {
            return;
        }

        submitSendTextRequests(url, time);

    }, time);
};

/*
* Chrome tab change event listeners
*/

// Once data initialized from local storage set up the listeners
initPromise.then(() => {

    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {

        // Update matching website counts.
        let newMatchingWebsites = [];

        if (!activeTabs[tabId]) {
            activeTabs[tabId] = [];
        }

        for (let matchingWebsite of activeTabs[tabId]) {
            if (!contains(tab.url, matchingWebsite)) {
                decrementActiveWebsite(matchingWebsite, tabId);
            } else {
                newMatchingWebsites.push(matchingWebsite);
            }
        }

        activeTabs[tabId] = newMatchingWebsites;

        // Check if there are new matching websites
        for (let website of storage.websites) {
            if (!contains(tab.url, website.url) || contains(activeTabs[tabId], website.url)) {
                continue;
            }

            activeTabs[tabId].push(website.url);
            incrementActiveWebsite(website.url, tabId);
        }
    });

    chrome.tabs.onCreated.addListener(tab => {
        activeTabs[tab.id] = [];

        for (let website of storage.websites) {
            if (!contains(tab.url, website.url) || contains(activeTabs[tab.id], website.url)) {
                continue;
            }

            activeTabs[tab.id].push(website.url);
            incrementActiveWebsite(website.url, tab.id);
        }
    });

    chrome.tabs.onRemoved.addListener(tabId => {
        if (!activeTabs[tabId]) {
            return;
        }

        for (let website of activeTabs[tabId]) {
            decrementActiveWebsite(website, tabId);
        }

        delete activeTabs[tabId];
    });
});

/*
* Chrome message handlers
*/

chrome.runtime.onMessage.addListener(request => {
    if (request.type === "added_website") {
        storage.websites.push({
            url: request.url,
            time: request.time
        });
        // Possible TODO: Code to check if current tabs are already on that page
    } else if (request.type === "removed_website") {
        storage.websites = storage.websites.filter(x => x.url !== request.url);

        if (!activeWebsites[request.url]) {
            return;
        }

        for (let tabId of activeWebsites[request.url].openTabs) {
            activeTabs[tabId] = activeTabs[tabId].filter(x => x !== request.url);
        }

        clearInterval(activeWebsites[request.url].intervalId);
        delete activeWebsites[request.url];
    } else if (request.type === "updated_website") {
        for (let i = 0; i < storage.websites.length; i++) {
            if (storage.websites[i].url !== request.url) {
                continue;
            }

            storage.websites[i].time = request.time;

        }

        if (!activeWebsites[request.url]) {
            return;
        }

        clearInterval(activeWebsites[request.url].intervalId);
        activeWebsites[request.url].intervalId = createTriggerFunction(request.url, request.time);
    } else if (request.type === "added_friend") {
        storage.friends.push({
            name: request.name,
            phoneNumber: request.phoneNumber
        });
    } else if (request.type === "removed_friend") {
        storage.friends = storage.friends.filter(x => x.name !== request.name);
    } else if (request.type === "updated_friend") {
        for (let i = 0; i < storage.friends.length; i++) {
            if (storage.friends[i].name !== request.name) {
                continue;
            }

            storage.friends[i].phoneNumber = request.phoneNumber;
        }
    } else if (request.type === "toggle") {
        if (request.toggle) {
            storage.active = true;

            // Recreate the intervals to reset timers
            for (let activeWebsite in activeWebsites) {
                let time = storage.websites.filter(x => x.url === activeWebsite.url)[0].time;
                activeWebsites[activeWebsite] = createTriggerFunction(activeWebsite.url, time);
            }
        } else {
            storage.active = false;
            // Doesn't actually clear intervals... When the intervals fire, they are ignored
        }
    } else if (request.type === "updated_name") {
        storage.name = request.name;
    } else if (request.type === "updated_message_choice") {
        storage.messageChoice = request.messageChoice;
    }

    chrome.storage.sync.set(storage);
});
