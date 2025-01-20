import React from "react";
import './TextInput.css'
import { getValueFromObjectAndPath, onInputChangeHandler } from "../../SharedFunctions/ComponentFunctions";

export function TextInput({isNumberValue, baseStateObject, pathToProperty, inputHandler, minimum=undefined}) {
    const startingValue = getValueFromObjectAndPath(baseStateObject, pathToProperty);

    return <input className="textInput" type={(isNumberValue ? "number" : "text")} min={(minimum)} value={(isNumberValue && startingValue === 0 ? undefined : startingValue)} onInput={(event) => {
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