import React from 'react';
import './InventoryDisplay.css';
import { calculateCarry, calculateDragLiftPush, currentWeightCarried, getItemFromItemTemplate } from '../../SharedFunctions/TabletopMathFunctions';
import { getCollection, getNameDictionaryForCollection } from '../../Collections';
import { playAudio } from '../../SharedFunctions/Utils';
import { CheckboxInput } from '../SimpleComponents/CheckboxInput';
import { CanAttuneItem, CanEquipItem } from '../../SharedFunctions/EquipmentFunctions';
import { RetroButton } from '../SimpleComponents/RetroButton';
import { addItemsToNewItems } from '../../SharedFunctions/ItemFunction';

const rows = [
    {
        name: "Equip",
        onClick: (playerConfigs, inputChangeHandler, item, dndItem, i, setCenterScreenMenu) => {
            if (item.custom || !dndItem.equippable) {
                onItemClicked(playerConfigs, inputChangeHandler, item, dndItem, i, setCenterScreenMenu);
            }
        },
        calculateValue: (playerConfigs, inputChangeHandler, item, dndItem, i) => {
            if (dndItem?.equippable) {
                const canItemBeEquipped = CanEquipItem(playerConfigs.items, dndItem);
                return <>
                    <CheckboxInput baseStateObject={playerConfigs} pathToProperty={"items[" + i + "].equipped"} inputHandler={inputChangeHandler} disabled={!item.equipped && !canItemBeEquipped}></CheckboxInput>
                </>
            }
            return "";
        },
        addClass: "firstCol"
    },
    {
        name: "Name",
        onClick: (playerConfigs, inputChangeHandler, item, dndItem, i, setCenterScreenMenu) => {
            onItemClicked(playerConfigs, inputChangeHandler, item, dndItem, i, setCenterScreenMenu);
        },
        calculateValue: (playerConfigs, inputChangeHandler, item, dndItem, i) => {
            return item.name;
        },
    },
    {
        name: "lbs",
        onClick: (playerConfigs, inputChangeHandler, item, dndItem, i, setCenterScreenMenu) => {
            onItemClicked(playerConfigs, inputChangeHandler, item, dndItem, i, setCenterScreenMenu);
        },
        calculateValue: (playerConfigs, inputChangeHandler, item, dndItem, i) => {
            return (item.weight ?? dndItem?.weight) + "lb";
        },
    },
    {
        name: "Attune",
        onClick: (playerConfigs, inputChangeHandler, item, dndItem, i, setCenterScreenMenu) => {
            if (item.custom || !dndItem.attunement) {
                onItemClicked(playerConfigs, inputChangeHandler, item, dndItem, i, setCenterScreenMenu);
            }
        },
        calculateValue: (playerConfigs, inputChangeHandler, item, dndItem, i) => {
            if (dndItem?.attunement) {
                const canItemBeAttuned = CanAttuneItem(playerConfigs);
                return <>
                    <CheckboxInput baseStateObject={playerConfigs} pathToProperty={"items[" + i + "].attuned"} inputHandler={inputChangeHandler} setValueOnTrue={playerConfigs.name} disabled={!item.attuned && !canItemBeAttuned}></CheckboxInput>
                </>
            }
            return "";
        },
    },
    {
        name: "",
        onClick: (playerConfigs, inputChangeHandler, item, dndItem, i, setCenterScreenMenu) => {
            if (item.custom || dndItem.stackable) {
                openQuantityMenu(playerConfigs, inputChangeHandler, item, i, setCenterScreenMenu);
            } else {
                removeItem(playerConfigs, inputChangeHandler, i);
            }
        },
        calculateValue: (playerConfigs, inputChangeHandler, item, dndItem, i) => {
            if (!dndItem || dndItem.stackable) {
                // Quanity increase and decrease buttons
                let quantityString;
                if (item.amount) {
                    quantityString = "x" + item.amount;
                } else {
                    quantityString = "x1"
                }
                return quantityString
            } else {
                return "X"
            }
        },
        addClass: "lastCol"
    },
];

export function InventoryDisplay({playerConfigs, inputChangeHandler, setCenterScreenMenu}) {

    const itemRows = [];

    if (playerConfigs.items && playerConfigs.items.length > 0) {
        for (let row of rows) {
            itemRows.push(<div className={row.addClass ? "inventoryDisplayTitle " + row.addClass : "inventoryDisplayTitle"}>{row.name}</div>);
        }

        // Check equipped items for the aspect.
        const itemsDictionary = getNameDictionaryForCollection("items");
        for (let i = 0; i < playerConfigs.items.length; i++) {
            const item = playerConfigs.items[i];
            const dndItem = getItemFromItemTemplate(itemsDictionary[item.name], itemsDictionary);
            for (let row of rows) {
                itemRows.push(<div className={row.addClass ? "inventoryDisplayItem " + row.addClass : "inventoryDisplayItem"} onClick={() => { row.onClick(playerConfigs, inputChangeHandler, item, dndItem, i, setCenterScreenMenu); }}>{row.calculateValue(playerConfigs, inputChangeHandler, item, dndItem, i)}</div>);
            }
        }
    }

    const inventoryDisplayButtons = [];
    inventoryDisplayButtons.push(<>
        <RetroButton text={"Add"} onClickHandler={() => { addItemsMenu(playerConfigs, inputChangeHandler, setCenterScreenMenu); }} showTriangle={false} disabled={false}></RetroButton>
    </>);
    if (playerConfigs.parent === undefined) {
        // Only show the transfer button for the main character.
        inventoryDisplayButtons.push(<>
            <RetroButton text={"Transfer"} onClickHandler={() => { setCenterScreenMenu({ show: true, menuType: "TransferItemsMenu", data: undefined }); } } showTriangle={false} disabled={false}></RetroButton>
        </>);
    }
    inventoryDisplayButtons.push(<>
        <RetroButton text={"Reorder"} onClickHandler={() => { moveItemsMenu(playerConfigs, inputChangeHandler, setCenterScreenMenu); }} showTriangle={false} disabled={false}></RetroButton>
    </>);
     
    return (
        <>
            <div className='outerInventoryDisplay pixel-corners'>
                <div className='inventoryDisplayTitle'>Inventory</div>
                <div className='inventoryDisplayCarryDragLiftPushTable'>
                    <div>Carry Capacity</div>
                    <div>Drag, Lift, Push</div>
                    <div>{currentWeightCarried(playerConfigs.items)}/{calculateCarry(playerConfigs)}</div>
                    <div>{calculateDragLiftPush(playerConfigs)}</div>
                </div>
                <div className='inventoryDisplayItems'>
                    {itemRows}
                </div>
                <div className='inventoryDisplayButtons'>
                    {inventoryDisplayButtons}
                </div>
            </div>
        </>
    )
}

function onItemClicked(playerConfigs, inputChangeHandler, item, dndItem, i, setCenterScreenMenu) {
    playAudio("menuaudio");

    if (!item.custom) {
        setCenterScreenMenu({ show: true, menuType: "ItemMenu", data: { menuTitle: dndItem.name, item: dndItem } });
    } else {
        setCenterScreenMenu({ show: true, menuType: "CustomItemMenu", data: { customItem: item, 
            onOkClicked: (newCustomItem) => {
                inputChangeHandler(playerConfigs, "items[" + i + "]", newCustomItem);
            }
        } });
    }
}

function removeItem(playerConfigs, inputChangeHandler, i) {
    playAudio("selectionaudio");
    const itemBeingRemoved = playerConfigs.items[i];
    const newItems =  [...playerConfigs.items];
    newItems.splice(i, 1);

    if (itemBeingRemoved.items && itemBeingRemoved.items.length > 0) {
        addItemsToNewItems(newItems, itemBeingRemoved.items);
    }

    inputChangeHandler(playerConfigs, "items", newItems);
}

function openQuantityMenu(playerConfigs, inputChangeHandler, item, i, setCenterScreenMenu) {
    setCenterScreenMenu({ show: true, menuType: "QuantityMenu", data: { menuTitle: item.name + " Quantity", menuText: item.name + "(s):", quantity: (item.amount || 1), 
        onOkClicked: (newQuantity) => {
            if (newQuantity === 0) {
                // remove the item since there are none left.
                const newItems =  [...playerConfigs.items];
                newItems.splice(i, 1);
                inputChangeHandler(playerConfigs, "items", newItems);
            } else {
                // Set the new quantity.
                inputChangeHandler(playerConfigs, "items[" + i + "].amount", newQuantity);
            }
        } } 
    });
}

function addItemsMenu(playerConfigs, inputChangeHandler, setCenterScreenMenu) {
    const allItems = getCollection("items");
    const allItemNames = allItems.map(item => item.name);
    const itemSelections = ["Custom Item", ...allItemNames];

    setCenterScreenMenu({ show: true, menuType: "SelectListMenu", data: { menuTitle: "Add Item", menuText: "Select the item to add:", options: itemSelections, 
        onOkClicked: (result) => {
            if (result === "Custom Item") {
                setCenterScreenMenu({ show: true, menuType: "CustomItemMenu", data: { customItem: { custom: true }, 
                    onOkClicked: (newCustomItem) => {
                        addItemsOrIncreaseStackCount(playerConfigs, inputChangeHandler, allItems, newCustomItem);
                    }
                } });
            } else {
                addItemsOrIncreaseStackCount(playerConfigs, inputChangeHandler, allItems, { name: result });
            }
        } } 
    });
}

function moveItemsMenu(playerConfigs, inputChangeHandler, setCenterScreenMenu) {
    setCenterScreenMenu({ show: true, menuType: "MoveItemsMenu", data: { items: playerConfigs.items, onOkClicked: (newItemsOrder) => {
        inputChangeHandler(playerConfigs, "items", newItemsOrder);
    } } });
}

function addItemsOrIncreaseStackCount(playerConfigs, inputChangeHandler, allItems, itemToAdd) {
    const dndItem = allItems.find(x => x.name === itemToAdd.name);
    if (itemToAdd.custom || dndItem?.stackable) {
        for (let i = 0; i < playerConfigs.items.length; i++) {
            if (playerConfigs.items[i].name === itemToAdd.name) {
                const oldAmount = playerConfigs.items[i].amount || 1;
                const newAmount = oldAmount + 1;
                inputChangeHandler(playerConfigs, "items[" + i + "].amount", newAmount);
                return;
            }
        }
    }

    if (dndItem && dndItem.container) {
        itemToAdd.items = [];
    }
    const newItems =  [...playerConfigs.items];
    newItems.push(itemToAdd);
    inputChangeHandler(playerConfigs, "items", newItems);
}