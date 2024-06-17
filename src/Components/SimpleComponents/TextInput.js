import React from "react";
import { getValueFromObjectAndPath, onInputChangeHandler } from "../../SharedFunctions/ComponentFunctions";

export function TextInput({isNumberValue, baseStateObject, pathToProperty, inputHandler}) {
    const startingValue = getValueFromObjectAndPath(baseStateObject, pathToProperty);

    return <input value={startingValue} onInput={(event) => {
        let value = null; // Get the linter off my ass about this being a string.
        value = event.currentTarget.value;
        if (isNumberValue) {
            value = Number.parseInt(value);
        }
        return onInputChangeHandler(baseStateObject, pathToProperty, value, inputHandler);
    }}></input>
}