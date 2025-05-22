import { delay } from "./SharedFunctions/Utils";

const collectionsMap = {};

const localStorageCollectionConstant = "cached_collection_";
const localStorageEtagConstant = "cached_collection_etag_";

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

export async function fetchAllCollections() {
    for (let i = 0; i < allCollections.length; i++) {
        const collection = allCollections[i];
        const cachedCollectionEtag = localStorage.getItem(localStorageEtagConstant + collection.name);

        // We request the JSON serially to try to avoid rate limits (as recommended by github): https://docs.github.com/en/rest/using-the-rest-api/best-practices-for-using-the-rest-api?apiVersion=2022-11-28#avoid-concurrent-requests
        const response = await retrieveCollection(collection.name, collection.url, cachedCollectionEtag);

        if (response.status === 304) {
            // The version on the server is the same as our cahced version! Just used our cached version. Note also that this doesn't count against our primary rate limit (as per github): https://docs.github.com/en/rest/using-the-rest-api/best-practices-for-using-the-rest-api?apiVersion=2022-11-28#use-conditional-requests-if-appropriate
            const cachedCollection = localStorage.getItem(localStorageCollectionConstant + collection.name);
            const collectionJson = JSON.parse(cachedCollection);
            collectionsMap[collection.name] = collectionJson;
        } else {
            const collectionJson = await response.json();
            collectionsMap[collection.name] = collectionJson;

            const etag = response.headers.get("Etag");
            if (etag) {
                localStorage.setItem(localStorageEtagConstant + collection.name, response.headers.get("Etag"));
                localStorage.setItem(localStorageCollectionConstant + collection.name, JSON.stringify(collectionJson));
            } else {
                // No etag was returned, we cannot be doing any caching here. (I've only seen this when running locally)
                localStorage.removeItem(localStorageEtagConstant + collection.name);
                localStorage.removeItem(localStorageCollectionConstant + collection.name);
            }

            if (i + 1 < allCollections.length) {
                // If we have any other requests, we wait one second between each request to try to avoid rate limits (as recommended by github): https://docs.github.com/en/rest/using-the-rest-api/best-practices-for-using-the-rest-api?apiVersion=2022-11-28#pause-between-mutative-requests
                await delay(1000);
            }
        }
    }
}

export function getCollection(collectionName) {
    return collectionsMap[collectionName];
}

async function retrieveCollection(collectionName, collectionUrl, etag, retries = 0) {
    let response;
    if (etag) {
        response = await fetch(collectionUrl, {
            method: "GET",
            headers: {
                "if-none-match": etag
            }
        });
    } else {
        response = await fetch(collectionUrl, {
            method: "GET"
        });
    }
    
    if (response.status === 429 && retries <= 11) {
        const newRetries = retries + 1;
        // Try again in 1 minute... then two minutes, then three, all the way up to eleven. It ends up being 66 minutes of waiting total, so that an hour potentially can pass for the rate limite to reset (as recommended by github): https://docs.github.com/en/rest/using-the-rest-api/best-practices-for-using-the-rest-api?apiVersion=2022-11-28#handle-rate-limit-errors-appropriately
        await delay(60000 * newRetries);
        return retrieveCollection(collectionName, collectionUrl, retries + 1);

        // TODO: https://github.blog/changelog/2025-05-08-updated-rate-limits-for-unauthenticated-requests/
        // It actually looks like this was a recent change on github's part. I either need to:
        // 1. Authenticate to retrieve the JSON (which doesn't seem super feasible or make sense because there really is no USER right now).
        // 2. Put all the JSON collections into one mega-collection (which still doesn't defeat the original problem)
        // 3. Pay for hosting... Not great considering this app is still in development and definetly not free...
        // 4. Allow for the JSON collections to be populated manually... I want to get to the eventually so everyone can customize their own experience but I don't think I'm there yet...
        // 5. Just have the JSON as part of this repo...
        // 5a. Move the JSON into this repo... I don't love that idea, because I just want this to be the code to make the config run, none of the actual dnd stuff. This then ties the repo to dnd and I don't want that.
        // 5b. Maybe just pull the JSON from the other repo in during the build step and have them as part of the build for now? (Then allow for customization / overriding later).
        // 6. Maybe we just pull down the JSON collections once initially, then hold onto it in the browser storage? (This could work, but ONLY if the rate limit is per-ip... if it's just overall total, this isn't going to work.)
        // More on this: https://github.com/orgs/community/discussions/159123
        // More info: https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api?apiVersion=2022-11-28
        // Hey! It looks like they actually have a guide to stay under the rate limits: https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api?apiVersion=2022-11-28#staying-under-the-rate-limit
        // 7. Look into using conditional requests... We may be able to pull the JSON for all collections, and hold onto the etag along with the JSON in local storage, so we are only requesting what we actually need: https://docs.github.com/en/rest/using-the-rest-api/best-practices-for-using-the-rest-api?apiVersion=2022-11-28#use-conditional-requests-if-appropriate
    } else {
        return response;
    }
}