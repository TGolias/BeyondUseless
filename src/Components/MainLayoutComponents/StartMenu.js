import React from "react";
import './StartMenu.css';
import { StartMenuItem } from "../MenuComponents/StartMenuItem";

export function StartMenu({menuItems}) {
    const rows = []
    for (let i = 0; i < menuItems.length; i++) {
        const menuItem = menuItems[i];
        rows.push(<StartMenuItem menuText={menuItem.text} onClickHandler={menuItem.clickHandler} disabled={menuItem.disabled} buttonSound={menuItem.buttonSound}></StartMenuItem>);
    }
    return (
        <>
            <div className="startMenu pixel-corners">
                <div className="innerBorders pixel-corners">{rows}</div>
            </div>
        </>
    );
}