import React from "react";
import './ConfirmationMenu.css';
import { RetroButton } from "../SimpleComponents/RetroButton";

export function ConfirmationMenu({playerConfigs, setCenterScreenMenu, menuConfig, menuStateChangeHandler, inputChangeHandler}) {
    const buttons = [];
    for (const buttonConfig of menuConfig.buttons) {
        buttons.push(<>
            <RetroButton text={buttonConfig.text} onClickHandler={buttonConfig.onClick} showTriangle={false} disabled={false} buttonSound={buttonConfig.sound ? buttonConfig.sound : "selectionaudio" }></RetroButton>
        </>);
    }

    return (<>
        <div className="confirmationMenuWrapperDiv">
            <div className="confirmationMenuText">{menuConfig.menuText}</div>
            <div className="centerMenuSeperator"></div>
            <div className="confirmationMenuHorizontal">{buttons}</div>
        </div>
    </>);
}