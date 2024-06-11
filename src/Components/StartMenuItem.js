import React from "react";
import './StartMenuItem.css'

const rightTriangleUnicode = '\u25B6';

export function StartMenuItem({menuText, onClickHandler, disabled}) {
    return (
        <>
            <div className={"menuItemWrapper" + (disabled ? " disabled" : "")} onClick={onClickHandler}>
                <div className="triangle">{rightTriangleUnicode}</div>
                <div className="menuText">{menuText}</div>
            </div>
        </>
    )
}