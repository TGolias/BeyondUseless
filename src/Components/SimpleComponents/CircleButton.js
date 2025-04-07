import React from "react";
import "./CircleButton.css"
import { playAudio } from "../../SharedFunctions/Utils";

export function CircleButton({text, onClickHandler, disabled, buttonSound = undefined, upsideDown = undefined}) {
    return (
        <>
            <div className={"circleButtonWrapper" + (disabled ? " circleButtonDisabled" : "")} onClick={() => {
                playAudio(buttonSound ? buttonSound : "selectionaudio");
                onClickHandler();
            }}>
                <div className='circleAroundButton pixel-corners'>
                    <div className={upsideDown ? "circleButtonText circleButtonUpsideDown" : "circleButtonText"}>{text}</div>
                </div>
            </div>
        </>
    )
}