import React from "react";
import './CheckboxInput.css'
import { getValueFromObjectAndPath, onInputChangeHandler } from "../../SharedFunctions/ComponentFunctions";
import { playAudio } from "../../SharedFunctions/Utils";

export function CheckboxInput({baseStateObject, pathToProperty, inputHandler, setValueOnTrue = undefined, disabled = false, buttonSound = undefined}) {
    const propertyValue = getValueFromObjectAndPath(baseStateObject, pathToProperty);

    let currentCheckBoxValue;
    let propertyValueToSetOnClick;
    if (setValueOnTrue) {
        if (propertyValue === setValueOnTrue) {
            currentCheckBoxValue = true;
            propertyValueToSetOnClick = undefined;
        } else {
            currentCheckBoxValue = false;
            propertyValueToSetOnClick = setValueOnTrue;
        }
    } else {
        currentCheckBoxValue = propertyValue;
        propertyValueToSetOnClick = !currentCheckBoxValue;
    }

    return <input className={"checkboxcontrol pixel-corners" + (disabled ? " disabledCheckboxInput" : "")} type="checkbox" checked={currentCheckBoxValue} onInput={(event) => {
        if (!disabled) {
            const value = propertyValueToSetOnClick;
            playAudio(buttonSound ? buttonSound : "selectionaudio");
            return onInputChangeHandler(baseStateObject, pathToProperty, value, inputHandler);
        }
    }}></input>
}