export function getValueFromObjectAndPath(baseStateObject, pathToProperty) {
    let propertyValue = baseStateObject;
    if (pathToProperty !== "$VALUE") {
        const totalPath = getTotalPath(pathToProperty);
        for (let i = 0; i < totalPath.length; i++) {
            let pathSegment = totalPath[i];
            propertyValue = propertyValue[pathSegment];
        }
    }
    return propertyValue;
}

export function getTotalPath(pathToProperty) {
    pathToProperty = pathToProperty.endsWith(']') ? pathToProperty.substring(0, pathToProperty.length - 1) : pathToProperty;
    const totalPath = pathToProperty.split(/\]\.|\.|\[/);
    return totalPath;
}

export function onInputChangeHandler(baseStateObject, pathToProperty, newValue, onInputHandler) {
    return onInputHandler(baseStateObject, pathToProperty, newValue)
}

const capitalizedAbilityScoreNames = {
    strength: "Strength",
    dexterity: "Dexterity",
    constitution: "Constitution",
    intelligence: "Intelligence",
    wisdom: "Wisdom",
    charisma: "Charisma"
}

export function getCapitalizedAbilityScoreName(lowercaseName) {
    return capitalizedAbilityScoreNames[lowercaseName];
}

const shortenedAbilityScoreNames = {
    strength: "STR",
    dexterity: "DEX",
    constitution: "CON",
    intelligence: "INT",
    wisdom: "WIS",
    charisma: "CHA"
}

export function getShortenedAbilityScoreName(lowercaseName) {
    return shortenedAbilityScoreNames[lowercaseName];
}