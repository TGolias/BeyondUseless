import { delay } from "./SharedFunctions/Utils";

const collectionsMap = {};

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
    const allPromises = []
    for (const collection of allCollections) {
        const promise = setCollection(collection.name, collection.url);
        allPromises.push(promise);
    }
    await Promise.all(allPromises);
}

export function getCollection(collectionName) {
    return collectionsMap[collectionName];
}

async function setCollection(collectionName, collectionUrl) {
    const response = await fetch(collectionUrl);
    if (response.status === 429) {
        // Try again in 1 minute lol
        await delay(60000);
        return setCollection(collectionName, collectionUrl);

        // TODO: https://github.blog/changelog/2025-05-08-updated-rate-limits-for-unauthenticated-requests/
        // It actually looks like this was a recent change on github's part. I either need to:
        // 1. Authenticate to retrieve the JSON (which doesn't seem super feasible or make sense because there really is no USER right now).
        // 2. Put all the JSON collections into one mega-collection (which still doesn't defeat the original problem)
        // 3. Pay for hosting... Not great considering this app is still in development and definetly not free...
        // 4. Allow for the JSON collections to be populated manually... I want to get to the eventually so everyone can customize their own experience but I don't think I'm there yet...
        // 5. Just have the JSON as part of this repo...
        // 5a. Move the JSON into this repo... I don't love that idea, because I just want this to be the code to make the config run, none of the actual dnd stuff. This then ties the repo to dnd and I don't want that.
        // 5b. Maybe just pull the JSON from the other repo in during the build step and have them as part of the build for now? (Then allow for customization / overriding later).
        // More on this: https://github.com/orgs/community/discussions/159123
        // More info: https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api?apiVersion=2022-11-28
    } else {
        const collectionJson = await response.json();
        collectionsMap[collectionName] = collectionJson;
    }
}