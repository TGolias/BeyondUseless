import React from "react";
import './TextInput.css'
import { getValueFromObjectAndPath, onInputChangeHandler } from "../../SharedFunctions/ComponentFunctions";
import { playAudio } from "../../SharedFunctions/Utils";

export function TextInput({isNumberValue, baseStateObject, pathToProperty, inputHandler, minimum = undefined, buttonSound = undefined}) {
    const startingValue = getValueFromObjectAndPath(baseStateObject, pathToProperty);

    return <div className="pixel-corners">
        <input className="textInput" type={(isNumberValue ? "number" : "text")} min={(minimum)} value={(isNumberValue && startingValue === 0 ? "" : startingValue)} onInput={(event) => {
            let value = null; // Get the linter off my ass about this being a string.
            value = event.currentTarget.value;
            if (isNumberValue) {
                if (value) {
                    value = Number.parseInt(value);
                } else {
                    value = 0;
                }
            }
            playAudio(buttonSound ? buttonSound : "selectionaudio");
            return onInputChangeHandler(baseStateObject, pathToProperty, value, inputHandler);
        }}></input>
    </div>
}