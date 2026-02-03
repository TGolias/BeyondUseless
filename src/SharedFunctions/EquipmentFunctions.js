import { getNameDictionaryForCollection } from "../Collections";
import { calculateAttunementSlots, calculateNumberOfHands, getItemFromItemTemplate, performBooleanCalculation } from "./TabletopMathFunctions";

export function CanEquipItem(playerConfigs, playerItems, item) {
    if (IsItemHoldable(item)) {
        const openHands = GetOpenHands(playerConfigs, playerItems);
        const isTryingToEquipTwoHanded = item.type === "Weapon" && item.properties && item.properties.includes("Two-Handed");
        if (isTryingToEquipTwoHanded) {
            return openHands >= 2;
        } else {
            return openHands >= 1;
        }
    }
    if (IsWearableArmor(item)) {
        const itemsDictionary = getNameDictionaryForCollection('items');
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

export function GetOpenHands(playerConfigs, playerItems) {
    const numberOfHands = calculateNumberOfHands(playerConfigs);

    const heldItems = GetHeldItems(playerItems);
    const numberOfOccupiedHands = heldItems.map(item => item.type === "Weapon" && item.properties && item.properties.includes("Two-Handed") ? 2 : 1).reduce((a, b) => a + b, 0);
    let openHands = numberOfHands - numberOfOccupiedHands;
    if (openHands < 0) {
        openHands = 0;
    }
    return openHands;
}

export function GetEquippedItems(playerItems) {
    let equippedItems = [];

    const itemsDictionary = getNameDictionaryForCollection('items');
    for (let playerItem of playerItems) {
        if (playerItem.equipped) {
            const actualItem = getItemFromItemTemplate(itemsDictionary[playerItem.name], itemsDictionary);
            equippedItems.push(actualItem);

            if (playerItem.childItems && actualItem.childItems) {
                const childItemsEquipped = processChildItemsEquipped(playerItem.childItems, actualItem.childItems);
                equippedItems = [...equippedItems, ...childItemsEquipped];
            }
        }
    }

    return equippedItems;
}

function processChildItemsEquipped(childItems, dndChildItems) {
    let childItemsHeld = []
    for (let i = 0; i < childItems.length; i++) {
        const childItem = childItems[i];
        if (childItem.equipped) {
            const dndChildItem = dndChildItems[i];
            if (IsItemHoldable(dndChildItem)) {
                childItemsHeld.push(dndChildItem);
            }

            if (childItem.childItems && dndChildItem.childItems) {
                const innerChildItemsHeld = processChildItemsHeld(childItem.childItems, dndChildItem.childItems);
                childItemsHeld = [...childItemsHeld, ...innerChildItemsHeld];
            }
        }
    }
    return childItemsHeld;
}

export function GetHeldItems(playerItems) {
    let heldItems = [];

    const itemsDictionary = getNameDictionaryForCollection('items');
    for (let playerItem of playerItems) {
        if (playerItem.equipped) {
            const actualItem = getItemFromItemTemplate(itemsDictionary[playerItem.name], itemsDictionary);
            if (IsItemHoldable(actualItem)) {
                heldItems.push(actualItem);
            }

            if (playerItem.childItems && actualItem.childItems) {
                const childItemsHeld = processChildItemsHeld(playerItem.childItems, actualItem.childItems);
                heldItems = [...heldItems, ...childItemsHeld];
            }
        }
    }

    return heldItems;
}

function processChildItemsHeld(childItems, dndChildItems) {
    let childItemsHeld = []
    for (let i = 0; i < childItems.length; i++) {
        const childItem = childItems[i];
        if (childItem.equipped) {
            const dndChildItem = dndChildItems[i];
            if (IsItemHoldable(dndChildItem)) {
                childItemsHeld.push(dndChildItem);
            }

            if (childItem.childItems && dndChildItem.childItems) {
                const innerChildItemsHeld = processChildItemsHeld(childItem.childItems, dndChildItem.childItems);
                childItemsHeld = [...childItemsHeld, ...innerChildItemsHeld];
            }
        }
    }
    return childItemsHeld;
}

export function IsItemHoldable(item) {
    if (item.notHoldable) {
        return true;
    }

    return item.type === "Weapon" || (item.type === "Armor" && item.armorType === "Shield") || item.holdable;
}

export function IsWearableArmor(item) {
    return item.type === "Armor" && item.armorType !== "Shield";
}

export function CanAttuneItem(playerConfigs, dndItem) {
    if (dndItem.attunementRequirements) {
        const requirementsMet = performBooleanCalculation(playerConfigs, dndItem.attunementRequirements.calculation, {});
        if (!requirementsMet) {
            return false;
        }
    }

    const attunedItems = getAttunedItems(playerConfigs);

    const itemsDictionary = getNameDictionaryForCollection("items");
    const attunedDndItems = attunedItems.map(item => getItemFromItemTemplate(itemsDictionary[item.name], itemsDictionary));

    const attunementSlots = calculateAttunementSlots(playerConfigs, attunedDndItems, dndItem);

    return attunedItems.length < attunementSlots;
}

function getAttunedItems(playerConfigs) {
    const attunedItemsFromItems = getAttunedItemsFromItems(playerConfigs.items, playerConfigs.name);
    const attunedItemsFromAllies = getAttunedItemsFromAllies(playerConfigs, playerConfigs.name);
    const attunedItemsFromParents = getAttunedItemsFromParents(playerConfigs, playerConfigs.name); 

    return [...attunedItemsFromItems, ...attunedItemsFromAllies, ...attunedItemsFromParents];
}

function getAttunedItemsFromItems(items, nameToCheckForAttuned) {
    let attunedItems = [];
    for (let playerItem of items) {
        if (playerItem.attuned === nameToCheckForAttuned) {
            attunedItems.push(playerItem);
        }

        if (playerItem.items) {
            const innerAttunedItems = getAttunedItemsFromItems(playerItem.items, nameToCheckForAttuned);
            attunedItems = [...attunedItems, ...innerAttunedItems];
        }
    }

    return attunedItems;
}

function getAttunedItemsFromAllies(playerConfigs, nameToCheckForAttuned) {
    let attunementItems = [];
    if (playerConfigs?.currentStatus?.activeEffects && playerConfigs.currentStatus.activeEffects.length > 0) {
        for (let activeEffect of playerConfigs.currentStatus.activeEffects) {
            if (activeEffect.allies && activeEffect.allies.length > 0) {
                for (let ally of activeEffect.allies) {
                    const attunedItemsFromAllies = getAttunedItemsFromItems(ally.items, nameToCheckForAttuned);

                    // Our allies could have allies... Yo dawg.
                    const attunedItemsFromAlliesOfAllies = getAttunedItemsFromAllies(ally, nameToCheckForAttuned);

                    attunementItems = [...attunementItems, ...attunedItemsFromAllies, ...attunedItemsFromAlliesOfAllies];
                }
            }
        }
    }
    return attunementItems;
}

function getAttunedItemsFromParents(playerConfigs, nameToCheckForAttuned) {
    if (playerConfigs.parent) {
        const attunedItemsFromParent = getAttunedItemsFromItems(playerConfigs.parent.items, nameToCheckForAttuned);
        
        // Our parents could have parents... Yo dawg.
        const attunedItemsFromParentAllies = getAttunedItemsFromParents(playerConfigs.parent, nameToCheckForAttuned);

        return [...attunedItemsFromParent, ...attunedItemsFromParentAllies];
    }
    return [];
}