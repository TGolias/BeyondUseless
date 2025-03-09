import React from 'react';
import './OtherActionsDisplay.css';
import { playAudio } from '../../SharedFunctions/Utils';
import { getCollection } from '../../Collections';
import { isPlayerCurrentlyConcentrating } from '../../SharedFunctions/ConcentrationFunctions';

export function OtherActionsDisplay({playerConfigs, setCenterScreenMenu}) {
    const otherActions = getCollection("actions");

    const otherActionsDisplayRows = [];

    for (let action of otherActions) {
        otherActionsDisplayRows.push(<div onClick={() => openMenuForAction(playerConfigs, action, setCenterScreenMenu)} className={isConcentrationAndPlayerIsAlreadyConcentrating(playerConfigs, action) ? "otherActionsDisplayItem otherActionsDisplayConcentratingOn" : "otherActionsDisplayItem"}>{action.name}</div>);
    }

    return (
        <>
            <div className='outerOtherActionsDisplay pixel-corners'>
                <div className='otherActionsDisplayTitle'>Other Actions</div>
                {otherActionsDisplayRows}
            </div>
        </>
    )
}

function isConcentrationAndPlayerIsAlreadyConcentrating(playerConfigs, action) {
    return isPlayerCurrentlyConcentrating(playerConfigs) && action.concentration;
}

function openMenuForAction(playerConfigs, action, setCenterScreenMenu) {
    playAudio("menuaudio");
    const currentEffectWithConcentration = isPlayerCurrentlyConcentrating(playerConfigs);
    if (currentEffectWithConcentration && action.concentration) {
        setCenterScreenMenu({ show: true, menuType: "ConfirmationMenu", data: { 
            menuTitle: "Concentration", 
            menuText: "Using <b>" + action.name + "</b> will end concentration on <b>" + currentEffectWithConcentration.name + "</b>.", 
            buttons: [
            {
                text: "Continue",
                onClick: () => {
                    setCenterScreenMenu({ show: false, menuType: undefined, data: undefined });
                    openActionMenu(action, setCenterScreenMenu);
                }
            },
            {
                text: "Cancel",
                onClick: () => {
                    setCenterScreenMenu({ show: false, menuType: undefined, data: undefined });
                }
            }
        ] } });
    } else {
        openActionMenu(action, setCenterScreenMenu);
    }
}

function openActionMenu(action, setCenterScreenMenu) {
    setCenterScreenMenu({ show: true, menuType: "ActionMenu", data: { menuTitle: action.name, action: action } });
}
