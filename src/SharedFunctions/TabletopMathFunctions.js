import { getCollection } from "../Collections";
import { getValueFromObjectAndPath } from "./ComponentFunctions";
import { convertArrayToDictionary, convertHashMapToArrayOfStrings } from "./Utils";

export function calculateProficiencyBonus(playerConfigs) {
    return 2 + Math.floor((playerConfigs.level - 1) / 4);
}

export function calculateModifierForBaseStat(baseStatValue) {
    return Math.floor((baseStatValue - 10) / 2);
}

export function getAllPlayerDNDClasses(playerConfigs) {
    const classes = getCollection("classes");
    
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
    const hpFromConsitutionPerLevel = calculateModifierForBaseStat(playerConfigs.abilityScores.constitution);
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

export function calculateStatPointsBought(playerConfigs) {
    let totalPoints = 0;
    for (const abilityScoreKey of Object.keys(playerConfigs.abilityScores)) {
        const abilityScoreAmount = playerConfigs.abilityScores[abilityScoreKey];
        const amountThatCostsNormal = abilityScoreAmount - 8;
        let amountThatCostsAnExtraPoint = abilityScoreAmount - 13;
        amountThatCostsAnExtraPoint = amountThatCostsAnExtraPoint < 0 ? 0 : amountThatCostsAnExtraPoint;

        totalPoints += amountThatCostsNormal + amountThatCostsAnExtraPoint;
    }
    return totalPoints;
}

export function calculateBackgroundPointsBought(playerConfigs) {
    let totalPoints = 0;
    for (const abilityScoreKey of Object.keys(playerConfigs.abilityScores)) {
        const abilityScoreAmount = playerConfigs.background.abilityScores[abilityScoreKey];
        if (abilityScoreAmount) {
            totalPoints += abilityScoreAmount;
        }
    }
    return totalPoints;
}

export function calculateBaseStat(playerConfigs, statToCalculate) {
    let baseStatValue = playerConfigs.abilityScores[statToCalculate];

    const backgroundValue = playerConfigs.background.abilityScores[statToCalculate];
    if (backgroundValue) {
        baseStatValue += backgroundValue;
    }

    findAllConfiguredAspects(playerConfigs, statToCalculate, (aspectValue) => {
        baseStatValue += aspectValue;
    });

    return baseStatValue;
}

export function calculateSkillBonus(playerConfigs, dndSkillProficiency, hasProficiency, hasExpertise) {
    let skillBonus = calculateModifierForBaseStat(calculateBaseStat(playerConfigs, dndSkillProficiency.modifier));
    if (hasProficiency) {
        let proficencyBonus = calculateProficiencyBonus(playerConfigs);
        skillBonus += proficencyBonus;
        if (hasExpertise) {
            // Add it again!!!
            skillBonus += proficencyBonus;
        }
    }
    return skillBonus;;
}

export function getAllAspectOptions(aspectName) {
    switch (aspectName) {
        case "CUSTOM":
            // They'll provide their own values.
            return [];
        case "languages":
            return getCollection("languages");
        case "resistances":
            return getCollection("damagetypes");
    }
    return [];
}

export function calculateAspectCollection(playerConfigs, aspectName) {
    // Aspects are things like Language, Resistance, etc that are added from various Races, Class, Feats or Magical Effects.
    let aspectCollection = {};

    findAllConfiguredAspects(playerConfigs, aspectName, (aspectValue) => {
        setAspectCollectionFromArrayOrProperty(aspectCollection, aspectValue);
    });

    return convertHashMapToArrayOfStrings(aspectCollection);
}

function setAspectCollectionFromArrayOrProperty(totalAspectCollection, arrayOrProperty) {
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

function findAllConfiguredAspects(playerConfigs, aspectName, onAspectFound) {
    const backgrounds = getCollection("backgrounds");
    const races = getCollection("races");

    // Check the race for the aspect.
    const dndRace = races.find(x => x.name === playerConfigs.race.name);
    const raceAspectValue = getValueFromObjectAndPath(dndRace, aspectName)
    if (raceAspectValue) {
        onAspectFound(raceAspectValue);
    }

    if (dndRace.choices) {
        findAspectsFromChoice(playerConfigs, dndRace, "race.choices.", aspectName, onAspectFound);
    }
    
    const dndClasses = getAllPlayerDNDClasses(playerConfigs);
    for (const dndClass of dndClasses) {
        // Check each of the classes for the aspect.
        const classAspectValue = dndClass[aspectName];
        if (classAspectValue) {
            onAspectFound(classAspectValue);
        }

        // TODO: Check each of the class choices for the aspect.
    }

    // Check the background for the aspect.
    const dndBackground = backgrounds.find(x => x.name === playerConfigs.background.name);
    const backgroundAspectValue = getValueFromObjectAndPath(dndBackground, aspectName)
    if (backgroundAspectValue) {
        onAspectFound(backgroundAspectValue);
    }
}

function findAspectsFromChoice(playerConfigs, choiceObject, pathToPlayerChoices, aspectName, onAspectFound) {
    // Check the race choices for the aspect.
    for (const choice of choiceObject.choices) {
        const pathToProperty = pathToPlayerChoices + choice.property;
        const playerChoice = getValueFromObjectAndPath(playerConfigs, pathToProperty);

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

            const choiceToAttributeMappingForAspect = choice.choiceToAttributesMapping[aspectName];
            if (choiceToAttributeMappingForAspect) {
                let aspectValue = undefined;
                if (choiceToAttributeMappingForAspect === "$VALUE") {
                    aspectValue = optionObject;
                } else {
                    aspectValue = optionObject[choiceToAttributeMappingForAspect];
                }

                if (aspectValue) {
                    onAspectFound(aspectValue);
                }
            }

            if (optionObject.choices) {
                findAspectsFromChoice(playerConfigs, optionObject, pathToPlayerChoices, aspectName, onAspectFound);
            }
        }
    }
}