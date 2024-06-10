import React from "react";
import { getValueFromBaseStateAndPath } from "../SharedFunctions/ComponentFunctions";
import { onInputChangeHandler } from "../SharedFunctions/ComponentFunctions";

export function TextInput({baseStateObject, pathToProperty, inputHandler}) {
    const startingValue = getValueFromBaseStateAndPath(baseStateObject, pathToProperty);

    return <input value={startingValue} onInput={(event) => onInputChangeHandler(baseStateObject, pathToProperty, event.currentTarget.value, inputHandler)}></input>
}