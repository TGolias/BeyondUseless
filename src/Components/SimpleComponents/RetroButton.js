import React from "react";
import "./RetroButton.css"
import { playAudio } from "../../SharedFunctions/Utils";

const rightTriangleUnicode = '\u25B6';

export function RetroButton({text, onClickHandler, showTriangle, disabled, buttonSound = undefined}) {


    return (
        <>
            <div className={"retroButtonWrapper" + (disabled ? " disabled" : "")} onClick={() => {
                playAudio(buttonSound ? buttonSound : "selectionaudio");
                onClickHandler();
            }}>
                <div className={"triangle" + (showTriangle ? "" : " hideTriangle")}>{rightTriangleUnicode}</div>
                <div className="retroButtonText">{text}</div>
            </div>
        </>
    )
}