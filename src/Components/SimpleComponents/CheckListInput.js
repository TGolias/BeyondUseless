import React from "react";
import './CheckListInput.css'
import { getValueFromObjectAndPath } from "../../SharedFunctions/ComponentFunctions";
import { CheckboxInput } from "./CheckboxInput";

export function CheckListInput({baseStateObject, pathToProperty, inputHandler, values}) {
    const checkBoxControls = []
    const currentValues = getValueFromObjectAndPath(baseStateObject, pathToProperty) ?? [];

    const checkBoxInputsValueHolder = {};
    for (let i = 0; i < values.length; i++) {
        const singleCheckboxValue = values[i];
        checkBoxInputsValueHolder[singleCheckboxValue] = currentValues.includes(singleCheckboxValue);
        checkBoxControls.push(<>
            <div className="checkListInputSingleCheckboxWrapper">
                <CheckboxInput baseStateObject={checkBoxInputsValueHolder} pathToProperty={singleCheckboxValue} inputHandler={(bso, ptp, newValue) => {
                    checkBoxInputsValueHolder[singleCheckboxValue] = newValue;
                    const newArrayValue = [];
                    for (let key of Object.keys(checkBoxInputsValueHolder)) {
                        if (checkBoxInputsValueHolder[key]) {
                            newArrayValue.push(key);
                        }
                    }
                    inputHandler(baseStateObject, pathToProperty, newArrayValue);
                }}></CheckboxInput>
                <span>{singleCheckboxValue}</span>
            </div>
        </>);
    }

    return (<>
        <div className="checkListInputWrapper">{checkBoxControls}</div>
    </>)
}