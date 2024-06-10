import React from "react";
import { getValueFromBaseStateAndPath } from "../SharedFunctions/ComponentFunctions";
import { onInputChangeHandler } from "../SharedFunctions/ComponentFunctions";

export function TextInput({isNumberValue, baseStateObject, pathToProperty, inputHandler}) {
    const startingValue = getValueFromBaseStateAndPath(baseStateObject, pathToProperty);

    return <input className="" value={startingValue} onInput={(event) => {
        let value = null; // Get the linter off my ass about this being a string.
        value = event.currentTarget.value;
        if (isNumberValue) {
            value = Number.parseInt(value);
        }
        return onInputChangeHandler(baseStateObject, pathToProperty, event.currentTarget.value, inputHandler);
    }}></input>
}