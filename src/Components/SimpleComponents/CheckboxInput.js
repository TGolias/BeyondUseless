import React from "react";
import './CheckboxInput.css'
import { getValueFromObjectAndPath, onInputChangeHandler } from "../../SharedFunctions/ComponentFunctions";
import { playAudio } from "../../SharedFunctions/Utils";

export function CheckboxInput({baseStateObject, pathToProperty, inputHandler, buttonSound = undefined}) {
    const startingValue = getValueFromObjectAndPath(baseStateObject, pathToProperty);

    return <input className="checkboxcontrol pixel-corners" type="checkbox" checked={startingValue} onInput={(event) => {
        const value = !event.currentTarget.checked;
        playAudio(buttonSound ? buttonSound : "selectionaudio");
        return onInputChangeHandler(baseStateObject, pathToProperty, value, inputHandler);
    }}></input>
}