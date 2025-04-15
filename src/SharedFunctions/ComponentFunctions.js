import React from "react";

export function getValueFromObjectAndPath(baseStateObject, pathToProperty) {
    let propertyValue = baseStateObject;
    if (pathToProperty !== "$VALUE") {
        const totalPath = getTotalPath(pathToProperty);
        for (let i = 0; i < totalPath.length; i++) {
            let pathSegment = totalPath[i];
            if (propertyValue) {
                propertyValue = propertyValue[pathSegment];
            } else {
                return undefined;
            }
        }
    }
    return propertyValue;
}

export function getTotalPath(pathToProperty) {
    if (pathToProperty === "$VALUE") {
        return [];
    }

    pathToProperty = pathToProperty.endsWith(']') ? pathToProperty.substring(0, pathToProperty.length - 1) : pathToProperty;
    const totalPath = pathToProperty.split(/\]\.|\.|\[/);
    return totalPath;
}

export function onInputChangeHandler(baseStateObject, pathToProperty, newValue, onInputHandler) {
    return onInputHandler(baseStateObject, pathToProperty, newValue)
}

const castTimeShortHand = {
    "Action": "A",
    "Bonus Action": "BA",
    "Reaction": "R",
    "Free": "F"
}

export function getCastingTimeShorthand(castingTime) {
    return castTimeShortHand[castingTime];
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

export function parseStringForBoldMarkup(stringToParse) {
    if (!stringToParse || stringToParse.length === 0) {
        return [];
    }

    let stringWithMarkup = []
    const stringsWithoutMarkup = stringToParse.split(/<b>|<\/b>/);
    for (let i = 0; i < stringsWithoutMarkup.length; i++) {
        const phrase = stringsWithoutMarkup[i];
        if (i % 2 == 1) {
            // Bold it!
            stringWithMarkup.push(<><b>{phrase}</b></>);
        } else {
            // Don't bold it.
            stringWithMarkup.push(<>{phrase}</>);
        }
    }
    return stringWithMarkup;
}

const sizes = ["Tiny", "Small", "Medium", "Large", "Huge", "Gargantuan"];

export function convertSizeToNumber(size) {
    if (size) {
        const index = sizes.indexOf(size);
        if (index > -1) {
            return index;
        }
    }
    return 2; // Medium is a good default.
}

export function convertNumberToSize(number) {
    if (number < 0) {
        return "Tiny"; // The only thing smaller than Tiny is... Tiny. Yes.
    }
    if (number >= sizes.length) {
        return "Gargantuan"; // The only thing larger than Gargantuan is... Gargantuan. Yes.
    }
    return sizes[number];
}