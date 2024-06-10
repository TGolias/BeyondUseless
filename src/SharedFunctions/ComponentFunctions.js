export function getValueFromBaseStateAndPath(baseStateObject, pathToProperty) {
    const totalPath = pathToProperty.split(/\]\.|\.|\[/);
    let propertyValue = baseStateObject;
    for (let i = 0; i < totalPath.length; i++) {
        let pathSegment = totalPath[i];
        propertyValue = propertyValue[pathSegment];
    }
    return propertyValue;
}

export function onInputChangeHandler(baseStateObject, pathToProperty, newValue, onInputHandler) {
    return onInputHandler(baseStateObject, pathToProperty, newValue)
}