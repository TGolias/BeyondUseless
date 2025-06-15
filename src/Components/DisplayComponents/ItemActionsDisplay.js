import React from 'react';
import './ItemActionsDisplay.css';
import { getCastingTimeShorthand } from '../../SharedFunctions/ComponentFunctions';
import { getNameDictionaryForCollection } from '../../Collections';
import { playAudio } from '../../SharedFunctions/Utils';
import { getItemFromItemTemplate } from '../../SharedFunctions/TabletopMathFunctions';

const itemActionRows = [
    {
        name: "Item",
        calculateValue: (playerConfigs, item, dndItem, itemAction) => {
            return item.name;
        },
        addClass: "firstCol"
    },
    {
        name: "Action Time",
        calculateValue: (playerConfigs, item, dndItem, itemAction) => {
            let actionTime = "";
            if (Array.isArray(itemAction.actionTime)) {
                for (let singleActionTime of itemAction.actionTime) {
                    if (actionTime.length > 0) {
                        actionTime += " or ";
                    }
                    actionTime += getCastingTimeShorthand(singleActionTime);
                }
            }
            return actionTime;
        },
    },
    {
        name: "Uses",
        calculateValue: (playerConfigs, item, dndItem, itemAction) => {
            return "x" + (item.amount || 1);
        },
        addClass: "lastCol"
    }
];

export function ItemActionsDisplay({playerConfigs, items, getItemAction, setCenterScreenMenu}) {
    const itemName2Item = getNameDictionaryForCollection("items");

    const controlsToDisplay = [];
    controlsToDisplay.push(createSingleItemActionsGroup(playerConfigs, setCenterScreenMenu, "Consumable Items", items, itemName2Item, getItemAction));
    
    return (
        <>
            <div className='itemActionsDisplayOutermostDiv'>{controlsToDisplay}</div>
        </>
    )
}

function createSingleItemActionsGroup(playerConfigs, setCenterScreenMenu, groupName, items, itemName2Item, getItemAction) {
    const actionsGrouping = [];
    actionsGrouping.push(<div className='itemActionsDisplayTitle'>{groupName}</div>);

    const actionRows = [];
    for (let row of itemActionRows) {
        actionRows.push(<div className={row.addClass}>{row.name}</div>);
    }

    for (let item of items) {
        let dndItem = itemName2Item[item.name];
        dndItem = getItemFromItemTemplate(dndItem);
        const itemAction = getItemAction(dndItem);
        for (let row of itemActionRows) {
            actionRows.push(<div onClick={() => openMenuForItemAction(dndItem, setCenterScreenMenu)} className={row.addClass ? "itemActionsDisplayRow " + row.addClass : "itemActionsDisplayRow"}>{row.calculateValue(playerConfigs, item, dndItem, itemAction)}</div>);
        }
    }

    actionsGrouping.push(<div className='itemActionsDisplayGrid'>{actionRows}</div>);
    
    return (<>
        <div className='itemActionsSingleGroup pixel-corners'>{actionsGrouping}</div>
    </>);
}

function openMenuForItemAction(dndItem, setCenterScreenMenu) {
    playAudio("menuaudio");
    setCenterScreenMenu({ show: true, menuType: "ItemMenu", data: { menuTitle: dndItem.name, item: dndItem } });
}