import React from "react";
import './StartMenuItem.css'
import { RetroButton } from "../SimpleComponents/RetroButton";

export function StartMenuItem({menuText, onClickHandler, disabled, buttonSound = undefined}) {
    return (
        <>
            <div className="startMenuItem">
                <RetroButton text={menuText} onClickHandler={onClickHandler} showTriangle={true} disabled={disabled} buttonSound={buttonSound}></RetroButton>
            </div>
        </>
    )
}