import React from "react";
import "./RetroButton.css"

const rightTriangleUnicode = '\u25B6';

export function RetroButton({text, onClickHandler, disabled}) {
    return (
        <>
            <div className={"retroButtonWrapper" + (disabled ? " disabled" : "")} onClick={onClickHandler}>
                <div className="triangle">{rightTriangleUnicode}</div>
                <div className="retroButtonText">{text}</div>
            </div>
        </>
    )
}