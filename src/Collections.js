import { delay } from "./SharedFunctions/Utils";

const collectionsMap = {};

const localStorageCollectionConstant = "cached_collection_";

const allCollections = [
    {
        name: "actions",
        url: "https://raw.githubusercontent.com/TGolias/DNDConfigObjects/master/actions.json"
    },
    {
        name: "backgrounds",
        url: "https://raw.githubusercontent.com/TGolias/DNDConfigObjects/master/backgrounds.json"
    },
    {
        name: "cantrips",
        url: "https://raw.githubusercontent.com/TGolias/DNDConfigObjects/master/cantrips.json"
    },
    {
        name: "classes",
        url: "https://raw.githubusercontent.com/TGolias/DNDConfigObjects/master/classes.json"
    },
    {
        name: "conditions",
        url: "https://raw.githubusercontent.com/TGolias/DNDConfigObjects/master/conditions.json"
    },
    {
        name: "damagetypes",
        url: "https://raw.githubusercontent.com/TGolias/DNDConfigObjects/master/damagetypes.json"
    },
    {
        name: "feats",
        url: "https://raw.githubusercontent.com/TGolias/DNDConfigObjects/master/feats.json"
    },
    {
        name: "homebrew",
        url: "https://raw.githubusercontent.com/TGolias/DNDConfigObjects/master/homebrew.json"
    },
    {
        name: "items",
        url: "https://raw.githubusercontent.com/TGolias/DNDConfigObjects/master/items.json"
    },
    {
        name: "languages",
        url: "https://raw.githubusercontent.com/TGolias/DNDConfigObjects/master/languages.json"
    },
    {
        name: "masteries",
        url: "https://raw.githubusercontent.com/TGolias/DNDConfigObjects/master/masteries.json"
    },
    {
        name: "misc",
        url: "https://raw.githubusercontent.com/TGolias/DNDConfigObjects/master/misc.json"
    },
    {
        name: "pactslots",
        url: "https://raw.githubusercontent.com/TGolias/DNDConfigObjects/master/pactslots.json"
    },
    {
        name: "properties",
        url: "https://raw.githubusercontent.com/TGolias/DNDConfigObjects/master/properties.json"
    },
    {
        name: "rarelanguages",
        url: "https://raw.githubusercontent.com/TGolias/DNDConfigObjects/master/rarelanguages.json"
    },
    {
        name: "skillProficiencies",
        url: "https://raw.githubusercontent.com/TGolias/DNDConfigObjects/master/skillproficiencies.json"
    },
    {
        name: "species",
        url: "https://raw.githubusercontent.com/TGolias/DNDConfigObjects/master/species.json"
    },
    {
        name: "spells",
        url: "https://raw.githubusercontent.com/TGolias/DNDConfigObjects/master/spells.json"
    },
    {
        name: "spellslots",
        url: "https://raw.githubusercontent.com/TGolias/DNDConfigObjects/master/spellslots.json"
    },
    {
        name: "statblocks",
        url: "https://raw.githubusercontent.com/TGolias/DNDConfigObjects/master/statblocks.json"
    },
    {
        name: "subclasses",
        url: "https://raw.githubusercontent.com/TGolias/DNDConfigObjects/master/subclasses.json"
    },
    {
        name: "unarmed",
        url: "https://raw.githubusercontent.com/TGolias/DNDConfigObjects/master/unarmed.json"
    }
]

let currentFetchProgress = "Not Started";

export async function fetchAllCollections() {
    currentFetchProgress = "Not Started";
    let hasDoneAFetchPreviously = false;
    for (let i = 0; i < allCollections.length; i++) {
        const collection = allCollections[i];

        currentFetchProgress = collection.name + " (" + (i + 1) + " of " + allCollections.length + ")";

        const cachedCollection = localStorage.getItem(localStorageCollectionConstant + collection.name);
        if (cachedCollection) {
            const collectionJson = JSON.parse(cachedCollection);
            collectionsMap[collection.name] = collectionJson;

            // TODO: we really shouldn't have to do this...
            await delay(1);
        } else {
            if (hasDoneAFetchPreviously) {
                // If we did a request previously, we wait one second before the next request to try to avoid rate limits (as recommended by github): https://docs.github.com/en/rest/using-the-rest-api/best-practices-for-using-the-rest-api?apiVersion=2022-11-28#pause-between-mutative-requests
                await delay(1000);
            }

            // We request the JSON serially to try to avoid rate limits (as recommended by github): https://docs.github.com/en/rest/using-the-rest-api/best-practices-for-using-the-rest-api?apiVersion=2022-11-28#avoid-concurrent-requests
            const response = await retrieveCollection(collection.name, collection.url);
            const collectionJson = await response.json();

            collectionsMap[collection.name] = collectionJson;
            localStorage.setItem(localStorageCollectionConstant + collection.name, JSON.stringify(collectionJson));

            hasDoneAFetchPreviously = true;
        }
    }
    currentFetchProgress = "Complete!";
}

export function getCollectionFetchProgress() {
    return currentFetchProgress;
}

export function getCollection(collectionName) {
    return collectionsMap[collectionName];
}

async function retrieveCollection(collectionName, collectionUrl, retries = 0) {
    let response;
    response = await fetch(collectionUrl, {
        method: "GET"
    });
    
    if (response.status === 429 && retries <= 11) {
        currentFetchProgress += "?"

        const newRetries = retries + 1;
        // Try again in 1 minute... then two minutes, then three, all the way up to eleven. It ends up being 66 minutes of waiting total, so that an hour potentially can pass for the rate limite to reset (as recommended by github): https://docs.github.com/en/rest/using-the-rest-api/best-practices-for-using-the-rest-api?apiVersion=2022-11-28#handle-rate-limit-errors-appropriately
        await delay(60000 * newRetries);
        return retrieveCollection(collectionName, collectionUrl, retries + 1);

        // TODO: If we continue to have issues, look into using conditional requests... We may be able to pull the JSON for all collections, and hold onto the etag along with the JSON in local storage, so we are only requesting what we actually need: https://docs.github.com/en/rest/using-the-rest-api/best-practices-for-using-the-rest-api?apiVersion=2022-11-28#use-conditional-requests-if-appropriate
        // Unfotunetly CORS seems to be in the way of realistically doing this though, and JSONP would not be able to send requests with headers either.
    } else {
        return response;
    }
}

export async function clearAllCollections() {
    for (let i = 0; i < localStorage.length; i++) {
        const localStoragekey = localStorage.key(i);
        if (localStoragekey.startsWith(localStorageCollectionConstant)) {
            localStorage.removeItem(localStoragekey);
            // Decrement since we just removed this index.
            i--;
        }
    }
}