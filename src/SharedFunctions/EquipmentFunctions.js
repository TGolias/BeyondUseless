import { getCollection } from "../Collections";
import { getItemFromItemTemplate } from "./TabletopMathFunctions";
import { convertArrayToDictionary } from "./Utils";

export function CanEquipItem(item, openHands) {
    if (IsItemHoldable(item)) {
        const isTryingToEquipTwoHanded = item.type === "Weapon" && item.properties && item.properties.includes("Two-Handed");
        if (isTryingToEquipTwoHanded) {
            return openHands >= 2;
        } else {
            return openHands >= 1;
        }
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