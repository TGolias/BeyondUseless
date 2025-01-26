import React from "react";
import './CheckboxInput.css'
import { getValueFromObjectAndPath, onInputChangeHandler } from "../../SharedFunctions/ComponentFunctions";

export function CheckboxInput({baseStateObject, pathToProperty, inputHandler}) {
    const startingValue = getValueFromObjectAndPath(baseStateObject, pathToProperty);

    return <input className="checkboxcontrol pixel-corners" type="checkbox" checked={startingValue} onInput={(event) => {
        const value = !event.currentTarget.checked;
        return onInputChangeHandler(baseStateObject, pathToProperty, value, inputHandler);
    }}></input>
}