import { convertArrayToDictionary, delay, guidGenerator } from "./SharedFunctions/Utils";

const collectionsMap = {};

const collectionNameDictionaries = {};

const localStorageCollectionConstant = "cached_collection_";

const allCollections = [
    {
        name: "actions",
        url: "https://raw.githubusercontent.com/TGolias/DNDConfigObjects/master/actions.json",
        createNameDictionary: true
    },
    {
        name: "backgrounds",
        url: "https://raw.githubusercontent.com/TGolias/DNDConfigObjects/master/backgrounds.json",
        createNameDictionary: true
    },
    {
        name: "cantrips",
        url: "https://raw.githubusercontent.com/TGolias/DNDConfigObjects/master/cantrips.json",
        createNameDictionary: true
    },
    {
        name: "classes",
        url: "https://raw.githubusercontent.com/TGolias/DNDConfigObjects/master/classes.json",
        createNameDictionary: true
    },
    {
        name: "conditions",
        url: "https://raw.githubusercontent.com/TGolias/DNDConfigObjects/master/conditions.json",
        createNameDictionary: true
    },
    {
        name: "damagetypes",
        url: "https://raw.githubusercontent.com/TGolias/DNDConfigObjects/master/damagetypes.json"
    },
    {
        name: "eldrichinvocations",
        url: "https://raw.githubusercontent.com/TGolias/DNDConfigObjects/master/eldrichinvocations.json",
        createNameDictionary: true
    },
    {
        name: "feats",
        url: "https://raw.githubusercontent.com/TGolias/DNDConfigObjects/master/feats.json",
        createNameDictionary: true
    },
    {
        name: "homebrew",
        url: "https://raw.githubusercontent.com/TGolias/DNDConfigObjects/master/homebrew.json",
        createNameDictionary: true
    },
    {
        name: "items",
        url: "https://raw.githubusercontent.com/TGolias/DNDConfigObjects/master/items.json",
        createNameDictionary: true
    },
    {
        name: "languages",
        url: "https://raw.githubusercontent.com/TGolias/DNDConfigObjects/master/languages.json"
    },
    {
        name: "masteries",
        url: "https://raw.githubusercontent.com/TGolias/DNDConfigObjects/master/masteries.json",
        createNameDictionary: true
    },
    {
        name: "metamagic",
        url: "https://raw.githubusercontent.com/TGolias/DNDConfigObjects/master/metamagic.json",
        createNameDictionary: true
    },
    {
        name: "misc",
        url: "https://raw.githubusercontent.com/TGolias/DNDConfigObjects/master/misc.json",
        createNameDictionary: true
    },
    {
        name: "pactslots",
        url: "https://raw.githubusercontent.com/TGolias/DNDConfigObjects/master/pactslots.json"
    },
    {
        name: "properties",
        url: "https://raw.githubusercontent.com/TGolias/DNDConfigObjects/master/properties.json",
        createNameDictionary: true
    },
    {
        name: "rarelanguages",
        url: "https://raw.githubusercontent.com/TGolias/DNDConfigObjects/master/rarelanguages.json"
    },
    {
        name: "skillProficiencies",
        url: "https://raw.githubusercontent.com/TGolias/DNDConfigObjects/master/skillproficiencies.json",
        createNameDictionary: true
    },
    {
        name: "species",
        url: "https://raw.githubusercontent.com/TGolias/DNDConfigObjects/master/species.json",
        createNameDictionary: true
    },
    {
        name: "spells",
        url: "https://raw.githubusercontent.com/TGolias/DNDConfigObjects/master/spells.json",
        createNameDictionary: true
    },
    {
        name: "spellslots",
        url: "https://raw.githubusercontent.com/TGolias/DNDConfigObjects/master/spellslots.json"
    },
    {
        name: "statblocks",
        url: "https://raw.githubusercontent.com/TGolias/DNDConfigObjects/master/statblocks.json",
        createNameDictionary: true
    },
    {
        name: "subclasses",
        url: "https://raw.githubusercontent.com/TGolias/DNDConfigObjects/master/subclasses.json",
        createNameDictionary: true
    },
    {
        name: "unarmed",
        url: "https://raw.githubusercontent.com/TGolias/DNDConfigObjects/master/unarmed.json",
        createNameDictionary: true
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

            if (collection.createNameDictionary) {
                collectionNameDictionaries[collection.name] = convertArrayToDictionary(collectionJson, "name");
            }

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

            if (collection.createNameDictionary) {
                collectionNameDictionaries[collection.name] = convertArrayToDictionary(collectionJson, "name");
            }

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

export function getNameDictionaryForCollection(collectionName) {
    return collectionNameDictionaries[collectionName]; 
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

export function clearAllCollections() {
    const allKeysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
        const localStoragekey = localStorage.key(i);
        if (localStoragekey.startsWith(localStorageCollectionConstant)) {
            allKeysToRemove.push(localStoragekey)
        } else if (localStoragekey.startsWith("SAVE_SLOT") || localStoragekey === "CURRENT_CHARACTER") {
            // Perform updates
            const oldLocalStorageString = localStorage.getItem(localStoragekey);
            const playerConfigs = JSON.parse(oldLocalStorageString);
            updateStoredConfigs(playerConfigs);
            const newLocalStorageString = JSON.stringify(playerConfigs);
            localStorage.setItem(localStoragekey, newLocalStorageString);
        }
    }

    for (let localStoragekey of allKeysToRemove) {
        localStorage.removeItem(localStoragekey);
    }
}

function updateStoredConfigs(playerConfigs) {
    // Add item ids if not present.
    updateItems(playerConfigs.items);
}

function updateItems(itemsCollection) {
    if (itemsCollection && itemsCollection.length > 0) {
        for (let i = 0; i < itemsCollection.length; i++) {
            if (!itemsCollection[i].id) {
                // This is bit OCD, but this makes sure the id is the first property on the object when viewing so that it is consistent with others.
                itemsCollection[i] = { id: guidGenerator(), ...itemsCollection[i]};
            }

            if (itemsCollection[i].items) {
                // this item has items... yo dawg.
                updateItems(itemsCollection[i].items);
            }
        }
    }
}