const collectionsMap = {};

const allCollections = [
    {
        name: "backgrounds",
        url: "https://raw.githubusercontent.com/TGolias/DNDConfigObjects/master/backgrounds.json"
    },
    {
        name: "classes",
        url: "https://raw.githubusercontent.com/TGolias/DNDConfigObjects/master/classes.json"
    },
    {
        name: "damagetypes",
        url: "https://raw.githubusercontent.com/TGolias/DNDConfigObjects/master/damagetypes.json"
    },
    {
        name: "equipment",
        url: "https://raw.githubusercontent.com/TGolias/DNDConfigObjects/master/equipment.json"
    },
    {
        name: "feats",
        url: "https://raw.githubusercontent.com/TGolias/DNDConfigObjects/master/feats.json"
    },
    {
        name: "languages",
        url: "https://raw.githubusercontent.com/TGolias/DNDConfigObjects/master/languages.json"
    },
    {
        name: "species",
        url: "https://raw.githubusercontent.com/TGolias/DNDConfigObjects/master/species.json"
    },
    {
        name: "skillProficiencies",
        url: "https://raw.githubusercontent.com/TGolias/DNDConfigObjects/master/skillproficiencies.json"
    },
    {
        name: "spells",
        url: "https://raw.githubusercontent.com/TGolias/DNDConfigObjects/master/spells.json"
    },
    {
        name: "subclasses",
        url: "https://raw.githubusercontent.com/TGolias/DNDConfigObjects/master/subclasses.json"
    }
]

export function fetchAllCollections() {
    const allPromises = [];
    for (const collection of allCollections) {
        const promise = setCollection(collection.name, collection.url);
        allPromises.push(promise);
    }
    return Promise.all(allPromises);
}

export function getCollection(collectionName) {
    return collectionsMap[collectionName];
}

async function setCollection(collectionName, collectionUrl) {
    const response = await fetch(collectionUrl);
    const collectionJson = await response.json();
    collectionsMap[collectionName] = collectionJson;
}