import { languages } from "../App";

export function getValueFromObjectAndPath(baseStateObject, pathToProperty) {
    let propertyValue = baseStateObject;
    if (pathToProperty !== "$VALUE") {
        const totalPath = pathToProperty.split(/\]\.|\.|\[/);
        for (let i = 0; i < totalPath.length; i++) {
            let pathSegment = totalPath[i];
            propertyValue = propertyValue[pathSegment];
        }
    }
    return propertyValue;
}

export function onInputChangeHandler(baseStateObject, pathToProperty, newValue, onInputHandler) {
    return onInputHandler(baseStateObject, pathToProperty, newValue)
}