import React from "react";
import { classes } from "../App";
import { getValueFromBaseStateAndPath } from "../SharedFunctions/ComponentFunctions";
import { SelectList } from "./SelectList";


export function ArrayInput({baseStateObject, pathToProperty, inputHandler}) {
    const exampleConfig = [
        {
            pathToProperty: "name",
            componentType: "SelectList",
            options: classes.map(x => x.name),
            isNumber: false
        },
        {
            pathToProperty: "levels",
            componentType: "SelectList",
            options: Array.from({length: 20}, (_, i) => i + 1),
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
                        <SelectList isNumberValue={configEntry.isNumber} options={configEntry.options} baseStateObject={baseStateObject} pathToProperty={pathToProperty + "[" + i + "]." + configEntry.pathToProperty} inputHandler={inputHandler}/>
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
    return <div>{rows}</div>
}