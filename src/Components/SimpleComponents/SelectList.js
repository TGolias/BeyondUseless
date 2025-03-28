import React from "react";
import './SelectList.css'
import { getValueFromObjectAndPath, onInputChangeHandler } from "../../SharedFunctions/ComponentFunctions";
import { playAudio } from "../../SharedFunctions/Utils";

export function SelectList({options, isNumberValue, baseStateObject, pathToProperty, inputHandler, buttonSound = undefined}) {
    const startingValue = getValueFromObjectAndPath(baseStateObject, pathToProperty);

    const rows = [];
    if (options) {
        rows.push(<option disabled={true} hidden={true} selected={!startingValue}></option>);
        for (let i = 0; i < options.length; i++) {
            const option = options[i];
            rows.push(<option value={option} selected={startingValue === option}>{option}</option>);
        }
    }
    return <div className="pixel-corners">
        <select className="selectListInput" onInput={(event) => {
            let value = null; // Get the linter off my ass about this being a string.
            value = event.currentTarget.value;
            if (isNumberValue) {
                value = Number.parseInt(value);
            }
            playAudio(buttonSound ? buttonSound : "selectionaudio");
            return onInputChangeHandler(baseStateObject, pathToProperty, value, inputHandler);
        }}>{rows}</select>
    </div>
}