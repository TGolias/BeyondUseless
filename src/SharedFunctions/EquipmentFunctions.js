import { getCollection } from "../Collections";
import { getItemFromItemTemplate } from "./TabletopMathFunctions";
import { convertArrayToDictionary } from "./Utils";

export function HasAtLeastOneOpenHand(playerConfigs) {
    const heldItems = GetHeldItems(playerConfigs);
    return heldItems.length < 2;
}

export function GetHeldItems(playerConfigs) {
    const heldItems = [];

    const items = getCollection('items');
    // Convert to a dictionary for quick searches because the list could be LONG.
    const itemsDictionary = convertArrayToDictionary(items, "name");
    for (let playerItem of playerConfigs.items) {
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