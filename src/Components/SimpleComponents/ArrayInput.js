import React from "react";
import "./ArrayInput.css"
import { RetroButton } from "./RetroButton";
import { getValueFromObjectAndPath } from "../../SharedFunctions/ComponentFunctions";
import { SelectList } from "./SelectList";
import { CheckboxInput } from "./CheckboxInput";

export function ArrayInput({baseStateObject, pathToProperty, config, inputHandler, allowAdd, addText = undefined, generateAddedItem = undefined, allowRemove}) {
    const startingValue = getValueFromObjectAndPath(baseStateObject, pathToProperty);

    const rows = [];
    const headers = [];
    // First Calculate the headers.
    for (const configEntry of config) {
        headers.push(<><div className="headerLabel">{configEntry.displayName}</div></>)
    }
    if (allowRemove) {
        headers.push(<><div></div></>)
    }
    rows.push(<>{headers}</>)

    // Now create the rows.
    for (let i = 0; i < startingValue.length; i++) {
        const columns = [];
        for (let j = 0; j < config.length; j++) {
            const configEntry = config[j];
            const singleItemPathToProperty = pathToProperty + "[" + i + (configEntry.pathToProperty === "$VALUE" ? "]" : "]." + configEntry.pathToProperty);
            switch (configEntry.componentType) {
                case "SelectList":
                    columns.push((
                        <>
                            <SelectList isNumberValue={configEntry.isNumber} options={configEntry.options(baseStateObject, i)} baseStateObject={baseStateObject} pathToProperty={singleItemPathToProperty} inputHandler={inputHandler}/>
                        </>
                    ));
                    break;
                case "Checkbox":
                    columns.push((
                        <>
                            <CheckboxInput baseStateObject={baseStateObject} pathToProperty={singleItemPathToProperty} inputHandler={inputHandler}/>
                        </>
                    ));
                    break;
            }
        }
        if (allowRemove) {
            columns.push((
                <>
                    <div className="removeButtonWrapper">
                        <RetroButton text="X" onClickHandler={() => {
                            const newValue = [...startingValue];
                            newValue.splice(i, 1);
                            inputHandler(baseStateObject, pathToProperty, newValue);
                        }} showTriangle={false} disabled={false}></RetroButton>
                    </div>
                </>
            ));
        }
        rows.push((
            <>
                {columns}
            </>
        ))
    }

    const htmlToReturn = [];

    // Calculate Grid template columns value.
    let gridTemplateColumnsValue = "";
    for (let i = 0; i < config.length; i++) {
        const configEntry = config[i];
        let widthValue = configEntry.columnWidth ? configEntry.columnWidth : "auto";

        if (i === 0) {
            gridTemplateColumnsValue += widthValue;
        } else {
            gridTemplateColumnsValue += (" " + widthValue);
        }
    }
    if (allowRemove) {
        gridTemplateColumnsValue += " 1.3em";
    }

    htmlToReturn.push(<>
        <div className="arrayGrid" style={{gridTemplateColumns: gridTemplateColumnsValue}}>{rows}</div>
    </>);

    if (allowAdd) {
        htmlToReturn.push(<>
            <div className="addButtonWrapper">
                <RetroButton text={addText} onClickHandler={() => {
                    const newValue = [...startingValue];
                    newValue.push(generateAddedItem());
                    inputHandler(baseStateObject, pathToProperty, newValue);
                }} showTriangle={true} disabled={false}></RetroButton>
            </div>
        </>);
    }
    
    return (<>
        <div>{htmlToReturn}</div>
    </>)
}