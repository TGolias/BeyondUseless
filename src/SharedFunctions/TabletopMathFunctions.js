import { classes, languages, races, resistances } from "../App";
import { convertArrayToDictionary, convertHashMapToArrayOfStrings } from "./Utils";

export function calculateModifierForBaseStat(baseStatValue) {
    return Math.floor((baseStatValue - 10) / 2);
}

export function getAllPlayerDNDClasses(playerConfigs) {
    const dndClasses = [];
    const dndClassDict = convertArrayToDictionary(classes, "name");

    for (let i = 0; i < playerConfigs.classes.length; i++) {
        const playerClass = playerConfigs.classes[i];
        const dndClass = dndClassDict[playerClass.name];
        dndClasses.push(dndClass);
    }
    return dndClasses;
}

export function calculateHPMax(playerConfigs) {
    const dndClasses = getAllPlayerDNDClasses(playerConfigs);

    // First do the level 1 calculation. We use the first class for this.
    const hpFromConsitutionPerLevel = calculateModifierForBaseStat(playerConfigs.baseStats.constitution);
    let maxHpSoFar = dndClasses[0].hitDie + hpFromConsitutionPerLevel

    // Now calculate for each player class.
    for (let i = 0; i < dndClasses.length; i++) {
        const dndClass = dndClasses[i];
        let levelsToCalculate = playerConfigs.classes[i].levels;
        if (i === 0) {
            // The first class already got it's HP from the first level above, remember? No cheating...
            levelsToCalculate--;
        }

        if (levelsToCalculate > 0) {
            const hpFromClassPerLevelAfter1 = (dndClass.hitDie / 2) + 1;
            maxHpSoFar += levelsToCalculate * (hpFromClassPerLevelAfter1 + hpFromConsitutionPerLevel);
        }
    }
    return maxHpSoFar;
}

export function calculateBaseStat(playerConfigs, statToCalculate) {
    // TODO: Fix the stats turning into strings somehow.
    let baseStatValue = Number.parseInt(playerConfigs.baseStats[statToCalculate]);

    const dndRace = races.find(x => x.name === playerConfigs.race.name);
    if (dndRace.abilityIncrease[statToCalculate]) {
        baseStatValue += dndRace.abilityIncrease[statToCalculate];
    }

    // Check the race choices for the aspect.
    if (dndRace.choices) {
        for (const choice of dndRace.choices) {
            const choiceToAttributeMappingForAspect = choice.choiceToAttributesMapping[statToCalculate];
            if (choiceToAttributeMappingForAspect) {
                // This choice affects the stat... Goddamnit, time to do some work.
                const playerChoice = playerConfigs.race.choices[choice.property];
                if (playerChoice) {
                    let sourceOptions = [];
                    if (choice.optionsSource === "CUSTOM") {
                        sourceOptions = choice.options;
                    } else {
                        sourceOptions = getAllAspectOptions(choice.optionsSource);
                    }

                    let optionObject = undefined;
                    if (choice.optionDisplayProperty === "$VALUE") {
                        optionObject = sourceOptions.find(x => x === playerChoice);
                    } else {
                        optionObject = sourceOptions.find(x => x[choice.optionDisplayProperty] === playerChoice);
                    }

                    let aspectValue = undefined;
                    if (choiceToAttributeMappingForAspect === "$VALUE") {
                        aspectValue = optionObject;
                    } else {
                        aspectValue = optionObject[choiceToAttributeMappingForAspect];
                    }
                    
                    if (aspectValue) {
                        baseStatValue += Number.parseInt(aspectValue);
                    }
                }
            }
        }
    }

    return baseStatValue;
}

export function getAllAspectOptions(aspectName) {
    switch (aspectName) {
        case "CUSTOM":
            // They'll provide their own values.
            return [];
        case "languages":
            return languages;
        case "resistances":
            return resistances;
    }
    return [];
}

export function calculateAspectCollection(playerConfigs, aspectName) {
    // Aspects are things like Language, Resistance, etc that are added from various Races, Class, Feats or Magical Effects.
    let aspectCollection = {};

    // Check the race for the aspect.
    const dndRace = races.find(x => x.name === playerConfigs.race.name);
    setAspectCollectionFromArrayOrProperty(aspectCollection, dndRace[aspectName]);

    if (dndRace.choices) {
        // Check the race choices for the aspect.
        for (const choice of dndRace.choices) {
            const choiceToAttributeMappingForAspect = choice.choiceToAttributesMapping[aspectName];
            if (choiceToAttributeMappingForAspect) {
                // This choice affects the aspect... Goddamnit, time to do some work.
                const playerChoice = playerConfigs.race.choices[choice.property];
                if (playerChoice) {
                    let sourceOptions = [];
                    if (choice.optionsSource === "CUSTOM") {
                        sourceOptions = choice.options;
                    } else {
                        sourceOptions = getAllAspectOptions(choice.optionsSource);
                    }

                    let optionObject = undefined;
                    if (choice.optionDisplayProperty === "$VALUE") {
                        optionObject = sourceOptions.find(x => x === playerChoice);
                    } else {
                        optionObject = sourceOptions.find(x => x[choice.optionDisplayProperty] === playerChoice);
                    }

                    let aspectValue = undefined;
                    if (choiceToAttributeMappingForAspect === "$VALUE") {
                        aspectValue = optionObject;
                    } else {
                        aspectValue = optionObject[choiceToAttributeMappingForAspect];
                    }

                    setAspectCollectionFromArrayOrProperty(aspectCollection, aspectValue);
                }
            }
        }
    }
    
    const dndClasses = getAllPlayerDNDClasses(playerConfigs);
    for (const dndClass of dndClasses) {
        // Check each of the classes for the aspect.
        setAspectCollectionFromArrayOrProperty(aspectCollection, dndClass[aspectName]);

        // TODO: Check each of the class choices for the aspect.
    }

    return convertHashMapToArrayOfStrings(aspectCollection);
}

export function setAspectCollectionFromArrayOrProperty(totalAspectCollection, arrayOrProperty) {
    if (arrayOrProperty) {
        if (Array.isArray(arrayOrProperty)) {
            // It is an array.
            for (const aspect of arrayOrProperty) {
                totalAspectCollection[aspect] = true;
            }
        } else {
            // It is a property
            totalAspectCollection[arrayOrProperty] = true;
        }
    }
}