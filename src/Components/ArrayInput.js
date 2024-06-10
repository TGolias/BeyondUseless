import React from "react";
import { classes } from "../App";
import { getValueFromBaseStateAndPath } from "../SharedFunctions/ComponentFunctions";
import { SelectList } from "./SelectList";

export function ArrayInput({baseStateObject, pathToProperty, inputHandler}) {
    const startingValue = getValueFromBaseStateAndPath(baseStateObject, pathToProperty);

    const rows = [];
    for (let i = 0; i < startingValue.length; i++) {
        rows.push((
            <>
                <SelectList options={classes.map(x => x.name)} baseStateObject={baseStateObject} pathToProperty={"classes[" + i + "].name"} inputHandler={inputHandler}/>
            </>
        ));
    }
    return <div>{rows}</div>
}