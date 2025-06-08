import React from "react";
import './TextInput.css'
import { getValueFromObjectAndPath, onInputChangeHandler } from "../../SharedFunctions/ComponentFunctions";
import { playAudio } from "../../SharedFunctions/Utils";

export function TextInput({isNumberValue, baseStateObject, pathToProperty, inputHandler, minimum = undefined, maxiumum = undefined, isDecimal = undefined, isMultiline = undefined, buttonSound = undefined}) {
    const startingValue = getValueFromObjectAndPath(baseStateObject, pathToProperty);

    if (isMultiline) {
        return <div className="pixel-corners">
            <textarea className="textArea" value={(isNumberValue && startingValue === 0 ? "" : startingValue)} onInput={(event) => {
                let value = null; // Get the linter off my ass about this being a string.
                value = event.currentTarget.value;
                if (isNumberValue) {
                    if (value) {
                        if (isDecimal) {
                            value = Number.parseFloat(value);
                        } else {
                            value = Number.parseInt(value);
                        }
                    } else {
                        value = 0;
                    }
                }
                playAudio(buttonSound ? buttonSound : "selectionaudio");
                return onInputChangeHandler(baseStateObject, pathToProperty, value, inputHandler);
            }}></textarea>
        </div>
    } else {
        return <div className="pixel-corners">
            <input className="textInput" type={(isNumberValue ? "number" : "text")} min={(minimum)} max={(maxiumum)} value={(isNumberValue && startingValue === 0 ? "" : startingValue)} onInput={(event) => {
                let value = null; // Get the linter off my ass about this being a string.
                value = event.currentTarget.value;
                if (isNumberValue) {
                    if (value) {
                        if (isDecimal) {
                            value = Number.parseFloat(value);
                        } else {
                            value = Number.parseInt(value);
                        }
                    } else {
                        value = 0;
                    }

                    if (minimum) {
                        if (value < 0 && value < minimum) {
                            value = minimum;
                        }
                    }

                    if (maxiumum) {
                        if (value > maxiumum) {
                            value = maxiumum;
                        }
                    }
                }
                playAudio(buttonSound ? buttonSound : "selectionaudio");
                return onInputChangeHandler(baseStateObject, pathToProperty, value, inputHandler);
            }}></input>
        </div>
    }
    
}