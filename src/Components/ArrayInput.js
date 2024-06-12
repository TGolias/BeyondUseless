import React from "react";
import { classes } from "../App";
import { getValueFromBaseStateAndPath } from "../SharedFunctions/ComponentFunctions";
import { SelectList } from "./SelectList";
import "./ArrayInput.css"
import { RetroButton } from "./RetroButton";
import { GetValidClassLevelsArray, GetValidClassesArray } from "../SharedFunctions/MulticlassFunctions";

export function ArrayInput({baseStateObject, pathToProperty, inputHandler, allowAdd, addText, generateAddedItem}) {
    const exampleConfig = [
        {
            pathToProperty: "name",
            componentType: "SelectList",
            options: (baseStateObject, i) => {
                const className = baseStateObject.classes[i].name;
                return GetValidClassesArray(baseStateObject, className);
            },
            isNumber: false
        },
        {
            pathToProperty: "levels",
            componentType: "SelectList",
            options: (baseStateObject, i) => {
                const className = baseStateObject.classes[i].name;
                return GetValidClassLevelsArray(baseStateObject, className);
            },
            isNumber: true
        }
    ]

    const startingValue = getValueFromBaseStateAndPath(baseStateObject, pathToProperty);

    const rows = [];
    for (let i = 0; i < startingValue.length; i++) {
        const columns = [];
        for (let j = 0; j < exampleConfig.length; j++) {
            const configEntry = exampleConfig[j];
            if (configEntry.componentType === "SelectList") {
                columns.push((
                    <>
                        <SelectList isNumberValue={configEntry.isNumber} options={configEntry.options(baseStateObject, i)} baseStateObject={baseStateObject} pathToProperty={pathToProperty + "[" + i + "]." + configEntry.pathToProperty} inputHandler={inputHandler}/>
                    </>
                ));
            }
        }
        rows.push((
            <>
                <div>{columns}</div>
            </>
        ))
    }
    if (allowAdd) {
        rows.push(<>
            <RetroButton text={addText} onClickHandler={() => {
                const newValue = [...startingValue];
                newValue.push(generateAddedItem());
                inputHandler(baseStateObject, pathToProperty, newValue);
            }} disabled={false}></RetroButton>
        </>);
    }

    return <div>{rows}</div>
}