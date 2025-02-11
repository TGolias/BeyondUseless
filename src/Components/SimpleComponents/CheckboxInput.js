import React from "react";
import './CheckboxInput.css'
import { getValueFromObjectAndPath, onInputChangeHandler } from "../../SharedFunctions/ComponentFunctions";
import { playAudio } from "../../SharedFunctions/Utils";

export function CheckboxInput({baseStateObject, pathToProperty, inputHandler, disabled = false, buttonSound = undefined}) {
    const startingValue = getValueFromObjectAndPath(baseStateObject, pathToProperty);

    return <input className={"checkboxcontrol pixel-corners" + (disabled ? " disabledCheckboxInput" : "")} type="checkbox" checked={startingValue} onInput={(event) => {
        if (!disabled) {
            const value = !event.currentTarget.checked;
            playAudio(buttonSound ? buttonSound : "selectionaudio");
            return onInputChangeHandler(baseStateObject, pathToProperty, value, inputHandler);
        }
    }}></input>
}