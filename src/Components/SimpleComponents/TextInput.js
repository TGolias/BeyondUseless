import React from "react";
import './TextInput.css'
import { getValueFromObjectAndPath, onInputChangeHandler } from "../../SharedFunctions/ComponentFunctions";

export function TextInput({isNumberValue, baseStateObject, pathToProperty, inputHandler}) {
    const startingValue = getValueFromObjectAndPath(baseStateObject, pathToProperty);

    return <input className="textInput" value={startingValue} onInput={(event) => {
        let value = null; // Get the linter off my ass about this being a string.
        value = event.currentTarget.value;
        if (isNumberValue) {
            if (value) {
                value = Number.parseInt(value);
            } else {
                value = 0;
            }
            
        }
        return onInputChangeHandler(baseStateObject, pathToProperty, value, inputHandler);
    }}></input>
}