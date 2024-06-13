import React from "react";
import "./RetroButton.css"

const rightTriangleUnicode = '\u25B6';

export function RetroButton({text, onClickHandler, showTriangle, disabled}) {
    return (
        <>
            <div className={"retroButtonWrapper" + (disabled ? " disabled" : "")} onClick={onClickHandler}>
                <div className={"triangle" + (showTriangle ? "" : " hideTriangle")}>{rightTriangleUnicode}</div>
                <div className="retroButtonText">{text}</div>
            </div>
        </>
    )
}