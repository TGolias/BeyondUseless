import React from "react";
import './ArmorMenu.css';
import { RetroButton } from "../SimpleComponents/RetroButton";
import { getItemFromItemTemplate, performMathCalculation } from "../../SharedFunctions/TabletopMathFunctions";
import { convertArrayToDictionary, playAudio } from "../../SharedFunctions/Utils";
import { getCollection } from "../../Collections";
import { CanEquipItem } from "../../SharedFunctions/EquipmentFunctions";
import { CheckboxInput } from "../SimpleComponents/CheckboxInput";

const rows = [
    {
        name: "Equip",
        calculateItemValue: (playerConfigs, item, itemConfig, menuConfig, menuStateChangeHandler, i) => {
            const canItemBeEquipped = CanEquipItem(menuConfig.items, item);
            return (<>
                <CheckboxInput baseStateObject={menuConfig} pathToProperty={"items[" + i + "].equipped"} inputHandler={menuStateChangeHandler} disabled={!itemConfig.equipped && !canItemBeEquipped}></CheckboxInput>
            </>);
        },
        addClass: "firstCol"
    },
    {
        name: "Name",
        calculateItemValue: (playerConfigs, item, itemConfig, menuConfig, menuStateChangeHandler, i) => {
            return item.name;
        },
        addOnClick: true,
    },
    {
        name: "AC",
        calculateItemValue: (playerConfigs, item, itemConfig, menuConfig, menuStateChangeHandler, i) => {
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
        const items = getCollection("items");
        const itemName2Item = convertArrayToDictionary(items, "name");

        // Do the header row first.
        for (let row of rows) {
            itemRows.push(<>
                <div className={row.addClass ? "armorMenuHeaderCell " + row.addClass : "armorMenuHeaderCell"}>{row.name}</div>
            </>);
        }

        for (let i = 0; i < menuConfig.items.length; i++) {
            const itemConfig = menuConfig.items[i];
            let dndItem = itemName2Item[itemConfig.name];
            if (dndItem) {
                dndItem = getItemFromItemTemplate(dndItem, itemName2Item);
                if (dndItem.type === "Armor") {
                    for (let row of rows) {
                        itemRows.push(<>
                            <div onClick={() => row.addOnClick ? openMenuForItem(dndItem, addToMenuStack, menuConfig, setCenterScreenMenu) : {}} className={row.addClass ? "armorMenuRow " + row.addClass : "armorMenuRow"}>{row.calculateItemValue(playerConfigs, dndItem, itemConfig, menuConfig, menuStateChangeHandler, i)}</div>
                        </>);
                    }
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

function openMenuForItem(dndItem, addToMenuStack, menuConfig, setCenterScreenMenu) {
    playAudio("menuaudio");
    addToMenuStack({ menuType: "ArmorMenu", menuConfig });
    setCenterScreenMenu({ show: true, menuType: "ItemMenu", data: { menuTitle: dndItem.name, item: dndItem } });
}