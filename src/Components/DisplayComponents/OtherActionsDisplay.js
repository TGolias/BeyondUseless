import React from 'react';
import './OtherActionsDisplay.css';
import { playAudio } from '../../SharedFunctions/Utils';
import { getCollection } from '../../Collections';

export function OtherActionsDisplay({setCenterScreenMenu}) {
    const otherActions = getCollection("actions");

    const otherActionsDisplayRows = [];

    for (let action of otherActions) {
        otherActionsDisplayRows.push(<div onClick={() => openMenuForAction(action, setCenterScreenMenu)} className="otherActionsDisplayItem">{action.name}</div>);
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

function openMenuForAction(action, setCenterScreenMenu) {
    playAudio("menuaudio");
    setCenterScreenMenu({ show: true, menuType: "ActionMenu", data: { menuTitle: action.name, action: action } });
}
