import React from "react";
import './ManageHeldEquipmentMenu.css';
import { RetroButton } from "../SimpleComponents/RetroButton";
import { calculateWeaponAttackBonus, calculateWeaponDamage, getItemFromItemTemplate } from "../../SharedFunctions/TabletopMathFunctions";
import { addLeadingPlusIfNumericAndPositive, playAudio } from "../../SharedFunctions/Utils";
import { getNameDictionaryForCollection } from "../../Collections";
import { CanEquipItem, IsItemHoldable } from "../../SharedFunctions/EquipmentFunctions";
import { parseStringForBoldMarkup } from "../../SharedFunctions/ComponentFunctions";
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
        name: "Atk/DC",
        calculateItemValue: (playerConfigs, pathToProperty, item, itemConfig, menuConfig, menuStateChangeHandler, i) => {
            if (item.type === "Weapon") {
                const attack = calculateWeaponAttackBonus(playerConfigs, item, false);
                return addLeadingPlusIfNumericAndPositive(attack.amount);
            } else {
                return "";
            }
        },
        addOnClick: true,
    },
    {
        name: "Damage",
        calculateItemValue: (playerConfigs, pathToProperty, item, itemConfig, menuConfig, menuStateChangeHandler, i) => {
            if (item.type === "Weapon") {
                const amount = calculateWeaponDamage(playerConfigs, item, false, false, false);
                return amount;
            } else {
                return "";
            }
        },
        addOnClick: true,
        addClass: "lastCol"
    }
];

export function ManageHeldEquipmentMenu({playerConfigs, setCenterScreenMenu, addToMenuStack, menuConfig, menuStateChangeHandler, inputChangeHandler}) {
    const miscMap = getNameDictionaryForCollection("misc");
    const equippingWeapons = miscMap["EquippingWeapons"];
    const equippingItemsDescription = parseStringForBoldMarkup(equippingWeapons.description);

    const itemRows = [];
    if (menuConfig.items && menuConfig.items.length > 0) {
        const itemName2Item = getNameDictionaryForCollection("items");

        // Do the header row first.
        for (let row of rows) {
            itemRows.push(<>
                <div className={row.addClass ? "manageHeldEquipmentMenuHeaderCell " + row.addClass : "manageHeldEquipmentMenuHeaderCell"}>{row.name}</div>
            </>);
        }

        for (let i = 0; i < menuConfig.items.length; i++) {
            const itemConfig = menuConfig.items[i];
            const pathToProperty = "items[" + i + "]";
            let dndItem = itemName2Item[itemConfig.name];
            if (dndItem) {
                dndItem = getItemFromItemTemplate(dndItem, itemName2Item);
                if (IsItemHoldable(dndItem)) {
                    for (let row of rows) {
                        itemRows.push(<>
                            <div onClick={() => row.addOnClick ? openMenuForItem(dndItem, addToMenuStack, menuConfig, setCenterScreenMenu) : {}} className={row.addClass ? "manageHeldEquipmentMenuRow " + row.addClass : "manageHeldEquipmentMenuRow"}>{row.calculateItemValue(playerConfigs, pathToProperty, dndItem, itemConfig, menuConfig, menuStateChangeHandler, i)}</div>
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
        <div className="manageHeldEquipmentMenuDescriptionText">{equippingItemsDescription}</div>
        <div className="centerMenuSeperator"></div>
        <div className="manageHeldEquipmentMenuItemsGrid">{itemRows}</div>
        <div className="centerMenuSeperator"></div>
        <div className="manageHeldEquipmentMenuButtonsWrapper">
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

        if (IsItemHoldable(dndItem)) {
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
    addToMenuStack({ menuType: "ManageHeldEquipmentMenu", menuConfig });
    setCenterScreenMenu({ show: true, menuType: "ItemMenu", data: { menuTitle: dndItem.name, item: dndItem, showNotes: true } });
}