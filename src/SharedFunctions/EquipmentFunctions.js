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

export function CanAttuneItem(playerItems, item) {
    let attunementCount = 0;
    for (let playerItem of playerItems) {
        if (playerItem.attuned) {
            attunementCount++;
        }
    }
    // Later on with artificer we are going to have to get the updated attuement count, but for now we're good to just hardcode 3.
    return attunementCount < 3;
}