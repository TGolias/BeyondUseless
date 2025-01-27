import React from "react";
import './ConfirmationMenu.css';
import { RetroButton } from "../SimpleComponents/RetroButton";

export function ConfirmationMenu({playerConfigs, setCenterScreenMenu, menuConfig, menuStateChangeHandler, inputChangeHandler}) {
    const buttons = [];
    for (const buttonConfig of menuConfig.buttons) {
        buttons.push(<>
            <RetroButton text={buttonConfig.text} onClickHandler={buttonConfig.onClick} showTriangle={true} disabled={false}></RetroButton>
        </>);
    }

    return (<>
        <div className="healthMenuWrapperDiv">
            <div>{menuConfig.menuText}</div>
            <div className="healthMenuHorizontal">{buttons}</div>
        </div>
    </>);
}