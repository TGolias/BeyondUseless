import React from "react";
import "./CircleButton.css"
import { playAudio } from "../../SharedFunctions/Utils";

export function CircleButton({text, onClickHandler, disabled, buttonSound = undefined}) {
    return (
        <>
            <div className={"circleButtonWrapper" + (disabled ? " disabled" : "")} onClick={() => {
                playAudio(buttonSound ? buttonSound : "selectionaudio");
                onClickHandler();
            }}>
                <div className='circleAroundButton pixel-corners'>
                    <div className="circleButtonText">{text}</div>
                </div>
            </div>
        </>
    )
}