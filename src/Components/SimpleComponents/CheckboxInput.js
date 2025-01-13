import React from "react";
import './CheckboxInput.css'
import { getValueFromObjectAndPath, onInputChangeHandler } from "../../SharedFunctions/ComponentFunctions";

export function CheckboxInput({baseStateObject, pathToProperty, inputHandler}) {
    const startingValue = getValueFromObjectAndPath(baseStateObject, pathToProperty);

    return <input type="checkbox" value={startingValue} onInput={(event) => {
        let value = false;
        value = !!event.currentTarget.value;
        return onInputChangeHandler(baseStateObject, pathToProperty, value, inputHandler);
    }}></input>
}