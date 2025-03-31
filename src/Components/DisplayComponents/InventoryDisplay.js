import React from 'react';
import './InventoryDisplay.css';
import { calculateCarry, calculateDragLiftPush, currentWeightCarried, getItemFromItemTemplate } from '../../SharedFunctions/TabletopMathFunctions';
import { RetroButton } from '../SimpleComponents/RetroButton';
import { getCollection } from '../../Collections';
import { convertArrayToDictionary } from '../../SharedFunctions/Utils';

const rows = [
    {
        name: "Name",
        calculateValue: (item, dndItem) => {
            return item.name;
        },
        addClass: "firstCol"
    },
    {
        name: "Weight",
        calculateValue: (item, dndItem) => {
            return (item.weight ?? dndItem.weight) + "lb";
        },
    },
    {
        name: "",
        calculateValue: (item, dndItem) => {
            if (dndItem.stackable) {
                // Quanity increase and decrease buttons
                if (item.amount) {
                    return "x" + item.amount;
                } else {
                    return "x1"
                }
            } else {
                // Remove Button
                return "X"
            }
        },
        addClass: "lastCol"
    }
];

export function InventoryDisplay({playerConfigs, setCenterScreenMenu}) {

    const itemRows = [];

    if (playerConfigs.items && playerConfigs.items.length > 0) {
        for (let row of rows) {
            itemRows.push(<div className={row.addClass ? "outerInventoryTitle " + row.addClass : "outerInventoryTitle"}>{row.name}</div>);
        }

        // Check equipped items for the aspect.
        const items = getCollection("items");
        // Convert to a dictionary for quick searches because the list could be LONG.
        const itemsDictionary = convertArrayToDictionary(items, "name");
        for (let item of playerConfigs.items) {
            const dndItem = getItemFromItemTemplate(itemsDictionary[item.name], itemsDictionary);
            for (let row of rows) {
                itemRows.push(<div className={row.addClass ? "outerInventoryItem " + row.addClass : "outerInventoryItem"} onClick={() => { onItemClicked(dndItem, setCenterScreenMenu); }}>{row.calculateValue(item, dndItem)}</div>);
            }
        }
    }
     
    return (
        <>
            <div className='outerInventoryDisplay pixel-corners'>
                <div className='outerInventoryTitle'>Inventory</div>
                <div className='outerInventoryCarryDragLiftPushTable'>
                    <div>Carry Capacity</div>
                    <div>Drag/Lift/Push</div>
                    <div>{currentWeightCarried(playerConfigs)}/{calculateCarry(playerConfigs)}</div>
                    <div>{calculateDragLiftPush(playerConfigs)}</div>
                </div>
                <div className='outerInventoryItems'>
                    {itemRows}
                </div>
            </div>
        </>
    )
}

function onItemClicked(dndItem, setCenterScreenMenu) {
    setCenterScreenMenu({ show: true, menuType: "ItemMenu", data: { menuTitle: dndItem.name, item: dndItem } });
}