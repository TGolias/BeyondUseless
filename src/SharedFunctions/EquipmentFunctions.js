import { getCollection } from "../Collections";
import { getItemFromItemTemplate } from "./TabletopMathFunctions";
import { convertArrayToDictionary } from "./Utils";

export function CanEquipItem(playerItems, item) {
    if (IsItemHoldable(item)) {
        const openHands = GetOpenHands(playerItems);
        const isTryingToEquipTwoHanded = item.type === "Weapon" && item.properties && item.properties.includes("Two-Handed");
        if (isTryingToEquipTwoHanded) {
            return openHands >= 2;
        } else {
            return openHands >= 1;
        }
    }
    if (IsWearableArmor(item)) {
        const items = getCollection('items');
        // Convert to a dictionary for quick searches because the list could be LONG.
        const itemsDictionary = convertArrayToDictionary(items, "name");
        const alreadyWearingArmor = playerItems.some(playerItem => { 
            if (playerItem.equipped) {
                const actualItem = getItemFromItemTemplate(itemsDictionary[playerItem.name], itemsDictionary);
                if (IsWearableArmor(actualItem)) {
                    return true;
                }
            }
            return false;
        });
        return !alreadyWearingArmor;
    }
    return true;
}

export function GetOpenHands(playerItems) {
    const heldItems = GetHeldItems(playerItems);
    const hasTwoHandedWeapon = heldItems.includes(item => item.type === "Weapon" && item.properties && item.properties.includes("Two-Handed"));
    if (!hasTwoHandedWeapon && heldItems.length < 2) {
        return 2 - heldItems.length;
    }
    return 0;
}

export function GetHeldItems(playerItems) {
    const heldItems = [];

    const items = getCollection('items');
    // Convert to a dictionary for quick searches because the list could be LONG.
    const itemsDictionary = convertArrayToDictionary(items, "name");
    for (let playerItem of playerItems) {
        if (playerItem.equipped) {
            const actualItem = getItemFromItemTemplate(itemsDictionary[playerItem.name], itemsDictionary);
            if (IsItemHoldable(actualItem)) {
                heldItems.push(actualItem);
            }
        }
    }

    return heldItems;
}

export function IsItemHoldable(item) {
    return item.type === "Weapon" || (item.type === "Armor" && item.armorType === "Shield") || item.holdable;
}

export function IsWearableArmor(item) {
    return item.type === "Armor" && item.armorType !== "Shield";
}

export function CanAttuneItem(playerConfigs) {
    let attunementCount = getAttunementCount(playerConfigs);
    // Later on with artificer we are going to have to get the updated attuement count, but for now we're good to just hardcode 3.
    return attunementCount < 3;
}

function getAttunementCount(playerConfigs) {
    const attunementFromItems = getAttunementCountFromItems(playerConfigs.items, playerConfigs.name);
    const attunementFromAllies = getAttunementFromAllies(playerConfigs, playerConfigs.name);
    const attunementFromParents = getAttunementFromParents(playerConfigs, playerConfigs.name); 

    return attunementFromItems + attunementFromAllies + attunementFromParents;
}

function getAttunementCountFromItems(items, nameToCheckForAttuned) {
    let attunementCount = 0;
    for (let playerItem of items) {
        if (playerItem.attuned === nameToCheckForAttuned) {
            attunementCount++;
        }

        if (playerItem.items) {
            const innerItemAttunmentCount = getAttunementCountFromItems(playerItem.items, nameToCheckForAttuned);
            attunementCount += innerItemAttunmentCount;
        }
    }

    return attunementCount;
}

function getAttunementFromAllies(playerConfigs, nameToCheckForAttuned) {
    let attunementCount = 0;
    if (playerConfigs?.currentStatus?.activeEffects && playerConfigs.currentStatus.activeEffects.length > 0) {
        for (let activeEffect of playerConfigs.currentStatus.activeEffects) {
            if (activeEffect.allies && activeEffect.allies.length > 0) {
                for (let ally of activeEffect.allies) {
                    const allyAttunementFromItems = getAttunementCountFromItems(ally.items, nameToCheckForAttuned);

                    // Our allies could have allies... Yo dawg.
                    const allyAttunementFromAllies = getAttunementFromAllies(ally, nameToCheckForAttuned);

                    attunementCount += (allyAttunementFromItems + allyAttunementFromAllies);
                }
            }
        }
    }
    return attunementCount;
}

function getAttunementFromParents(playerConfigs, nameToCheckForAttuned) {
    if (playerConfigs.parent) {
        const allyAttunementFromItems = getAttunementCountFromItems(playerConfigs.parent.items, nameToCheckForAttuned);
        
        // Our parents could have parents... Yo dawg.
        const allyAttunementFromAllies = getAttunementFromParents(playerConfigs.parent, nameToCheckForAttuned);

        return allyAttunementFromItems + allyAttunementFromAllies;
    }
    return 0;
}