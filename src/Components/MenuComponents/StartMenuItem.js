import React from "react";
import './StartMenuItem.css'
import { RetroButton } from "../SimpleComponents/RetroButton";

export function StartMenuItem({menuText, onClickHandler, currentlySelected, disabled, buttonSound = undefined}) {
    return (
        <>
            <div className="startMenuItem">
                <RetroButton text={menuText} onClickHandler={onClickHandler} showTriangle={true} alwaysShowTriangle={currentlySelected} disabled={disabled} buttonSound={buttonSound}></RetroButton>
            </div>
        </>
    )
}