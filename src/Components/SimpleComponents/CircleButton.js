import React from "react";
import "./CircleButton.css"

export function CircleButton({text, onClickHandler, disabled}) {
    return (
        <>
            <div className={"circleButtonWrapper" + (disabled ? " disabled" : "")} onClick={onClickHandler}>
                <div className='circleAroundButton pixel-corners'>
                    <div className="circleButtonText">{text}</div>
                </div>
            </div>
        </>
    )
}