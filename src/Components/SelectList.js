import React from "react";
import { getValueFromObjectAndPath } from "../SharedFunctions/ComponentFunctions";
import { onInputChangeHandler } from "../SharedFunctions/ComponentFunctions";

export function SelectList({options, isNumberValue, baseStateObject, pathToProperty, inputHandler}) {
    const startingValue = getValueFromObjectAndPath(baseStateObject, pathToProperty);

    const rows = [];
    if (options) {
        rows.push(<option disabled={true} hidden={true} selected={!startingValue}></option>);
        for (let i = 0; i < options.length; i++) {
            const option = options[i];
            rows.push(<option value={option} selected={startingValue === option}>{option}</option>);
        }
    }
    return <select onInput={(event) => {
        let value = null; // Get the linter off my ass about this being a string.
        value = event.currentTarget.value;
        if (isNumberValue) {
            value = Number.parseInt(value);
        }
        return onInputChangeHandler(baseStateObject, pathToProperty, value, inputHandler);
    }}>{rows}</select>
}