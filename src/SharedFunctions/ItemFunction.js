import { getCollection } from "../Collections";
import { getItemFromItemTemplate } from "./TabletopMathFunctions";
import { convertArrayToDictionary } from "./Utils";

export function addItemsToNewItems(newItems, itemsToAdd) {
    // Check equipped items for the aspect.
    const dndItems = getCollection("items");
    // Convert to a dictionary for quick searches because the list could be LONG.
    const itemsDictionary = convertArrayToDictionary(dndItems, "name");

    for (let itemToAdd of itemsToAdd) {
        const existingItemIndex = newItems.findIndex(item => item.name === itemToAdd.name);
        if (existingItemIndex > 0) {
            const dndItem = getItemFromItemTemplate(itemsDictionary[itemToAdd.name], itemsDictionary);
            if (itemToAdd.custom || (dndItem && dndItem.stackable)) {
                const existingItemClone = {...newItems[existingItemIndex]};
                const oldCollectionAmount = itemToAdd.amount || 1;
                const newCollectionAmount = existingItemClone.amount || 1;
                existingItemClone.amount = oldCollectionAmount + newCollectionAmount;
                newItems[existingItemIndex] = existingItemClone;
            } else {
                newItems.push(itemToAdd);
            }
        } else {
            newItems.push(itemToAdd);
        }
    }
}