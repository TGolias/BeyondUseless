import React from "react";
import './ManageHeldEquipmentMenu.css';
import { RetroButton } from "../SimpleComponents/RetroButton";
import { calculateWeaponAttackBonus, calculateWeaponDamage, getItemFromItemTemplate } from "../../SharedFunctions/TabletopMathFunctions";
import { convertArrayToDictionary, playAudio } from "../../SharedFunctions/Utils";
import { getCollection } from "../../Collections";
import { IsItemHoldable } from "../../SharedFunctions/EquipmentFunctions";
import { parseStringForBoldMarkup } from "../../SharedFunctions/ComponentFunctions";

const rows = [
    {
        name: "Equip",
        calculateItemValue: (playerConfigs, item, itemConfig) => {
            return itemConfig.equipped ? "TRUE" : "FALSE";
        },
        addClass: "firstCol"
    },
    {
        name: "Name",
        calculateItemValue: (playerConfigs, item, itemConfig) => {
            return item.name;
        }
    },
    {
        name: "Atk/DC",
        calculateItemValue: (playerConfigs, item, itemConfig) => {
            if (item.type === "Weapon") {
                const attack = calculateWeaponAttackBonus(playerConfigs, item, false);
                return (attack.amount < 0 ? "" : "+") + attack.amount;
            } else {
                return "";
            }
        }
    },
    {
        name: "Damage",
        calculateItemValue: (playerConfigs, item, itemConfig) => {
            if (item.type === "Weapon") {
                let amount = calculateWeaponDamage(playerConfigs, item, false, false, false);
                amount += " " + item.damage.damageType;
                return amount;
            } else {
                return "";
            }
        },
        addClass: "lastCol"
    }
];

export function ManageHeldEquipmentMenu({playerConfigs, setCenterScreenMenu, addToMenuStack, menuConfig, menuStateChangeHandler, inputChangeHandler}) {
    const misc = getCollection("misc");
    const equippingWeapons = misc.find(miscEntry => miscEntry.name === "EquippingWeapons");
    const equippingItemsDescription = parseStringForBoldMarkup(equippingWeapons.description);

    const itemRows = [];
    if (menuConfig.items && menuConfig.items.length > 0) {
        const items = getCollection("items");
        const itemName2Item = convertArrayToDictionary(items, "name");

        // Do the header row first.
        for (let row of rows) {
            itemRows.push(<>
                <div className={row.addClass ? "manageHeldEquipmentMenuHeaderCell " + row.addClass : "manageHeldEquipmentMenuHeaderCell"}>{row.name}</div>
            </>);
        }

        for (let i = 0; i < menuConfig.items.length; i++) {
            const itemConfig = menuConfig.items[i];
            let dndItem = itemName2Item[itemConfig.name];
            dndItem = getItemFromItemTemplate(dndItem, itemName2Item);
            if (IsItemHoldable(dndItem)) {
                for (let row of rows) {
                    itemRows.push(<>
                        <div onClick={() => openMenuForItem(dndItem, addToMenuStack, menuConfig, setCenterScreenMenu)} className={row.addClass ? "manageHeldEquipmentMenuRow " + row.addClass : "manageHeldEquipmentMenuRow"}>{row.calculateItemValue(playerConfigs, dndItem, itemConfig)}</div>
                    </>);
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
            <RetroButton text="OK" onClickHandler={() => setCenterScreenMenu({ show: false, menuType: undefined, data: undefined })} showTriangle={false} disabled={false}></RetroButton>
            <RetroButton text="Cancel" onClickHandler={() => setCenterScreenMenu({ show: false, menuType: undefined, data: undefined })} showTriangle={false} disabled={false}></RetroButton>
        </div>
    </>);
}

function openMenuForItem(dndItem, addToMenuStack, menuConfig, setCenterScreenMenu) {
    playAudio("menuaudio");
    addToMenuStack({ menuType: "ManageHeldEquipmentMenu", menuConfig });
    setCenterScreenMenu({ show: true, menuType: "ItemMenu", data: { menuTitle: dndItem.name, item: dndItem } });
}