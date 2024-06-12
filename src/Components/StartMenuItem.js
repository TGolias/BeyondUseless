import React from "react";
import './StartMenuItem.css'
import { RetroButton } from "./RetroButton";

export function StartMenuItem({menuText, onClickHandler, disabled}) {
    return (
        <>
            <div className="startMenuItem">
                <RetroButton text={menuText} onClickHandler={onClickHandler} disabled={disabled}></RetroButton>
            </div>
        </>
    )
}