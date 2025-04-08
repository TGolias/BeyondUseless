import React from "react";
import './TransferItemsMenu.css';
import { RetroButton } from "../SimpleComponents/RetroButton";
import { CircleButton } from "../SimpleComponents/CircleButton";
import { SelectList } from "../SimpleComponents/SelectList";
import { getCollection } from "../../Collections";
import { convertArrayToDictionary, playAudio } from "../../SharedFunctions/Utils";
import { calculateCarry, currentWeightCarried, getItemFromItemTemplate } from "../../SharedFunctions/TabletopMathFunctions";

export function TransferItemsMenu({playerConfigs, inputChangeHandler, menuConfig, menuStateChangeHandler, setCenterScreenMenu}) {

    // Check equipped items for the aspect.
    const items = getCollection("items");
    // Convert to a dictionary for quick searches because the list could be LONG.
    const itemsDictionary = convertArrayToDictionary(items, "name");
                   
    const options = {};
    getOptionsFromPlayerConfigs(options, menuConfig.playerConfigs, itemsDictionary);

    const optionNames = Object.keys(options);

    const optionNames1 = optionNames.filter(o => o !== menuConfig.items2);
    const optionNames2 = optionNames.filter(o => o !== menuConfig.items1);

    const transferItemCells = [];
    transferItemCells.push(<>
        <SelectList options={optionNames1} isNumberValue={false} baseStateObject={menuConfig} pathToProperty={"items1"} inputHandler={menuStateChangeHandler}></SelectList>
        <div></div>
        <SelectList options={optionNames2} isNumberValue={false} baseStateObject={menuConfig} pathToProperty={"items2"} inputHandler={menuStateChangeHandler}></SelectList>
    </>);

    let allowContinue = true;
    if (menuConfig.items1) {
        const option = options[menuConfig.items1];
        const origin = option.origin;
        const maxCapacity = origin.containerCapacity || calculateCarry(origin);
        const weightCarried = currentWeightCarried(option.items);
        if (origin.container && weightCarried > maxCapacity) {
            allowContinue = false;
        }

        transferItemCells.push(<>
            <div>{weightCarried}/{maxCapacity}</div>
        </>);
    } else {
        transferItemCells.push(<>
            <div>0/0</div>
        </>);
    }

    transferItemCells.push(<>
        <div></div>
    </>);

    if (menuConfig.items2) {
        const option = options[menuConfig.items2];
        const origin = option.origin;
        const maxCapacity = origin.containerCapacity || calculateCarry(origin);
        const weightCarried = currentWeightCarried(option.items);
        if (origin.container && weightCarried > maxCapacity) {
            allowContinue = false;
        }

        transferItemCells.push(<>
            <div>{weightCarried}/{maxCapacity}</div>
        </>);
    } else {
        transferItemCells.push(<>
            <div>0/0</div>
        </>);
    }

    transferItemCells.push(createSelectorForItems(1, 2, options, menuConfig, menuStateChangeHandler, itemsDictionary));

    transferItemCells.push(<>
        <div>
            <CircleButton text={">"} onClickHandler={() => {
                moveItemsFromOneCollectionToAnother(menuConfig, menuStateChangeHandler, options, itemsDictionary, "items1", "items2");
            }} disabled={!menuConfig.items1 || !menuConfig.items2 || !menuConfig.selectedItem || menuConfig.selectedItem.itemsIndex !== 1 }></CircleButton>
            <CircleButton text={"<"} onClickHandler={() => {
                moveItemsFromOneCollectionToAnother(menuConfig, menuStateChangeHandler, options, itemsDictionary, "items2", "items1");
            }} disabled={!menuConfig.items1 || !menuConfig.items2 || !menuConfig.selectedItem || menuConfig.selectedItem.itemsIndex !== 2 }></CircleButton>
        </div>
    </>);

    transferItemCells.push(createSelectorForItems(2, 1, options, menuConfig, menuStateChangeHandler, itemsDictionary));

    return (<>
        <div className="transferItemsMenuWrapperDiv">
            {transferItemCells}
        </div>
        <div className="centerMenuSeperator"></div>
        <div className="transferItemsMenuHorizontal">
            <RetroButton text={"OK"} onClickHandler={() => {
                inputChangeHandler(playerConfigs, "", menuConfig.playerConfigs);
                setCenterScreenMenu({ show: false, menuType: undefined, data: undefined });
            }} showTriangle={false} disabled={!allowContinue}></RetroButton>
            <RetroButton text={"Cancel"} onClickHandler={() => { setCenterScreenMenu({ show: false, menuType: undefined, data: undefined })}} showTriangle={false} disabled={false}></RetroButton>
        </div>
    </>);
}

function getOptionsFromPlayerConfigs(options, playerConfigs, itemsDictionary, pathToProperty = "") {
    options[playerConfigs.name] = {
        origin: playerConfigs,
        items: playerConfigs.items,
        pathToProperty: pathToProperty
    };

    getOptionsFromItems(options, playerConfigs.items, itemsDictionary, playerConfigs.name, pathToProperty);

    if (playerConfigs.currentStatus.activeEffects) {
        for (let i = 0; i < playerConfigs.currentStatus.activeEffects.length; i++) {
            const activeEffect = playerConfigs.currentStatus.activeEffects[i];
            if (activeEffect.allies) {
                for (let j = 0; j < activeEffect.allies.length; j++) {
                    const ally = activeEffect.allies[j];
                    getOptionsFromPlayerConfigs(options, ally, itemsDictionary, pathToProperty + "currentStatus.activeEffects[" + i + "].allies[" + j + "].");
                }
            }
        }
    }
}

function getOptionsFromItems(options, items, itemsDictionary, parentName, pathToProperty) {
    if (items) {
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (!item.custom) {
                const dndItem = getItemFromItemTemplate(itemsDictionary[item.name], itemsDictionary);
                if (dndItem && dndItem.container) {
                    options[item.name + "->" + parentName] = {
                        origin: dndItem,
                        items: item.items,
                        pathToProperty: pathToProperty + "items[" + i + "]."
                    };
                }
            }
        }
    }
}

function createSelectorForItems(itemsIndex, otherItemsIndex, options, menuConfig, menuStateChangeHandler, itemsDictionary) {
    const itemRows = [];

    const itemsName = menuConfig["items" + itemsIndex];
    const option = options[itemsName];
    const items = option?.items;
    if (items) {
        const selectedIndex = menuConfig?.selectedItem?.itemsIndex == itemsIndex ? menuConfig?.selectedItem?.index : undefined;
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const dndItem = getItemFromItemTemplate(itemsDictionary[item.name], itemsDictionary);
            const amount = item.amount;
            itemRows.push(<>
                <div className={selectedIndex === i ? "transferItemsMenuHighlightItem" : ""} onClick={() => {
                    const otherItemsName = menuConfig["items" + otherItemsIndex];
                    const otherOption = otherItemsName ? options[otherItemsName] : undefined;
                    if (otherOption && otherOption.origin !== dndItem) {
                        playAudio("selectionaudio");
                        menuStateChangeHandler(menuConfig, "selectedItem", { itemsIndex: itemsIndex, index: i });
                    } else {
                        menuStateChangeHandler(menuConfig, "selectedItem", undefined);
                    }
                }}>{item.name} {(item.weight ?? dndItem?.weight) + "lb"}{amount ? " x" + amount : ""}</div>
            </>);
        }
    }

    return <>
        <div className="transferItemsMenuSelectionList">{itemRows}</div>
    </>
}

function moveItemsFromOneCollectionToAnother(menuConfig, menuStateChangeHandler, options, itemsDictionary, transferFromItemsProp, transferToItemsProp) {
    const transferFromItemsName = menuConfig[transferFromItemsProp];
    const transferFromOption = options[transferFromItemsName];
    const transferFromPathToProperty = transferFromOption.pathToProperty;

    const transferFromItems = [...transferFromOption.items];
    const movedItem = transferFromItems[menuConfig.selectedItem.index];

    // Remove from the old collection.
    let updatedMenuConfig;
    const removeFromOriginal = !movedItem.amount || movedItem.amount === 1;
    if (removeFromOriginal) {
        transferFromItems.splice(menuConfig.selectedItem.index, 1);
        updatedMenuConfig = menuStateChangeHandler(menuConfig, "playerConfigs." + transferFromPathToProperty + "items", transferFromItems);
    }
    else {
        // Only remove one item.
        const transferFromItemCopy = {...movedItem};
        transferFromItemCopy.amount--;
        updatedMenuConfig = menuStateChangeHandler(menuConfig, "playerConfigs." + transferFromPathToProperty + "items[" + menuConfig.selectedItem.index  + "]", transferFromItemCopy);
    }

    const newOptions = {};
    getOptionsFromPlayerConfigs(newOptions, updatedMenuConfig.playerConfigs, itemsDictionary);

    const transferToItemsName2 = updatedMenuConfig[transferToItemsProp];
    const transferToOption = newOptions[transferToItemsName2];
    const transferToPathToProperty = transferToOption.pathToProperty;

    const transferToItems = [...transferToOption.items];

    let addNewItemInNewCollection = true;
    const indexToInsert = transferToItems.findIndex(item => item.name === movedItem.name);
    if (indexToInsert > -1) {
        const alreadyExistingItem = transferToItems[indexToInsert];
        if (alreadyExistingItem.custom) {
            addNewItemInNewCollection = false;
        } else {
            const dndItem = getItemFromItemTemplate(itemsDictionary[alreadyExistingItem.name], itemsDictionary);
            if (dndItem && dndItem.stackable) {
                addNewItemInNewCollection = false;
            }
        }
    }

    // Add to new collection.
    if (addNewItemInNewCollection) {
        const transferToItemCopy = {...movedItem};
        delete transferToItemCopy.amount;
        delete transferToItemCopy.equipped;
        transferToItems.push(transferToItemCopy);
        updatedMenuConfig = menuStateChangeHandler(updatedMenuConfig, "playerConfigs." + transferToPathToProperty + "items", transferToItems);
    } else {
        // Add to the existing item.
        const alreadyExistingItem = transferToItems[indexToInsert];
        const transferToItemCopy = {...alreadyExistingItem};
        const oldAmount = transferToItemCopy.amount || 1;
        transferToItemCopy.amount = oldAmount + 1;
        delete transferToItemCopy.equipped;
        updatedMenuConfig = menuStateChangeHandler(updatedMenuConfig, "playerConfigs." + transferToPathToProperty + "items[" + indexToInsert  + "]", transferToItemCopy);
    }

    if (removeFromOriginal) {
        menuStateChangeHandler(updatedMenuConfig, "selectedItem", undefined);
    }
}