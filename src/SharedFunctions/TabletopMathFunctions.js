import { getCollection } from "../Collections";
import { getValueFromObjectAndPath } from "./ComponentFunctions";
import { convertArrayOfStringsToHashMap, convertArrayToDictionary, convertHashMapToArrayOfStrings } from "./Utils";

export function calculateProficiencyBonus(playerConfigs) {
    return 2 + Math.floor((playerConfigs.level - 1) / 4);
}

export function calculateArmorClass(playerConfigs) {
    // Start with unarmored dc. 10 + dex modifier.
    let armorClass = 10 + calculateAspectCollection(playerConfigs, "dexterityModifier");

    // Check if there are any other ways to calculate armor class.
    findAllConfiguredAspects(playerConfigs, "armorClass", (aspectValue) => {
        let newArmorClass;
        if (aspectValue.calcuation) {
            newArmorClass = performAspectCalculation(playerConfigs, aspectValue.calcuation);
        }
        else {
            newArmorClass = aspectValue;
        }

        if (newArmorClass > armorClass) {
            armorClass = newArmorClass;
        }
    });

    // Now that we are using the highest AC calculation, check for any other AC bonuses and add them to the score.
    findAllConfiguredAspects(playerConfigs, "armorClassBonus", (aspectValue) => {
        let armorClassBonus;
        if (aspectValue.calcuation) {
            armorClassBonus = performAspectCalculation(playerConfigs, aspectValue.calcuation);
        }
        else {
            armorClassBonus = aspectValue;
        }

        armorClass += armorClassBonus;
    });

    return armorClass;
}

export function calculateInitiativeBonus(playerConfigs) {
    // Start with our dex modifier.
    let totalInitiativeBonus = calculateAspectCollection(playerConfigs, "dexterityModifier");

    // Now that we are using the highest AC calculation, check for any other AC bonuses and add them to the score.
    findAllConfiguredAspects(playerConfigs, "initiativeBonus", (aspectValue) => {
        let initiativeBonus;
        if (aspectValue.calcuation) {
            initiativeBonus = performAspectCalculation(playerConfigs, aspectValue.calcuation);
        }
        else {
            initiativeBonus = aspectValue;
        }

        totalInitiativeBonus += initiativeBonus;
    });

    return totalInitiativeBonus;
}

export function calculateSize(playerConfigs) {
    // Default to Medium because it seems to be the 'default' among most races where size is selectable.
    let size = "Medium";

    // Now that we are using the highest AC calculation, check for any other AC bonuses and add them to the score.
    findAllConfiguredAspects(playerConfigs, "size", (aspectValue) => {
        size = aspectValue;
    });

    return size;
}

export function calculateSpeed(playerConfigs) {
    // Start with 0, lol. All races have a base speed set, and if we end up seeing 0 in the UI, we'll know something is wrong for sure.
    let speed = 0;

    // There might be multiple speeds between the species / subspecies, override with whatever we see is the highest.
    findAllConfiguredAspects(playerConfigs, "speed", (aspectValue) => {
        let newSpeed;
        if (aspectValue.calcuation) {
            newSpeed = performAspectCalculation(playerConfigs, aspectValue.calcuation);
        }
        else {
            newSpeed = aspectValue;
        }

        if (newSpeed > speed) {
            speed = newSpeed;
        }
    });

    // Now that we are using the highest AC calculation, check for any other AC bonuses and add them to the score.
    findAllConfiguredAspects(playerConfigs, "speedBonus", (aspectValue) => {
        let speedBonus;
        if (aspectValue.calcuation) {
            speedBonus = performAspectCalculation(playerConfigs, aspectValue.calcuation);
        }
        else {
            speedBonus = aspectValue;
        }

        speed += speedBonus;
    });

    return speed;
}

export function calculatePassivePerception(playerConfigs) {
    const perceptionSkillProf = {
        name: "Perception",
        modifier: "wisdom"
    };
    const playerSkillProficiencies = calculateAspectCollection(playerConfigs, "skillProficiencies");
    const playerSkillProficienciesMap = convertArrayOfStringsToHashMap(playerSkillProficiencies);
    const playerExpertise = calculateAspectCollection(playerConfigs, "expertise");
    const playerExpertiseMap = convertArrayOfStringsToHashMap(playerExpertise);

    // They seemingly simplified this... it's just 10 plus your perception skill modifer.
    let passivePerception = 10 + calculateSkillBonus(playerConfigs, perceptionSkillProf, playerSkillProficienciesMap[perceptionSkillProf.name], playerExpertiseMap[perceptionSkillProf.name]);
    return passivePerception;
}

export function performAspectCalculation(playerConfigs, calculation) {
    let value = undefined;
    for(let i = 0; i < calculation.length; i++) {4
        let calculationValue = undefined;
        const singleCalculation = calculation[i];
        switch (singleCalculation.type) {
            case "static":
                calculationValue = singleCalculation.value;
                break;
            case "aspect":
                calculationValue = calculateAspectCollection(playerConfigs, singleCalculation.value);
        }

        if (i === 0) {
            value = calculationValue;
        }
        else {
            value += calculationValue;
        }
    }
    return value;
}

export function calculateModifierForBaseStat(baseStatValue) {
    return Math.floor((baseStatValue - 10) / 2);
}

export function calculateTierForPlayerLevel(playerConfigs) {
    if (playerConfigs.level < 5) {
        return 1;
    } else if (playerConfigs.level < 11) {
        return 2;
    } else if (playerConfigs.level < 17) {
        return 3;
    }
    return 4;
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

    let extraHPPerLVL = 0;
    findAllConfiguredAspects(playerConfigs, "hpPerLVL", (hpPerLVL) => {
        extraHPPerLVL += hpPerLVL;
    });

    // First do the level 1 calculation. We use the first class for this.
    const hpFromConsitutionPerLevel = calculateAspectCollection(playerConfigs, "constitutionModifier");
    let maxHpSoFar = dndClasses[0].hitDie + hpFromConsitutionPerLevel + extraHPPerLVL;

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
            maxHpSoFar += levelsToCalculate * (hpFromClassPerLevelAfter1 + hpFromConsitutionPerLevel + extraHPPerLVL);
        }
    }

    // Check for any current statuses
    if (playerConfigs.currentStatus.maxHpModifier) {
        maxHpSoFar += playerConfigs.currentStatus.maxHpModifier;
    }

    return maxHpSoFar;
}

export function calculateHitDiceMap(playerConfigs) {
    const hitDiceMap = {};

    const dndClasses = getAllPlayerDNDClasses(playerConfigs);

    // Now calculate for each player class.
    for (let i = 0; i < dndClasses.length; i++) {
        const dndClass = dndClasses[i];
        const hitDieType = dndClass.hitDie;
        const levelsInTheClass = playerConfigs.classes[i].levels;
        if (hitDiceMap[hitDieType]) {
            hitDiceMap[hitDieType] += levelsInTheClass;
        } else {
            hitDiceMap[hitDieType] = levelsInTheClass;
        }
    }

    return hitDiceMap;
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

    // See if there are any overrides that are higher without it.
    const overrideStatAspectName = statToCalculate + "Override";
    findAllConfiguredAspects(playerConfigs, overrideStatAspectName, (aspectValue) => {
        if (baseStatValue < aspectValue) {
            // If the override is higher than the stat without the override, set that to the new value.
            baseStatValue = aspectValue;
        }
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
    return skillBonus;
}

export function calculateSavingThrowBonus(playerConfigs, modifier, hasProficiency) {
    let savingThrowBonus = calculateModifierForBaseStat(calculateBaseStat(playerConfigs, modifier));
    if (hasProficiency) {
        let proficencyBonus = calculateProficiencyBonus(playerConfigs);
        savingThrowBonus += proficencyBonus;
    }
    return savingThrowBonus;
}

export function getAllAspectOptions(aspectName) {
    switch (aspectName) {
        case "CUSTOM":
            // They'll provide their own values.
            return [];
        case "resistances":
            return getCollection("damagetypes");
    }
    return getCollection(aspectName);
}

export function calculateAspectCollection(playerConfigs, aspectName) {
    if (aspectName === "CUSTOM") {
        // Nothing will come back for this anyways, no need to search.
        return [];
    }

    // Handle our special cases first.
    switch (aspectName) {
        case "strength":
        case "dexterity":
        case "constitution":
        case "intelligence":
        case "wisdom":
        case "charisma":
            return calculateBaseStat(playerConfigs, aspectName);
        case "strengthModifier":
        case "dexterityModifier":
        case "constitutionModifier":
        case "intelligenceModifier":
        case "wisdomModifier":
        case "charismaModifier":
            return calculateModifierForBaseStat(calculateBaseStat(playerConfigs, aspectName.substring(0, aspectName.length - 8)));
        case "maxHp":
            return calculateHPMax(playerConfigs);
        case "tier":
            return calculateTierForPlayerLevel(playerConfigs);
    }

    const aspectCollection = calculateAspectCollectionCore(playerConfigs, aspectName);
    return aspectCollection;
}

export function calculateAspectCollectionCore(playerConfigs, aspectName) {
    // Aspects are things like Language, Resistance, etc that are added from various Species, Class, Feats or Magical Effects.
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
    const species = getCollection("species");
    const feats = getCollection('feats');

    // Check the base player for the spect.
    const baseAspectValue = getValueFromObjectAndPath(playerConfigs, aspectName)
    if (baseAspectValue) {
        onAspectFound(baseAspectValue);
    }

    // Check the species for the aspect.
    const dndspecies = species.find(x => x.name === playerConfigs.species.name);
    const speciesAspectValue = getValueFromObjectAndPath(dndspecies, aspectName)
    if (speciesAspectValue) {
        onAspectFound(speciesAspectValue);
    }

    if (dndspecies.choices) {
        findAspectsFromChoice(playerConfigs, dndspecies, "species.choices.", aspectName, onAspectFound);
    }
    
    const dndClasses = getAllPlayerDNDClasses(playerConfigs);
    for (let i = 0; i < dndClasses.length; i++) {
        const dndClass = dndClasses[i];
        // Check each of the classes for the aspect.
        const classAspectValue = dndClass[aspectName];
        if (classAspectValue) {
            onAspectFound(classAspectValue);
        }

        if (dndClass.choices) {
            findAspectsFromChoice(playerConfigs, dndClass, "classes[" + i + "].choices.", aspectName, onAspectFound);
        }

        if (dndClass.features) {
            for (let j = 0; j < dndClass.features.length; j++) {
                const classFeature = dndClass.features[j];
                if (classFeature.feat) {
                    const featurePropertyName = classFeature.name + classFeature.classLevel;
                    const playerClassObject = playerConfigs.classes[i];
                    const selectedFeatName = playerClassObject.features && playerClassObject.features[featurePropertyName] ? playerClassObject.features[featurePropertyName].name : undefined;
                    if (selectedFeatName) {
                        const dndfeat = feats.find(x => x.name === selectedFeatName);
                        if (dndfeat) {
                            if (dndfeat.aspects && dndfeat.aspects[aspectName]) {
                                onAspectFound(dndfeat.aspects[aspectName]);
                            }

                            if (dndfeat.choices) {
                                findAspectsFromChoice(playerConfigs, dndfeat, "classes[" + i + "].features." + featurePropertyName + ".choices.", aspectName, onAspectFound);
                            }
                        }
                    }
                }
            }
        }
    }

    // Check the background for the aspect.
    const dndBackground = backgrounds.find(x => x.name === playerConfigs.background.name);
    const backgroundAspectValue = getValueFromObjectAndPath(dndBackground, aspectName)
    if (backgroundAspectValue) {
        onAspectFound(backgroundAspectValue);
    }

    if (dndBackground.feat) {
        const dndfeat = feats.find(x => x.name === dndBackground.feat);
        if (dndfeat && dndfeat.aspects && dndfeat.aspects[aspectName]) {
            onAspectFound(dndfeat.aspects[aspectName]);
        }

        if (dndfeat.choices) {
            findAspectsFromChoice(playerConfigs, dndfeat, "background.choices.", aspectName, onAspectFound);
        }
    }

    if (playerConfigs.items) {
        // Check equipped items for the aspect.
        const items = getCollection('items');
        // Convert to a dictionary for quick searches because the list could be LONG.
        const itemsDictionary = convertArrayToDictionary(items, "name");
        for (let item of playerConfigs.items) {
            if (item.equipped) {
                const dndItem = itemsDictionary[item.name];
                if (dndItem && dndItem.aspects && dndItem.aspects[aspectName]) {
                    onAspectFound(dndItem.aspects[aspectName]);
                }
            }
        }
    }
    
}

function findAspectsFromChoice(playerConfigs, choiceObject, pathToPlayerChoices, aspectName, onAspectFound) {
    // Check the species choices for the aspect.
    for (const choice of choiceObject.choices) {
        const pathToProperty = pathToPlayerChoices + choice.property;
        const playerChoice = getValueFromObjectAndPath(playerConfigs, pathToProperty);

        if (Array.isArray(playerChoice)) {
            for (let i = 0; i < playerChoice.length; i++) {
                findAspectsFromPlayerChoice(playerConfigs, choice, pathToPlayerChoices, playerChoice[i], aspectName, onAspectFound);
            }
        } else {
            findAspectsFromPlayerChoice(playerConfigs, choice, pathToPlayerChoices, playerChoice, aspectName, onAspectFound);
        }
    }
}

function findAspectsFromPlayerChoice(playerConfigs, choice, pathToPlayerChoices, playerChoice, aspectName, onAspectFound) {
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

        if (optionObject) {
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