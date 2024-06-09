export function getValueFromBaseStateAndPath(baseStateObject, pathToProperty) {
    const totalPath = pathToProperty.split('.');
    let propertyValue = baseStateObject;
    for (let i = 0; i < totalPath.length; i++) {
        propertyValue = propertyValue[totalPath[i]];
    }
    return propertyValue;
}

export function onInputChangeHandler(baseStateObject, pathToProperty, newValue, onInputHandler) {
    return onInputHandler(baseStateObject, pathToProperty, newValue)
}