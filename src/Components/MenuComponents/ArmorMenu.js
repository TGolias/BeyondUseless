import React from "react";
import './ArmorMenu.css';
import { RetroButton } from "../SimpleComponents/RetroButton";
import { getItemFromItemTemplate, performMathCalculation } from "../../SharedFunctions/TabletopMathFunctions";
import { playAudio } from "../../SharedFunctions/Utils";
import { getNameDictionaryForCollection } from "../../Collections";
import { CanEquipItem } from "../../SharedFunctions/EquipmentFunctions";
import { CheckboxInput } from "../SimpleComponents/CheckboxInput";

const rows = [
    {
        name: "Equip",
        calculateItemValue: (playerConfigs, pathToProperty, item, itemConfig, menuConfig, menuStateChangeHandler, i) => {
            const canItemBeEquipped = CanEquipItem(playerConfigs, menuConfig.items, item);
            return (<>
                <CheckboxInput baseStateObject={menuConfig} pathToProperty={pathToProperty + ".equipped"} inputHandler={menuStateChangeHandler} disabled={!itemConfig.equipped && !canItemBeEquipped}></CheckboxInput>
            </>);
        },
        addClass: "firstCol"
    },
    {
        name: "Name",
        calculateItemValue: (playerConfigs, pathToProperty, item, itemConfig, menuConfig, menuStateChangeHandler, i) => {
            return item.name;
        },
        addOnClick: true,
    },
    {
        name: "AC",
        calculateItemValue: (playerConfigs, pathToProperty, item, itemConfig, menuConfig, menuStateChangeHandler, i) => {
            if (item.aspects) {
                if (item.aspects.armorClass) {
                    return performMathCalculation(playerConfigs, item.aspects.armorClass.calculation);
                } else if (item.aspects.armorClassBonus) {
                    return "+" + performMathCalculation(playerConfigs, item.aspects.armorClassBonus.calculation);
                }
            }
            return "";
        },
        addOnClick: true,
        addClass: "lastCol"
    }
];

export function ArmorMenu({playerConfigs, setCenterScreenMenu, addToMenuStack, menuConfig, menuStateChangeHandler, inputChangeHandler}) {
    const itemRows = [];
    if (menuConfig.items && menuConfig.items.length > 0) {
        const itemName2Item = getNameDictionaryForCollection("items");

        // Do the header row first.
        for (let row of rows) {
            itemRows.push(<>
                <div className={row.addClass ? "armorMenuHeaderCell " + row.addClass : "armorMenuHeaderCell"}>{row.name}</div>
            </>);
        }

        for (let i = 0; i < menuConfig.items.length; i++) {
            const pathToProperty = "items[" + i + "]";
            const itemConfig = menuConfig.items[i];
            let dndItem = itemName2Item[itemConfig.name];
            if (dndItem) {
                dndItem = getItemFromItemTemplate(dndItem, itemName2Item);
                if (dndItem.type === "Armor") {
                    for (let row of rows) {
                        itemRows.push(<>
                            <div onClick={() => row.addOnClick ? openMenuForItem(dndItem, addToMenuStack, menuConfig, setCenterScreenMenu) : {}} className={row.addClass ? "armorMenuRow " + row.addClass : "armorMenuRow"}>{row.calculateItemValue(playerConfigs, pathToProperty, dndItem, itemConfig, menuConfig, menuStateChangeHandler, i)}</div>
                        </>);
                    }
                }

                if (dndItem.childItems && itemConfig.equipped) {
                    processChildItems(playerConfigs, pathToProperty + ".childItems", itemConfig.childItems, dndItem.childItems, itemRows, menuConfig, menuStateChangeHandler, addToMenuStack, setCenterScreenMenu);
                }
            }
        }
    }

    return (<>
        <div className="armorMenuItemsGrid">{itemRows}</div>
        <div className="centerMenuSeperator"></div>
        <div className="armorMenuButtonsWrapper">
            <RetroButton text="OK" onClickHandler={() => {
                inputChangeHandler(playerConfigs, "items", menuConfig.items);
                setCenterScreenMenu({ show: false, menuType: undefined, data: undefined });
            }} showTriangle={false} disabled={false}></RetroButton>
            <RetroButton text="Cancel" onClickHandler={() => setCenterScreenMenu({ show: false, menuType: undefined, data: undefined })} showTriangle={false} disabled={false}></RetroButton>
        </div>
    </>);
}

function processChildItems(playerConfigs, pathToProperty, childItemsConfigs, dndChildItems, itemRows, menuConfig, menuStateChangeHandler, addToMenuStack, setCenterScreenMenu) {
    for (let i = 0; i < dndChildItems.length; i++) {
        const pathToItem = pathToProperty + "[" + i + "]";
        const dndItem = dndChildItems[i];
        let itemConfig = {
            name: dndItem.name
        }
        if (childItemsConfigs && childItemsConfigs.length > i) {
            itemConfig = {...itemConfig, ...childItemsConfigs[i]};
        }

        if (dndItem.type === "Armor") {
            for (let row of rows) {
                itemRows.push(<>
                    <div onClick={() => row.addOnClick ? openMenuForItem(dndItem, addToMenuStack, menuConfig, setCenterScreenMenu) : {}} className={row.addClass ? "manageHeldEquipmentMenuRow " + row.addClass : "manageHeldEquipmentMenuRow"}>{row.calculateItemValue(playerConfigs, pathToItem, dndItem, itemConfig, menuConfig, menuStateChangeHandler, i)}</div>
                </>);
            }
        }

        if (dndItem.childItems && itemConfig.equipped) {
            processChildItems(playerConfigs, pathToItem + ".childItems", itemConfig.childItems, dndItem.childItems, itemRows, menuConfig, menuStateChangeHandler, addToMenuStack, setCenterScreenMenu);
        }
    }
}

function openMenuForItem(dndItem, addToMenuStack, menuConfig, setCenterScreenMenu) {
    playAudio("menuaudio");
    addToMenuStack({ menuType: "ArmorMenu", menuConfig });
    setCenterScreenMenu({ show: true, menuType: "ItemMenu", data: { menuTitle: dndItem.name, item: dndItem, showNotes: true } });
}