import { getCollection, getNameDictionaryForCollection } from "../Collections";
import { TransformDndClassBasedOnMainOrMulticlass } from "./ClassFunctions";
import { convertNumberToSize, convertSizeToNumber, getCapitalizedAbilityScoreName, getValueFromObjectAndPath } from "./ComponentFunctions";
import { GetEquippedItems, GetHeldItems, GetOpenHands } from "./EquipmentFunctions";
import { GetMaxUsesForResource, GetRemainingUsesForResource } from "./ResourcesFunctions";
import { concatStringArrayToAndStringWithCommas, concatStringArrayToOrStringWithCommas, convertArrayOfStringsToHashMap, convertArrayToDictionary, convertHashMapToArrayOfStrings, isNumeric, isObject } from "./Utils";

const rightTriangleUnicode = '\u25B6';

export function calculateProficiencyBonus(playerConfigs) {
    let proficiencyBonusOverride = undefined
    findAllConfiguredAspects(playerConfigs, "proficiencyBonusOverride", [], (aspectPlayerConfigs, aspectValue, typeFoundOn, playerConfigForObject) => {
        if (aspectValue.calculation) {
            proficiencyBonusOverride = performMathCalculation(aspectPlayerConfigs, aspectValue.calculation, { playerConfigForObject });
        } else {
            proficiencyBonusOverride = aspectValue;
        }
    });

    if (proficiencyBonusOverride) {
        // The proficiency bonus is being forced to this value.
        return proficiencyBonusOverride;
    }
    
    return 2 + Math.floor((Math.ceil(playerConfigs.level) - 1) / 4);
}

export function calculateArmorClass(playerConfigs) {
    // Start with unarmored dc. 10 + dex modifier.
    let startingArmorClass = 10 + calculateAspectCollection(playerConfigs, "dexterityModifier");

    // Check if there are any other ways to calculate armor class.
    findAllConfiguredAspects(playerConfigs, "armorClass", [], (aspectPlayerConfigs, aspectValue, typeFoundOn, playerConfigForObject) => {
        let newArmorClass;
        if (aspectValue.calculation) {
            newArmorClass = performMathCalculation(aspectPlayerConfigs, aspectValue.calculation, { playerConfigForObject });
        } else {
            newArmorClass = aspectValue;
        }

        if (newArmorClass > startingArmorClass) {
            startingArmorClass = newArmorClass;
        }
    });

    let armorClass = createDiceObjectWithType({});
    armorClass = addDiceObjectsWithTypeTogether(armorClass, startingArmorClass);

    // Now that we are using the highest AC calculation, check for any other AC bonuses and add them to the score.
    findAllConfiguredAspects(playerConfigs, "armorClassBonus", [], (aspectPlayerConfigs, aspectValue, typeFoundOn, playerConfigForObject) => {
        let armorClassBonus;
        if (aspectValue.calculation) {
            armorClassBonus = performDiceRollCalculation(aspectPlayerConfigs, aspectValue.calculation, { playerConfigForObject });
        } else {
            armorClassBonus = aspectValue;
        }
        armorClass = addDiceObjectsWithTypeTogether(armorClass, armorClassBonus);
    });

    const finalArmorClass = convertDiceRollWithTypeToValue(armorClass);
    if (!finalArmorClass) {
        return 0
    }
    return finalArmorClass;
}

export function calculateInitiativeBonus(playerConfigs) {
    // Start with our dex modifier.
    let totalInitiativeBonus = createDiceObjectWithType({});
    totalInitiativeBonus = addDiceObjectsWithTypeTogether(totalInitiativeBonus, calculateAspectCollection(playerConfigs, "dexterityModifier"));

    // See if we have anything that gives us more to our initiative.
    findAllConfiguredAspects(playerConfigs, "initiativeBonus", [], (aspectPlayerConfigs, aspectValue, typeFoundOn, playerConfigForObject) => {
        let initiativeBonus;
        if (aspectValue.calculation) {
            initiativeBonus = performDiceRollCalculation(aspectPlayerConfigs, aspectValue.calculation, { playerConfigForObject });
        } else {
            initiativeBonus = aspectValue;
        }
        totalInitiativeBonus = addDiceObjectsWithTypeTogether(totalInitiativeBonus, initiativeBonus);
    });

    const finalInitiativeBonus = convertDiceRollWithTypeToValue(totalInitiativeBonus);
    if (!finalInitiativeBonus) {
        return 0
    }
    return finalInitiativeBonus;
}

export function calculateSize(playerConfigs) {
    // Default to Medium because it seems to be the 'default' among most races where size is selectable.
    let size = "Medium";

    findAllConfiguredAspects(playerConfigs, "size", [], (aspectPlayerConfigs, aspectValue, typeFoundOn, playerConfigForObject) => {
        size = aspectValue;
    });

    findAllConfiguredAspects(playerConfigs, "sizeBonus", [], (aspectPlayerConfigs, aspectValue, typeFoundOn, playerConfigForObject) => {
        let sizeBonus;
        if (aspectValue.calculation) {
            sizeBonus = performMathCalculation(aspectPlayerConfigs, aspectValue.calculation, { playerConfigForObject });
        } else {
            sizeBonus = aspectValue;
        }
        const newSizeNumber = convertSizeToNumber(size) + sizeBonus;
        size = convertNumberToSize(newSizeNumber);
    });

    return size;
}

const carryDragLifePushMultiplierForSizes = {
    Tiny: {
        carryMultiplier: 7.5,
        dragLiftPushMultiplier: 15
    },
    Small: {
        carryMultiplier: 15,
        dragLiftPushMultiplier: 30
    },
    Medium: {
        carryMultiplier: 15,
        dragLiftPushMultiplier: 30
    },
    Large: {
        carryMultiplier: 30,
        dragLiftPushMultiplier: 60
    }, 
    Huge: {
        carryMultiplier: 60,
        dragLiftPushMultiplier: 120
    },
    Gargantuan: {
        carryMultiplier: 120,
        dragLiftPushMultiplier: 240
    }
}

export function calculateCarry(playerConfigs) {
    const strengthScore = calculateBaseStat(playerConfigs, "strength");
    let carrySize = calculateSize(playerConfigs);

    findAllConfiguredAspects(playerConfigs, "carryBonus", [], (aspectPlayerConfigs, aspectValue, typeFoundOn, playerConfigForObject) => {
        let carryBonus;
        if (aspectValue.calculation) {
            carryBonus = performMathCalculation(aspectPlayerConfigs, aspectValue.calculation, { playerConfigForObject });
        } else {
            carryBonus = aspectValue;
        }
        const newSizeNumber = convertSizeToNumber(carrySize) + carryBonus;
        carrySize = convertNumberToSize(newSizeNumber);
    });

    const multiplier = carryDragLifePushMultiplierForSizes[carrySize].carryMultiplier;
    const carryAmount = strengthScore * multiplier;
    return carryAmount;
}

export function calculateDragLiftPush(playerConfigs) {
    const strengthScore = calculateBaseStat(playerConfigs, "strength");
    const size = calculateSize(playerConfigs);
    const multiplier = carryDragLifePushMultiplierForSizes[size].dragLiftPushMultiplier;
    const carryAmount = strengthScore * multiplier;
    return carryAmount;
}

export function currentWeightCarried(items) {
    let weightCarried = 0;
    if (items) {
        // Check equipped items for the aspect.
        const itemsDictionary = getNameDictionaryForCollection("items");
        for (let item of items) {
            let quantity = item.amount || 1;
            if (item.custom) {
                weightCarried += (item.weight * quantity);
            } else {
                const dndItem = getItemFromItemTemplate(itemsDictionary[item.name], itemsDictionary);
                if (dndItem && dndItem.weight) {
                    weightCarried += (dndItem.weight * quantity);
                }
            }
        }
    }
    return weightCarried;
}

export function calculateNumberOfHands(playerConfigs) {
    let numberOfHands = 2;

    findAllConfiguredAspects(playerConfigs, "numberOfHandsBonus", [], (aspectPlayerConfigs, aspectValue, typeFoundOn, playerConfigForObject) => {
        if (aspectValue.conditions) {
            const conditionsAreMet = performBooleanCalculation(aspectPlayerConfigs, aspectValue.conditions, { playerConfigForObject });
            if (!conditionsAreMet) {
                // We did not meet the conditions for this bonus to apply.
                return;
            }
        }

        let numberOfHandsBonus;
        if (aspectValue.calculation) {
            numberOfHandsBonus = performMathCalculation(aspectPlayerConfigs, aspectValue.calculation, { playerConfigForObject });
        } else {
            numberOfHandsBonus = aspectValue;
        }
        numberOfHands += numberOfHandsBonus;
    });
    
    return numberOfHands;
}

export function calculateSpeed(playerConfigs) {
    // Start with 0, lol. All races have a base speed set, and if we end up seeing 0 in the UI, we'll know something is wrong for sure.
    let startingSpeed = 0;

    // There might be multiple speeds between the species / subspecies, override with whatever we see is the highest.
    findAllConfiguredAspects(playerConfigs, "speed", [], (aspectPlayerConfigs, aspectValue, typeFoundOn, playerConfigForObject) => {
        let newSpeed;
        if (aspectValue.calculation) {
            newSpeed = performMathCalculation(aspectPlayerConfigs, aspectValue.calculation, { playerConfigForObject });
        } else {
            newSpeed = aspectValue;
        }

        if (newSpeed > startingSpeed) {
            startingSpeed = newSpeed;
        }
    });

    let speed = createDiceObjectWithType({});
    speed = addDiceObjectsWithTypeTogether(speed, startingSpeed);

    findAllConfiguredAspects(playerConfigs, "speedBonus", [], (aspectPlayerConfigs, aspectValue, typeFoundOn, playerConfigForObject) => {
        if (aspectValue.conditions) {
            const conditionsAreMet = performBooleanCalculation(aspectPlayerConfigs, aspectValue.conditions, { playerConfigForObject });
            if (!conditionsAreMet) {
                // We did not meet the conditions for this bonus to apply.
                return;
            }
        }

        let speedBonus;
        if (aspectValue.calculation) {
            speedBonus = performDiceRollCalculation(aspectPlayerConfigs, aspectValue.calculation, { playerConfigForObject });
        } else {
            speedBonus = aspectValue;
        }
        speed = addDiceObjectsWithTypeTogether(speed, speedBonus);
    });

    findAllConfiguredAspects(playerConfigs, "forcedSpeed", [], (aspectPlayerConfigs, aspectValue, typeFoundOn, playerConfigForObject) => {
        let forcedSpeed;
        if (aspectValue.calculation) {
            forcedSpeed = performMathCalculation(aspectPlayerConfigs, aspectValue.calculation, { playerConfigForObject });
        } else {
            forcedSpeed = aspectValue;
        }

        // The speed is being forced to this value.
        speed = addDiceObjectsWithTypeTogether(createDiceObjectWithType({}), forcedSpeed);
    });

    findAllConfiguredAspects(playerConfigs, "speedMultiplier", [], (aspectPlayerConfigs, aspectValue, typeFoundOn, playerConfigForObject) => {
        let speedMultiplier;
        if (aspectValue.calculation) {
            speedMultiplier = performMathCalculation(aspectPlayerConfigs, aspectValue.calculation, { playerConfigForObject });
        } else {
            speedMultiplier = aspectValue;
        }
        speed = multiplyDiceObjectsWithTypeByMultiplier(speed, speedMultiplier);
    });

    findAllConfiguredAspects(playerConfigs, "speedDivider", [], (aspectPlayerConfigs, aspectValue, typeFoundOn, playerConfigForObject) => {
        let speedDivider;
        if (aspectValue.calculation) {
            speedDivider = performMathCalculation(aspectPlayerConfigs, aspectValue.calculation, { playerConfigForObject });
        } else {
            speedDivider = aspectValue;
        }
        speed = multiplyDiceObjectsWithTypeByMultiplier(speed, 1 / speedDivider);
    });

    const finalSpeed = convertDiceRollWithTypeToValue(speed);
    if (!finalSpeed) {
        return 0;
    }
    return finalSpeed;
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
    const playerHalfSkillProficiencies = calculateAspectCollection(playerConfigs, "halfSkillProficiencies");
    const playerHalfSkillProficienciesMap = convertArrayOfStringsToHashMap(playerHalfSkillProficiencies)

    // They seemingly simplified this... it's just 10 plus your perception skill modifer.
    let passivePerception = createDiceObjectWithType({})
    passivePerception = addDiceObjectsWithTypeTogether(passivePerception, 10);
    passivePerception = addDiceObjectsWithTypeTogether(passivePerception, calculateSkillBonusAsDiceObject(playerConfigs, perceptionSkillProf, playerSkillProficienciesMap[perceptionSkillProf.name], playerExpertiseMap[perceptionSkillProf.name], playerHalfSkillProficienciesMap[perceptionSkillProf.name]));
    const finalPassivePerception = convertDiceRollWithTypeToValue(passivePerception);
    if (!finalPassivePerception) {
        return 0;
    }
    return finalPassivePerception;
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
    const dndClassDict = getNameDictionaryForCollection("classes");
    
    const dndClasses = [];

    for (let i = 0; i < playerConfigs.classes.length; i++) {
        const playerClass = playerConfigs.classes[i];
        const dndClass = dndClassDict[playerClass.name];
        dndClasses.push(dndClass);
    }
    return dndClasses;
}

export function getSpellcastingLevel(playerConfigs) {
    let spellcastingLevel = 0;
    const dndClasses = getAllPlayerDNDClasses(playerConfigs);
    for (let i = 0; i < dndClasses.length; i++) {
        const dndClass = dndClasses[i];
        if (dndClass.spellSlotLevelProgression) {
            const classLevels = playerConfigs.classes[i].levels;
            if (dndClass.spellSlotLevelProgression > 2) {
                // Round Down. These are from subclass casting.
                const levelsToAdd = Math.floor(classLevels / dndClass.spellSlotLevelProgression);
                spellcastingLevel += levelsToAdd;
            } else {
                // Round Up. This is a full or half caster.
                const levelsToAdd = Math.ceil(classLevels / dndClass.spellSlotLevelProgression);
                spellcastingLevel += levelsToAdd;
            }
        }
    }
    return spellcastingLevel;
}

export function getPactSlotLevel(playerConfigs) {
    let spellcastingLevel = 0;
    const dndClasses = getAllPlayerDNDClasses(playerConfigs);
    for (let i = 0; i < dndClasses.length; i++) {
        const dndClass = dndClasses[i];
        if (dndClass.pactSlotLevelProgression) {
            const classLevels = playerConfigs.classes[i].levels;
            if (dndClass.pactSlotLevelProgression > 2) {
                // Round Down. These are from subclass casting.
                const levelsToAdd = Math.floor(classLevels / dndClass.pactSlotLevelProgression);
                spellcastingLevel += levelsToAdd;
            } else {
                // Round Up. This is a full or half caster.
                const levelsToAdd = Math.ceil(classLevels / dndClass.pactSlotLevelProgression);
                spellcastingLevel += levelsToAdd;
            }
        }
    }
    return spellcastingLevel;
}

export function calculateHPMax(playerConfigs) {
    const dndClasses = getAllPlayerDNDClasses(playerConfigs);

    let extraHPPerLVL = 0;
    findAllConfiguredAspects(playerConfigs, "hpPerLVL", [], (aspectPlayerConfigs, hpPerLVL, typeFoundOn, foundObject) => {
        extraHPPerLVL += hpPerLVL;
    });

    // First do the level 1 calculation. We use the first class for this.
    const hpFromConsitutionPerLevel = calculateAspectCollection(playerConfigs, "constitutionModifier");
    let maxHpSoFar = (dndClasses.length > 0 ? dndClasses[0].hitDie : 1) + hpFromConsitutionPerLevel + extraHPPerLVL;

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

    findAllConfiguredAspects(playerConfigs, "maxHpBonus", [], (aspectPlayerConfigs, aspectValue, typeFoundOn, playerConfigForObject) => {
        let maxHpBonus;
        if (aspectValue.calculation) {
            maxHpBonus = performMathCalculation(aspectPlayerConfigs, aspectValue.calculation, { playerConfigForObject });
        } else {
            maxHpBonus = aspectValue;
        }

        maxHpSoFar += maxHpBonus;
    });

    findAllConfiguredAspects(playerConfigs, "maxHpOverride", [], (aspectPlayerConfigs, aspectValue, typeFoundOn, playerConfigForObject) => {
        let maxHpOverride;
        if (aspectValue.calculation) {
            maxHpOverride = performMathCalculation(aspectPlayerConfigs, aspectValue.calculation, { playerConfigForObject });
        } else {
            maxHpOverride = aspectValue;
        }

        // The hp is being overridden to this value.
        maxHpSoFar = maxHpOverride;
    });

    return maxHpSoFar;
}

export function calculateHeroicInspirationLongRestRecharge(playerConfigs) {
    let shouldRecharge = false;
    findAllConfiguredAspects(playerConfigs, "heroicInspirationLongRestRecharge", [], (aspectPlayerConfigs, aspectValue, typeFoundOn, playerConfigForObject) => {
        let heroicInspirationLongRestRecharge;
        if (aspectValue.calculation) {
            heroicInspirationLongRestRecharge = performMathCalculation(aspectPlayerConfigs, aspectValue.calculation, { playerConfigForObject });
        } else {
            heroicInspirationLongRestRecharge = aspectValue;
        }

        shouldRecharge = shouldRecharge || heroicInspirationLongRestRecharge;
    });

    return shouldRecharge;
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
    if (playerConfigs.abilityScores) {
        for (const abilityScoreKey of Object.keys(playerConfigs.abilityScores)) {
            if (playerConfigs.background.abilityScores) {
                const abilityScoreAmount = playerConfigs.background.abilityScores[abilityScoreKey];
                if (abilityScoreAmount) {
                    totalPoints += abilityScoreAmount;
                }
            }
        }
    }
    return totalPoints;
}

export function calculateBaseStat(playerConfigs, statToCalculate) {
    let baseStatValue = playerConfigs.abilityScores[statToCalculate];

    if (playerConfigs.background.abilityScores) {
        const backgroundValue = playerConfigs.background.abilityScores[statToCalculate];
        if (backgroundValue) {
            baseStatValue += backgroundValue;
        }
    }

    findAllConfiguredAspects(playerConfigs, statToCalculate, [], (aspectPlayerConfigs, aspectValue, typeFoundOn, playerConfigForObject) => {
        baseStatValue += aspectValue;
    });

    // See if there are any overrides that are higher without it.
    const overrideStatAspectName = statToCalculate + "Override";
    findAllConfiguredAspects(playerConfigs, overrideStatAspectName, [], (aspectPlayerConfigs, aspectValue, typeFoundOn, playerConfigForObject) => {
        if (baseStatValue < aspectValue) {
            // If the override is higher than the stat without the override, set that to the new value.
            baseStatValue = aspectValue;
        }
    });

    return baseStatValue;
}

export function calculateSkillProficiency(playerConfigs, skillProficiencyName) {
    const dndSkillProficiencyMap = getNameDictionaryForCollection("skillProficiencies");
    const dndSkillProficiency = dndSkillProficiencyMap[skillProficiencyName];

    const playerSkillProficiencies = calculateAspectCollection(playerConfigs, "skillProficiencies");
    const hasProficiency = playerSkillProficiencies.some(prof => prof === skillProficiencyName)
    const playerExpertise = calculateAspectCollection(playerConfigs, "expertise");
    const hasExpertise = playerExpertise.some(prof => prof === skillProficiencyName)
    const playerHalfSkillProficiencies = calculateAspectCollection(playerConfigs, "halfSkillProficiencies");
    const hasHalfProficiency = playerHalfSkillProficiencies.some(prof => prof === skillProficiencyName)

    return calculateSkillBonus(playerConfigs, dndSkillProficiency, hasProficiency, hasExpertise, hasHalfProficiency);
}

export function calculateSkillBonus(playerConfigs, dndSkillProficiency, hasProficiency, hasExpertise, hasHalfProficiency) {
    const skillBonus = calculateSkillBonusAsDiceObject(playerConfigs, dndSkillProficiency, hasProficiency, hasExpertise, hasHalfProficiency);
    const finalSkillBonus = convertDiceRollWithTypeToValue(skillBonus);
    if (!finalSkillBonus) {
        return 0;
    }
    return finalSkillBonus;
}

export function calculateSkillBonusAsDiceObject(playerConfigs, dndSkillProficiency, hasProficiency, hasExpertise, hasHalfProficiency) {
    let startingSkillBonus = calculateModifierForBaseStat(calculateBaseStat(playerConfigs, dndSkillProficiency.modifier));
    if (hasProficiency) {
        let proficencyBonus = calculateProficiencyBonus(playerConfigs);
        startingSkillBonus += proficencyBonus;
        if (hasExpertise) {
            // Add it again!!!
            startingSkillBonus += proficencyBonus;
        }
    } else if (hasHalfProficiency) {
        let proficencyBonus = calculateProficiencyBonus(playerConfigs);
        const halfProficencyBonusRoundDown = Math.floor(proficencyBonus / 2);
        startingSkillBonus += halfProficencyBonusRoundDown;
    }

    let skillBonus = createDiceObjectWithType({});
    skillBonus = addDiceObjectsWithTypeTogether(skillBonus, startingSkillBonus);

    findAllConfiguredAspects(playerConfigs, "skillProficiency" + dndSkillProficiency.name + "Bonus", [], (aspectPlayerConfigs, aspectValue, typeFoundOn, playerConfigForObject) => {
        let skillProficiencyBonus;
        if (aspectValue.calculation) {
            skillProficiencyBonus = performDiceRollCalculation(aspectPlayerConfigs, aspectValue.calculation, { playerConfigForObject });
        } else {
            skillProficiencyBonus = aspectValue;
        }
        skillBonus = addDiceObjectsWithTypeTogether(skillBonus, skillProficiencyBonus);
    });

    findAllConfiguredAspects(playerConfigs, "skillProficiencyAllBonus", [], (aspectPlayerConfigs, aspectValue, typeFoundOn, playerConfigForObject) => {
        let skillProficiencyBonus;
        if (aspectValue.calculation) {
            skillProficiencyBonus = performDiceRollCalculation(aspectPlayerConfigs, aspectValue.calculation, { playerConfigForObject });
        } else {
            skillProficiencyBonus = aspectValue;
        }
        skillBonus = addDiceObjectsWithTypeTogether(skillBonus, skillProficiencyBonus);
    });

    return skillBonus;
}

export function calculateSavingThrowBonus(playerConfigs, modifier, hasProficiency) {
    let startingSavingThrow = calculateModifierForBaseStat(calculateBaseStat(playerConfigs, modifier));
    if (hasProficiency) {
        let proficencyBonus = calculateProficiencyBonus(playerConfigs);
        startingSavingThrow += proficencyBonus;
    }

    let savingThrow = createDiceObjectWithType({});
    savingThrow = addDiceObjectsWithTypeTogether(savingThrow, startingSavingThrow);

    findAllConfiguredAspects(playerConfigs, modifier + "SavingThrowBonus", [], (aspectPlayerConfigs, aspectValue, typeFoundOn, playerConfigForObject) => {
        let savingThrowBonus;
        if (aspectValue.calculation) {
            savingThrowBonus = performDiceRollCalculation(aspectPlayerConfigs, aspectValue.calculation, { playerConfigForObject });
        } else {
            savingThrowBonus = aspectValue;
        }
        savingThrow = addDiceObjectsWithTypeTogether(savingThrow, savingThrowBonus);
    });

    findAllConfiguredAspects(playerConfigs, "allSavingThrowBonus", [], (aspectPlayerConfigs, aspectValue, typeFoundOn, playerConfigForObject) => {
        let savingThrowBonus;
        if (aspectValue.calculation) {
            savingThrowBonus = performDiceRollCalculation(aspectPlayerConfigs, aspectValue.calculation, { playerConfigForObject });
        } else {
            savingThrowBonus = aspectValue;
        }
        savingThrow = addDiceObjectsWithTypeTogether(savingThrow, savingThrowBonus);
    });

    let finalSavingThrow = convertDiceRollWithTypeToValue(savingThrow);
    if (!finalSavingThrow) {
        return 0;
    }
    return finalSavingThrow;
}

export function calculateUnarmedAttackBonus(playerConfigs, additionalEffects) {
    let attackBonus = createDiceObjectWithType({});

    let highestValidAbility = undefined;
    let highestValidAbilityModifier = undefined;

    let strengthModifier = calculateAspectCollection(playerConfigs, "strengthModifier");
    highestValidAbility = "strength";
    highestValidAbilityModifier = strengthModifier;

    findAllConfiguredAspects(playerConfigs, "alternateUnarmedAttackModifier", additionalEffects, (aspectPlayerConfigs, aspectValue, typeFoundOn, playerConfigForObject) => {
        if (aspectValue.conditions) {
            const conditionsAreMet = performBooleanCalculation(aspectPlayerConfigs, aspectValue.conditions, { playerConfigForObject, additionalEffects });
            if (!conditionsAreMet) {
                // We did not meet the conditions for this alternate modifier to apply.
                return;
            }
        }

        let modifierName;
        if (aspectValue.calculation) {
            modifierName = performMathCalculation(aspectPlayerConfigs, aspectValue.calculation, { playerConfigForObject, additionalEffects });
        } else {
            modifierName = aspectValue;
        }

        const modifierValue = calculateAspectCollection(playerConfigs, modifierName + "Modifier");
        // Do greater than or equal to here. We have a perference towards these alternate modifiers. Long term, I should probably just show all calculations though.
        if (highestValidAbilityModifier === undefined || modifierValue >= highestValidAbilityModifier) {
            highestValidAbility = modifierName;
            highestValidAbilityModifier = modifierValue;
        }
    });

    attackBonus = addDiceObjectsWithTypeTogether(attackBonus, highestValidAbilityModifier);

    // Always add proficiency bonus for unarmed attacks. Pretty sweet I guess.
    attackBonus = addDiceObjectsWithTypeTogether(attackBonus, calculateProficiencyBonus(playerConfigs));
    
    // See if there are additional bonuses to apply to our attack.
    findAllConfiguredAspects(playerConfigs, "unarmedAttackBonus", additionalEffects, (aspectPlayerConfigs, aspectValue, typeFoundOn, playerConfigForObject) => {
        if (aspectValue.conditions) {
            const conditionsAreMet = performBooleanCalculation(aspectPlayerConfigs, aspectValue.conditions, { attackAbility: highestValidAbility, attackAbilityModifier: highestValidAbilityModifier, playerConfigForObject, additionalEffects });
            if (!conditionsAreMet) {
                // We did not meet the conditions for this bonus to apply.
                return;
            }
        }

        let unarmedAttackBonus;
        if (aspectValue.calculation) {
            unarmedAttackBonus = performDiceRollCalculation(aspectPlayerConfigs, aspectValue.calculation, { attackAbility: highestValidAbility, attackAbilityModifier: highestValidAbilityModifier, playerConfigForObject, additionalEffects });
        } else {
            unarmedAttackBonus = aspectValue;
        }

        attackBonus = addDiceObjectsWithTypeTogether(attackBonus, unarmedAttackBonus);
    });

    findAllConfiguredAspects(playerConfigs, "allAttackBonus", additionalEffects, (aspectPlayerConfigs, aspectValue, typeFoundOn, playerConfigForObject) => {
        if (aspectValue.conditions) {
            const conditionsAreMet = performBooleanCalculation(aspectPlayerConfigs, aspectValue.conditions, { attackAbility: highestValidAbility, attackAbilityModifier: highestValidAbilityModifier, additionalEffects });
            if (!conditionsAreMet) {
                // We did not meet the conditions for this bonus to apply.
                return;
            }
        }

        let allAttackBonus;
        if (aspectValue.calculation) {
            allAttackBonus = performDiceRollCalculation(aspectPlayerConfigs, aspectValue.calculation, { attackAbility: highestValidAbility, attackAbilityModifier: highestValidAbilityModifier, playerConfigForObject, additionalEffects });
        } else {
            allAttackBonus = aspectValue
        }

        attackBonus = addDiceObjectsWithTypeTogether(attackBonus, allAttackBonus);
    });

    let amount = convertDiceRollWithTypeToValue(attackBonus);
    if (!amount) {
        amount = "0";
    }
    let addendum = calculateAddendumAspects(playerConfigs, ["unarmedAttackAddendum", "allAttackAddendum"], additionalEffects, { attackAbility: highestValidAbility, attackAbilityModifier: highestValidAbilityModifier });

    return { amount, addendum };
}

export function calculateUnarmedDamage(playerConfigs) {
    // By default the unarmed attack base is 1.
    let highestUnarmedAverage = 1;
    let highestUnarmedAttack = createDiceObjectWithType({ static: 1 }, "Bludgeoning");

    findAllConfiguredAspects(playerConfigs, "alternateUnarmedDamageCalculation", [], (aspectPlayerConfigs, aspectValue, typeFoundOn, playerConfigForObject) => {
        if (aspectValue.conditions) {
            const conditionsAreMet = performBooleanCalculation(aspectPlayerConfigs, aspectValue.conditions, { playerConfigForObject });
            if (!conditionsAreMet) {
                // We did not meet the conditions for this alternate modifier to apply.
                return;
            }
        }

        // This is a pain, we have to check the dies in the alternate calculations and see what is the highest. Long term, I should probably just show all calculations though.
        if (aspectValue.calculation && aspectValue.calculation.length > 0) {
            let alternateUnarmedAttackDamageCalculation = performDiceRollCalculation(aspectPlayerConfigs, aspectValue.calculation, { playerConfigForObject });
            let alternateUnarmedAttackAverage = computeAverageDiceRoll(alternateUnarmedAttackDamageCalculation);
            if (alternateUnarmedAttackAverage >= highestUnarmedAverage) {
                highestUnarmedAverage = alternateUnarmedAttackAverage;
                highestUnarmedAttack = alternateUnarmedAttackDamageCalculation;
            }
        }
    });

    let attackDamage = highestUnarmedAttack;

    let highestValidAbility = undefined;
    let highestValidAbilityModifier = undefined;

    let strengthModifier = calculateAspectCollection(playerConfigs, "strengthModifier");
    highestValidAbility = "strength";
    highestValidAbilityModifier = strengthModifier;

    findAllConfiguredAspects(playerConfigs, "alternateUnarmedDamageModifier", [], (aspectPlayerConfigs, aspectValue, typeFoundOn, playerConfigForObject) => {
        if (aspectValue.conditions) {
            const conditionsAreMet = performBooleanCalculation(aspectPlayerConfigs, aspectValue.conditions, { playerConfigForObject });
            if (!conditionsAreMet) {
                // We did not meet the conditions for this alternate modifier to apply.
                return;
            }
        }

        let modifierName;
        if (aspectValue.calculation) {
            modifierName = performMathCalculation(aspectPlayerConfigs, aspectValue.calculation);
        } else {
            modifierName = aspectValue;
        }

        const modifierValue = calculateAspectCollection(playerConfigs, modifierName + "Modifier");
        // Do greater than or equal to here. We have a perference towards these alternate modifiers. Long term, I should probably just show all calculations though.
        if (highestValidAbilityModifier === undefined || modifierValue >= highestValidAbilityModifier) {
            highestValidAbility = modifierName;
            highestValidAbilityModifier = modifierValue;
        }
    });

    attackDamage = addDiceObjectsWithTypeTogether(attackDamage, createDiceObjectWithType(highestValidAbilityModifier));
    
    // See if there are additional bonuses to apply to our damage.
    findAllConfiguredAspects(playerConfigs, "unarmedDamageBonus", [], (aspectPlayerConfigs, aspectValue, typeFoundOn, playerConfigForObject) => {
        if (aspectValue.conditions) {
            const conditionsAreMet = performBooleanCalculation(aspectPlayerConfigs, aspectValue.conditions, { attackAbility: highestValidAbility, attackAbilityModifier: highestValidAbilityModifier, playerConfigForObject });
            if (!conditionsAreMet) {
                // We did not meet the conditions for this bonus to apply.
                return;
            }
        }

        let unarmedDamageBonus;
        if (aspectValue.calculation) {
            unarmedDamageBonus = performDiceRollCalculation(aspectPlayerConfigs, aspectValue.calculation, { attackAbility: highestValidAbility, attackAbilityModifier: highestValidAbilityModifier, playerConfigForObject });
        } else {
            unarmedDamageBonus = aspectValue;
        }

        attackDamage = addDiceObjectsWithTypeTogether(attackDamage, unarmedDamageBonus);
    });

    const calculationString = convertDiceRollWithTypeToValue(attackDamage);
    if (!calculationString || calculationString.startsWith("-")) {
        // One should be the lowest damage
        return "1 Bludgeoning";
    }

    return calculationString;
}

export function calculateUnarmedAttackDC(playerConfigs) {
    let unarmedDC = createDiceObjectWithType({});

    // Start with 8.
    unarmedDC = addDiceObjectsWithTypeTogether(unarmedDC, 8);

    let highestValidAbility = undefined;
    let highestValidAbilityModifier = undefined;

    let strengthModifier = calculateAspectCollection(playerConfigs, "strengthModifier");
    highestValidAbility = "strength";
    highestValidAbilityModifier = strengthModifier;

    findAllConfiguredAspects(playerConfigs, "alternateUnarmedAttackModifier", [], (aspectPlayerConfigs, aspectValue, typeFoundOn, playerConfigForObject) => {
        if (aspectValue.conditions) {
            const conditionsAreMet = performBooleanCalculation(aspectPlayerConfigs, aspectValue.conditions, { playerConfigForObject });
            if (!conditionsAreMet) {
                // We did not meet the conditions for this alternate modifier to apply.
                return;
            }
        }

        let modifierName;
        if (aspectValue.calculation) {
            modifierName = performMathCalculation(aspectPlayerConfigs, aspectValue.calculation, { playerConfigForObject });
        } else {
            modifierName = aspectValue;
        }

        const modifierValue = calculateAspectCollection(playerConfigs, modifierName + "Modifier");
        // Do greater than or equal to here. We have a perference towards these alternate modifiers. Long term, I should probably just show all calculations though.
        if (highestValidAbilityModifier === undefined || modifierValue >= highestValidAbilityModifier) {
            highestValidAbility = modifierName;
            highestValidAbilityModifier = modifierValue;
        }
    });

    // Add the ability modifier.
    unarmedDC = addDiceObjectsWithTypeTogether(unarmedDC, highestValidAbilityModifier);

    // Always add proficiency bonus for unarmed attacks. Pretty sweet I guess.
    unarmedDC = addDiceObjectsWithTypeTogether(unarmedDC, calculateProficiencyBonus(playerConfigs));
    
    // See if there are additional bonuses to apply to our DC.
    findAllConfiguredAspects(playerConfigs, "unarmedDCBonus", [], (aspectPlayerConfigs, aspectValue, typeFoundOn, playerConfigForObject) => {
        if (aspectValue.conditions) {
            const conditionsAreMet = performBooleanCalculation(aspectPlayerConfigs, aspectValue.conditions, { attackAbility: highestValidAbility, attackAbilityModifier: highestValidAbilityModifier, playerConfigForObject });
            if (!conditionsAreMet) {
                // We did not meet the conditions for this bonus to apply.
                return;
            }
        }

        let unarmedDCBonus;
        if (aspectValue.calculation) {
            unarmedDCBonus = performDiceRollCalculation(aspectPlayerConfigs, aspectValue.calculation, { attackAbility: highestValidAbility, attackAbilityModifier: highestValidAbilityModifier, playerConfigForObject });
        } else {
            unarmedDCBonus = aspectValue;
        }
        unarmedDC = addDiceObjectsWithTypeTogether(unarmedDC, unarmedDCBonus);
    });

    let dc = convertDiceRollWithTypeToValue(unarmedDC);
    if (!dc) {
        dc = "0";
    }
    const addendum = calculateAddendumAspect(playerConfigs, "unarmedDCAddendum", [], { attackAbility: highestValidAbility, attackAbilityModifier: highestValidAbilityModifier });

    return { dc, addendum };
}

export function calculateWeaponAttackBonus(playerConfigs, weapon, isThrown, additionalEffects = []) {
    let attackBonus = createDiceObjectWithType({});

    let highestValidAbility = undefined;
    let highestValidAbilityModifier = undefined;
    if (weapon.weaponRange === "Ranged" || weapon.properties.includes("Finesse")) {
        highestValidAbility = "dexterity";
        highestValidAbilityModifier = calculateAspectCollection(playerConfigs, "dexterityModifier");
    }
    if (weapon.weaponRange === "Melee") {
        let strengthModifier = calculateAspectCollection(playerConfigs, "strengthModifier");
        if (highestValidAbilityModifier === undefined || strengthModifier > highestValidAbilityModifier) {
            highestValidAbility = "strength";
            highestValidAbilityModifier = strengthModifier;
        }
    }

    findAllConfiguredAspects(playerConfigs, "alternateWeaponAttackModifier", additionalEffects, (aspectPlayerConfigs, aspectValue, typeFoundOn, playerConfigForObject) => {
        if (aspectValue.conditions) {
            const conditionsAreMet = performBooleanCalculation(aspectPlayerConfigs, aspectValue.conditions, { weapon, isThrown, playerConfigForObject, additionalEffects });
            if (!conditionsAreMet) {
                // We did not meet the conditions for this alternate modifier to apply.
                return;
            }
        }

        let modifierName;
        if (aspectValue.calculation) {
            modifierName = performMathCalculation(aspectPlayerConfigs, aspectValue.calculation, { weapon, isThrown, playerConfigForObject, additionalEffects });
        } else {
            modifierName = aspectValue;
        }

        const modifierValue = calculateAspectCollection(playerConfigs, modifierName + "Modifier");
        // Do greater than or equal to here. We have a perference towards these alternate modifiers for the case of True Strike and spells like it. Long term, I should probably just show all calculations though.
        if (highestValidAbilityModifier === undefined || modifierValue >= highestValidAbilityModifier) {
            highestValidAbility = modifierName;
            highestValidAbilityModifier = modifierValue;
        }
    });

    attackBonus = addDiceObjectsWithTypeTogether(attackBonus, highestValidAbilityModifier);

    // Check if we should add the proficency bonus.
    let isProficient = false;
    if (weapon.tags) {
        const weaponProficienyMap = calculateAspectCollection(playerConfigs, "weaponProficiencies");
        isProficient = weapon.tags.some(tag => weaponProficienyMap.includes(tag));
        if (isProficient) {
            attackBonus = addDiceObjectsWithTypeTogether(attackBonus, calculateProficiencyBonus(playerConfigs));
        }
    }
    
    // See if there are additional bonuses to apply to our attack.
    findAllConfiguredAspects(playerConfigs, "weaponAttackBonus", additionalEffects, (aspectPlayerConfigs, aspectValue, typeFoundOn, playerConfigForObject) => {
        if (aspectValue.conditions) {
            const conditionsAreMet = performBooleanCalculation(aspectPlayerConfigs, aspectValue.conditions, { weapon, isThrown, attackAbility: highestValidAbility, attackAbilityModifier: highestValidAbilityModifier, playerConfigForObject, additionalEffects });
            if (!conditionsAreMet) {
                // We did not meet the conditions for this bonus to apply.
                return;
            }
        }

        let weaponAttackBonus;
        if (aspectValue.calculation) {
            weaponAttackBonus = performDiceRollCalculation(aspectPlayerConfigs, aspectValue.calculation, { weapon, isThrown, attackAbility: highestValidAbility, attackAbilityModifier: highestValidAbilityModifier, playerConfigForObject, additionalEffects });
        } else {
            weaponAttackBonus = aspectValue;
        }
        attackBonus = addDiceObjectsWithTypeTogether(attackBonus, weaponAttackBonus);
    });

    findAllConfiguredAspects(playerConfigs, "allAttackBonus", additionalEffects, (aspectPlayerConfigs, aspectValue, typeFoundOn, playerConfigForObject) => {
        if (aspectValue.conditions) {
            const conditionsAreMet = performBooleanCalculation(aspectPlayerConfigs, aspectValue.conditions, { weapon, isThrown, attackAbility: highestValidAbility, attackAbilityModifier: highestValidAbilityModifier, playerConfigForObject, additionalEffects });
            if (!conditionsAreMet) {
                // We did not meet the conditions for this bonus to apply.
                return;
            }
        }

        let allAttackBonus;
        if (aspectValue.calculation) {
            allAttackBonus = performDiceRollCalculation(aspectPlayerConfigs, aspectValue.calculation, { weapon, isThrown, attackAbility: highestValidAbility, attackAbilityModifier: highestValidAbilityModifier, playerConfigForObject, additionalEffects });
        } else {
            allAttackBonus = aspectValue;
        }
        attackBonus = addDiceObjectsWithTypeTogether(attackBonus, allAttackBonus);
    });

    let amount = convertDiceRollWithTypeToValue(attackBonus);
    if (!amount) {
        amount = "0";
    }
    let addendum = calculateAddendumAspects(playerConfigs, ["weaponAttackAddendum", "allAttackAddendum"], additionalEffects, { weapon, isThrown, attackAbility: highestValidAbility, attackAbilityModifier: highestValidAbilityModifier });

    if (weapon.properties) {
        const propertiesMap = getNameDictionaryForCollection("properties");
        for (let property of weapon.properties) {
            const stringSplit = property.split(" ");
            const firstString = stringSplit[0];

            const dndProperty = propertiesMap[firstString]
            if (dndProperty && dndProperty.weaponAttackAddendum) {
                const propertyString = performMathCalculation(playerConfigs, dndProperty.weaponAttackAddendum.calculation, { weapon, isThrown, attackAbility: highestValidAbility, attackAbilityModifier: highestValidAbilityModifier, propertyStrings: stringSplit, additionalEffects });
                if (propertyString) {
                    if (addendum.length > 0) {
                        // Newline between different addendums.
                        addendum += "\n\n";
                    }
                    addendum += propertyString;
                }
            }
        }
    }

    if (isProficient && weapon.mastery) {
        // Check if we have mastery in this weapon.
        const weaponMasteries = calculateAspectCollection(playerConfigs, "weaponmasteries");
        const hasWeaponMastery = weapon.tags.some(tag => weaponMasteries.includes(tag));
        if (hasWeaponMastery) {
            const masteryMap = getNameDictionaryForCollection("masteries");
            const dndMastery = masteryMap[weapon.mastery];

            if (dndMastery && dndMastery.weaponAttackAddendum) {
                const masteryString = performMathCalculation(playerConfigs, dndMastery.weaponAttackAddendum.calculation, { weapon, isThrown, attackAbility: highestValidAbility, attackAbilityModifier: highestValidAbilityModifier });
                if (masteryString) {
                    if (addendum.length > 0) {
                        // Newline between different addendums.
                        addendum += "\n\n";
                    }
                    addendum += masteryString;
                }
            }
        }
    }

    if (weapon.weaponRange === "Ranged") {
        const miscMap = getNameDictionaryForCollection("misc");
        const rangedMisc = miscMap["Ranged"];

        const rangedString = performMathCalculation(playerConfigs, rangedMisc.weaponAttackAddendum.calculation, { weapon, isThrown, attackAbility: highestValidAbility, attackAbilityModifier: highestValidAbilityModifier });
        if (rangedString) {
            if (addendum.length > 0) {
                // Newline between different addendums.
                addendum += "\n\n";
            }
            addendum += rangedString;
        }
    }

    return { amount, addendum };
}

export function calculateWeaponDamage(playerConfigs, weapon, isThrown, isExtraLightAttack, isExtraCleaveAttack, additionalEffects = []) {
    let damage = undefined;
    if (weapon.properties && weapon.properties.includes("Versatile")) {
        // Check if they can actually two-hand the weapon. They need an open hand to be able to use for it.
        const openHands = GetOpenHands(playerConfigs, playerConfigs.items);
        if (openHands > 0) {
            damage = performDiceRollCalculation(playerConfigs, weapon.twoHandedDamage.calculation);
        }
    }

    if (!damage) {
        // There are no overrides for weapon damage. Start with the normal weapon damage.
        damage = performDiceRollCalculation(playerConfigs, weapon.damage.calculation);
    }

    let highestValidAbility = undefined;
    let highestValidAbilityModifier = undefined;
    if (weapon.weaponRange === "Ranged" || weapon.properties.includes("Finesse")) {
        highestValidAbility = "dexterity";
        highestValidAbilityModifier = calculateAspectCollection(playerConfigs, "dexterityModifier");
    }
    if (weapon.weaponRange === "Melee") {
        let strengthModifier = calculateAspectCollection(playerConfigs, "strengthModifier");
        if (highestValidAbilityModifier === undefined || strengthModifier > highestValidAbilityModifier) {
            highestValidAbility = "strength";
            highestValidAbilityModifier = strengthModifier;
        }
    }

    findAllConfiguredAspects(playerConfigs, "alternateWeaponDamageModifier", additionalEffects, (aspectPlayerConfigs, aspectValue, typeFoundOn, playerConfigForObject) => {
        if (aspectValue.conditions) {
            const conditionsAreMet = performBooleanCalculation(aspectPlayerConfigs, aspectValue.conditions, { weapon, isThrown, playerConfigForObject, additionalEffects });
            if (!conditionsAreMet) {
                // We did not meet the conditions for this alternate modifier to apply.
                return;
            }
        }

        let modifierName;
        if (aspectValue.calculation) {
            modifierName = performMathCalculation(aspectPlayerConfigs, aspectValue.calculation, { weapon, isThrown, playerConfigForObject, additionalEffects });
        } else {
            modifierName = aspectValue;
        }

        const modifierValue = calculateAspectCollection(playerConfigs, modifierName + "Modifier");
        // Do greater than or equal to here. We have a perference towards these alternate modifiers for the case of True Strike and spells like it. Long term, I should probably just show all calculations though.
        if (highestValidAbilityModifier === undefined || modifierValue >= highestValidAbilityModifier) {
            highestValidAbility = modifierName;
            highestValidAbilityModifier = modifierValue;
        }
    });

    if ((!isExtraLightAttack && !isExtraCleaveAttack) || highestValidAbilityModifier < 0) {
        damage = addDiceObjectsWithTypeTogether(damage, highestValidAbilityModifier);
    }

    // See if there are additional bonuses to apply to our damage.
    findAllConfiguredAspects(playerConfigs, "weaponDamageBonus", additionalEffects, (aspectPlayerConfigs, aspectValue, typeFoundOn, playerConfigForObject) => {
        if (aspectValue.conditions) {
            const conditionsAreMet = performBooleanCalculation(aspectPlayerConfigs, aspectValue.conditions, { weapon, isThrown, isExtraLightAttack, isExtraCleaveAttack, attackAbility: highestValidAbility, attackAbilityModifier: highestValidAbilityModifier, playerConfigForObject, additionalEffects });
            if (!conditionsAreMet) {
                // We did not meet the conditions for this bonus to apply.
                return;
            }
        }

        let weaponDamageBonus;
        if (aspectValue.calculation) {
            weaponDamageBonus = performDiceRollCalculation(aspectPlayerConfigs, aspectValue.calculation, { weapon, isThrown, isExtraLightAttack, isExtraCleaveAttack, attackAbility: highestValidAbility, attackAbilityModifier: highestValidAbilityModifier, playerConfigForObject, additionalEffects });
        } else {
            weaponDamageBonus = aspectValue;
        }

        damage = addDiceObjectsWithTypeTogether(damage, weaponDamageBonus);
    });
    
    // See if there are additional bonuses to apply to our damage.
    let additionalWeaponDamage = undefined;
    findAllConfiguredAspects(playerConfigs, "weaponDamageAdditional", additionalEffects, (aspectPlayerConfigs, aspectValue, typeFoundOn, playerConfigForObject) => {
        if (aspectValue.conditions) {
            const conditionsAreMet = performBooleanCalculation(aspectPlayerConfigs, aspectValue.conditions, { weapon, isThrown, isExtraLightAttack, isExtraCleaveAttack, attackAbility: highestValidAbility, attackAbilityModifier: highestValidAbilityModifier, playerConfigForObject, additionalEffects });
            if (!conditionsAreMet) {
                // We did not meet the conditions for this bonus to apply.
                return;
            }
        }

        let weaponDamageAdditional;
        if (aspectValue.calculation) {
            weaponDamageAdditional = performDiceRollCalculation(aspectPlayerConfigs, aspectValue.calculation, { weapon, isThrown, isExtraLightAttack, isExtraCleaveAttack, attackAbility: highestValidAbility, attackAbilityModifier: highestValidAbilityModifier, playerConfigForObject, additionalEffects });
        } else {
            weaponDamageAdditional = aspectValue;
        }

        if (additionalWeaponDamage) {
            additionalWeaponDamage = addDiceObjectsWithTypeTogether(additionalWeaponDamage, weaponDamageAdditional);
        } else {
            additionalWeaponDamage = weaponDamageAdditional;
        }  
    });

    if (additionalWeaponDamage) {
        damage = addDiceObjectsWithTypeTogether(damage, additionalWeaponDamage);
    }

    const finalDamage = convertDiceRollWithTypeToValue(damage);
    if (!finalDamage) {
        return 0;
    }
    return finalDamage;
}

export function calculateSpellAttack(playerConfigs, additionalEffects, spell, isSpell, slotLevel) {
    let attackBonus = createDiceObjectWithType({});

    let playerConfigsToUse = playerConfigs;
    let spellToUse = spell;
    if (spell.feature.spellcasting.fromParentFeature) {
        const parentFeatureName = performMathCalculation(playerConfigs, spell.feature.spellcasting.fromParentFeature.calculation);
        const parentPlayerConfigs = playerConfigs.parent;
        const allParentSpellcastingFeatures = getAllSpellcastingFeatures(parentPlayerConfigs);
        const parentSpellcastingFeature = allParentSpellcastingFeatures.find(feature => parentFeatureName.includes(feature.feature.name));

        playerConfigsToUse = playerConfigs.parent;
        spellToUse = { ...spell, feature: parentSpellcastingFeature.feature };
    }

    const spellcastingAbility = performMathCalculation(playerConfigsToUse, spellToUse.feature.spellcasting.ability.calculation);
    const spellcastingAbilityModifier = calculateAspectCollection(playerConfigsToUse, spellcastingAbility + "Modifier");

    // Always add spellcasting ability modifier.
    attackBonus = addDiceObjectsWithTypeTogether(attackBonus, spellcastingAbilityModifier);

    // Always add proficieny bonus for spellcasting.
    attackBonus = addDiceObjectsWithTypeTogether(attackBonus, calculateProficiencyBonus(playerConfigsToUse));
    
    // See if there are additional bonuses to apply to our attack.
    findAllConfiguredAspects(playerConfigsToUse, "spellAttackBonus", additionalEffects, (aspectPlayerConfigs, aspectValue, typeFoundOn, playerConfigForObject) => {
        if (aspectValue.conditions) {
            const conditionsAreMet = performBooleanCalculation(aspectPlayerConfigs, aspectValue.conditions, { spell: spellToUse, isSpell, spellcastingAbility, spellcastingAbilityModifier, slotLevel, playerConfigForObject, additionalEffects });
            if (!conditionsAreMet) {
                // We did not meet the conditions for this bonus to apply.
                return;
            }
        }

        let spellAttackBonus;
        if (aspectValue.calculation) {
            spellAttackBonus = performDiceRollCalculation(aspectPlayerConfigs, aspectValue.calculation, { spell: spellToUse, isSpell, spellcastingAbility, spellcastingAbilityModifier, slotLevel, playerConfigForObject, additionalEffects });
        } else {
            spellAttackBonus = aspectValue;
        }
        attackBonus = addDiceObjectsWithTypeTogether(attackBonus, spellAttackBonus);
    });

    findAllConfiguredAspects(playerConfigsToUse, "allAttackBonus", additionalEffects, (aspectPlayerConfigs, aspectValue, typeFoundOn, playerConfigForObject) => {
        if (aspectValue.conditions) {
            const conditionsAreMet = performBooleanCalculation(aspectPlayerConfigs, aspectValue.conditions, { spell: spellToUse, isSpell, spellcastingAbility, spellcastingAbilityModifier, slotLevel, playerConfigForObject, additionalEffects });
            if (!conditionsAreMet) {
                // We did not meet the conditions for this bonus to apply.
                return;
            }
        }

        let allAttackBonus;
        if (aspectValue.calculation) {
            allAttackBonus = performDiceRollCalculation(aspectPlayerConfigs, aspectValue.calculation, { spell: spellToUse, isSpell, spellcastingAbility, spellcastingAbilityModifier, slotLevel, playerConfigForObject, additionalEffects });
        } else {
            allAttackBonus = aspectValue;
        }
        attackBonus = addDiceObjectsWithTypeTogether(attackBonus, allAttackBonus);
    });

    let amount = convertDiceRollWithTypeToValue(attackBonus);
    if (!amount) {
        amount = "0";
    }
    let addendum = calculateAddendumAspects(playerConfigs, ["spellAttackAddendum", "allAttackAddendum"], additionalEffects, { spell: spellToUse, isSpell, spellcastingAbility, spellcastingAbilityModifier, slotLevel });

    if (spellToUse.challengeType === "attackRoll") {
        const spellRange = calculateRange(playerConfigsToUse, additionalEffects, spell.range);
        // TODO: Need to differentiate between melee and ranged spell attacks.
        if (isNumeric(spellRange) && spellRange > 5) {
            const miscMap = getNameDictionaryForCollection("misc");
            const rangedMisc = miscMap["Ranged"];
    
            const rangedString = performMathCalculation(playerConfigs, rangedMisc.weaponAttackAddendum.calculation, { spell: spellToUse, isSpell, spellcastingAbility, spellcastingAbilityModifier, slotLevel, additionalEffects });

            if (rangedString) {
                if (addendum.length > 0) {
                    // Newline between different addendums.
                    addendum += "\n\n";
                }
                addendum += rangedString;
            }
        }
    }

    return { amount, addendum };
}

export function calculateSpellSaveDC(playerConfigs, additionalEffects, spell, isSpell, slotLevel) {
    let spellSaveDC = createDiceObjectWithType({});

    let playerConfigsToUse = playerConfigs;
    let spellToUse = spell;
    if (spell.feature.spellcasting.fromParentFeature) {
        const parentFeatureName = performMathCalculation(playerConfigs, spell.feature.spellcasting.fromParentFeature.calculation);
        const parentPlayerConfigs = playerConfigs.parent;
        const allParentSpellcastingFeatures = getAllSpellcastingFeatures(parentPlayerConfigs);
        const parentSpellcastingFeature = allParentSpellcastingFeatures.find(feature => parentFeatureName.includes(feature.feature.name));

        playerConfigsToUse = playerConfigs.parent;
        spellToUse = { ...spell, feature: parentSpellcastingFeature.feature };
    }

    const spellcastingAbility = performMathCalculation(playerConfigsToUse, spellToUse.feature.spellcasting.ability.calculation);
    const spellcastingAbilityModifier = calculateAspectCollection(playerConfigsToUse, spellcastingAbility + "Modifier");

    // Start with 8. Because that's what the rules say.
    spellSaveDC = addDiceObjectsWithTypeTogether(spellSaveDC, 8);

    // Always add spellcasting ability modifier.
    spellSaveDC = addDiceObjectsWithTypeTogether(spellSaveDC, spellcastingAbilityModifier);

    // Always add proficieny bonus for spellcasting.
    spellSaveDC = addDiceObjectsWithTypeTogether(spellSaveDC, calculateProficiencyBonus(playerConfigsToUse));
    
    // See if there are additional bonuses to apply to our attack.
    findAllConfiguredAspects(playerConfigsToUse, "spellSaveDCBonus", additionalEffects, (aspectPlayerConfigs, aspectValue, typeFoundOn, playerConfigForObject) => {
        if (aspectValue.conditions) {
            const conditionsAreMet = performBooleanCalculation(aspectPlayerConfigs, aspectValue.conditions, { spell: spellToUse, isSpell, spellcastingAbility, spellcastingAbilityModifier, slotLevel, playerConfigForObject, additionalEffects });
            if (!conditionsAreMet) {
                // We did not meet the conditions for this bonus to apply.
                return;
            }
        }

        let spellSaveDCBonus;
        if (aspectValue.calculation) {
            spellSaveDCBonus = performDiceRollCalculation(aspectPlayerConfigs, aspectValue.calculation, { spell: spellToUse, isSpell, spellcastingAbility, spellcastingAbilityModifier, slotLevel, playerConfigForObject });
        } else {
            spellSaveDCBonus = aspectValue;
        }
        spellSaveDC = addDiceObjectsWithTypeTogether(spellSaveDC, spellSaveDCBonus);
    });

    let dc = convertDiceRollWithTypeToValue(spellSaveDC);
    if (!dc) {
        dc = "0";
    }
    const addendum = calculateAddendumAspect(playerConfigs, "spellSaveDCAddendum", additionalEffects, { spell, isSpell, spellcastingAbility, spellcastingAbilityModifier, slotLevel });

    return { dc, addendum };
}

export function calculateOtherSpellAspect(playerConfigs, spell, slotLevel, aspectName, aspectBonusName, additionalEffects, additionalParams = undefined) {
    let playerConfigsToUse = playerConfigs;
    let spellToUse = spell;
    if (spell.feature.spellcasting.fromParentFeature) {
        const parentFeatureName = performMathCalculation(playerConfigs, spell.feature.spellcasting.fromParentFeature.calculation);
        const parentPlayerConfigs = playerConfigs.parent;
        const allParentSpellcastingFeatures = getAllSpellcastingFeatures(parentPlayerConfigs);
        const parentSpellcastingFeature = allParentSpellcastingFeatures.find(feature => parentFeatureName.includes(feature.feature.name));

        playerConfigsToUse = playerConfigs.parent;
        spellToUse = { ...spell, feature: parentSpellcastingFeature.feature };
    }

    const spellcastingAbility = performMathCalculation(playerConfigsToUse, spellToUse.feature.spellcasting.ability.calculation);
    const spellcastingAbilityModifier = calculateAspectCollection(playerConfigsToUse, spellcastingAbility + "Modifier");

    // Start with the spell's calculation
    let spellAspect = performDiceRollCalculation(playerConfigsToUse, spell[aspectName].calculation, { spell: spellToUse, spellcastingAbility, spellcastingAbilityModifier, slotLevel, additionalEffects, ...additionalParams });
    
    if (aspectBonusName) {
        // See if there are additional bonuses to apply to this aspect.
        findAllConfiguredAspects(playerConfigsToUse, aspectBonusName, additionalEffects, (aspectPlayerConfigs, aspectValue, typeFoundOn, playerConfigForObject) => {
            if (aspectValue.conditions) {
                const conditionsAreMet = performBooleanCalculation(aspectPlayerConfigs, aspectValue.conditions, { spell: spellToUse, spellcastingAbility, spellcastingAbilityModifier, slotLevel, playerConfigForObject, additionalEffects, ...additionalParams });
                if (!conditionsAreMet) {
                    // We did not meet the conditions for this bonus to apply.
                    return;
                }
            }

            let aspectBonus
            if (aspectValue.calculation) {
                aspectBonus = performDiceRollCalculation(aspectPlayerConfigs, aspectValue.calculation, { spell: spellToUse, spellcastingAbility, spellcastingAbilityModifier, slotLevel, playerConfigForObject, additionalEffects, ...additionalParams });
            } else {
                aspectBonus = aspectValue;
            }
            spellAspect = addDiceObjectsWithTypeTogether(spellAspect, aspectBonus);
        });
    }

    const amount = convertDiceRollWithTypeToValue(spellAspect);
    if (!amount) {
        return 0;
    }
    return amount;
}

export function calculateOtherFeatureActionAspect(playerConfigs, featureAction, aspectName, aspectBonusName, additionalEffects, additionalParams = undefined) {
    // Start with the feature action's calculation
    let actionAspect = performDiceRollCalculation(playerConfigs, featureAction[aspectName].calculation, { featureAction, ...additionalParams });
    
    if (aspectBonusName) {
        // See if there are additional bonuses to apply to this aspect.
        findAllConfiguredAspects(playerConfigs, aspectBonusName, additionalEffects, (aspectPlayerConfigs, aspectValue, typeFoundOn, playerConfigForObject) => {
            if (aspectValue.conditions) {
                const conditionsAreMet = performBooleanCalculation(aspectPlayerConfigs, aspectValue.conditions, { featureAction, playerConfigForObject, additionalEffects, ...additionalParams });
                if (!conditionsAreMet) {
                    // We did not meet the conditions for this bonus to apply.
                    return;
                }
            }

            let aspectBonus;
            if (aspectValue.calculation) {
                aspectBonus = performDiceRollCalculation(aspectPlayerConfigs, aspectValue.calculation, { featureAction, playerConfigForObject, additionalEffects, ...additionalParams });
            } else {
                aspectBonus = aspectValue;
            }
            actionAspect = addDiceObjectsWithTypeTogether(actionAspect, aspectBonus);
        });
    }

    const amount = convertDiceRollWithTypeToValue(actionAspect);
    if (!amount) {
        return 0;
    }
    return amount;
}

export function calculateAttackRollForAttackRollType(playerConfigs, additionalEffects, actionObject, isSpell, castAtLevel, attackRollType) {
    switch (attackRollType) {
        // TODO: Need to differentiate between melee and ranged spell attacks.
        case "spellAttack":
            return calculateSpellAttack(playerConfigs, additionalEffects, actionObject, isSpell, castAtLevel);
        case "unarmedAttack":
            return calculateUnarmedAttackBonus(playerConfigs, additionalEffects);
    }
}

export function calculateRange(playerConfigs, additionalEffects, range) {
    if (range) {
        if (isObject(range) && (range.normal || range.long)) {
            let rangeString = "";
            if (range.normal) {
                rangeString += calculateSingleRange(playerConfigs, additionalEffects, range.normal);
            }
            if (range.long) {
                rangeString += "/";
                rangeString += calculateSingleRange(playerConfigs, additionalEffects, range.long);
            }
            return rangeString;
        } else {
            return calculateSingleRange(playerConfigs, additionalEffects, range);
        }
    }
    return undefined;
}

function calculateSingleRange(playerConfigs, additionalEffects, singleRange) {
    let range;
    if (isObject(singleRange) && singleRange.calculation) {
        range = performMathCalculation(playerConfigs, singleRange.calculation);
    } else {
        range = singleRange;
    }

    if (isNumeric(range)) {
        findAllConfiguredAspects(playerConfigs, "rangeBonus", additionalEffects, (aspectPlayerConfigs, aspectValue, typeFoundOn, playerConfigForObject) => {
            if (aspectValue.conditions) {
                const conditionsAreMet = performBooleanCalculation(aspectPlayerConfigs, aspectValue.conditions, { playerConfigForObject, range, additionalEffects });
                if (!conditionsAreMet) {
                    // We did not meet the conditions for this bonus to apply.
                    return;
                }
            }

            let rangeBonus;
            if (aspectValue.calculation) {
                rangeBonus = performDiceRollCalculation(aspectPlayerConfigs, aspectValue.calculation, { playerConfigForObject, range, additionalEffects });
            } else {
                rangeBonus = aspectValue;
            }
            range += rangeBonus;
        });

        findAllConfiguredAspects(playerConfigs, "rangeMultiplier", additionalEffects, (aspectPlayerConfigs, aspectValue, typeFoundOn, playerConfigForObject) => {
            if (aspectValue.conditions) {
                const conditionsAreMet = performBooleanCalculation(aspectPlayerConfigs, aspectValue.conditions, { playerConfigForObject, range, additionalEffects });
                if (!conditionsAreMet) {
                    // We did not meet the conditions for this bonus to apply.
                    return;
                }
            }

            let rangeMultiplier;
            if (aspectValue.calculation) {
                rangeMultiplier = performMathCalculation(aspectPlayerConfigs, aspectValue.calculation, { playerConfigForObject, range, additionalEffects });
            } else {
                rangeMultiplier = aspectValue;
            }
            range *= rangeMultiplier;
        });
    }

    findAllConfiguredAspects(playerConfigs, "rangeOverride", additionalEffects, (aspectPlayerConfigs, aspectValue, typeFoundOn, playerConfigForObject) => {
        if (aspectValue.conditions) {
            const conditionsAreMet = performBooleanCalculation(aspectPlayerConfigs, aspectValue.conditions, { playerConfigForObject, range, additionalEffects });
            if (!conditionsAreMet) {
                // We did not meet the conditions for this bonus to apply.
                return;
            }
        }

        let rangeOverride;
        if (aspectValue.calculation) {
            rangeOverride = performMathCalculation(aspectPlayerConfigs, aspectValue.calculation, { playerConfigForObject, range, additionalEffects });
        } else {
            rangeOverride = aspectValue;
        }

        // The speed is being forced to this value.
        range = rangeOverride;
    });

    return range;
}

export function calculateDuration(playerConfigs, initialDuration, additionalEffects, parameters = {}) {
    let duration;
    if (initialDuration && initialDuration.calculation) {
        duration = performMathCalculation(playerConfigs, initialDuration.calculation, parameters);
    } else {
        duration = initialDuration;
    }

    findAllConfiguredAspects(playerConfigs, "durationMultiplier", additionalEffects, (aspectPlayerConfigs, aspectValue, typeFoundOn, playerConfigForObject) => {
        if (aspectValue.conditions) {
            const conditionsAreMet = performBooleanCalculation(aspectPlayerConfigs, aspectValue.conditions, { ...parameters, playerConfigForObject, duration, additionalEffects });
            if (!conditionsAreMet) {
                // We did not meet the conditions for this bonus to apply.
                return;
            }
        }

        let durationMultiplier;
        if (aspectValue.calculation) {
            durationMultiplier = performMathCalculation(aspectPlayerConfigs, aspectValue.calculation, { ...parameters, playerConfigForObject, duration, additionalEffects });
        } else {
            durationMultiplier = aspectValue;
        }

        const numberMatches = duration.match(/\d+/g);
        if (numberMatches && numberMatches.length > 0 && durationMultiplier !== 1) {
            for (let match of numberMatches) {
                const matchAsNumber = parseInt(match);
                duration = duration.replace(match, (matchAsNumber * durationMultiplier));
            }

            // Pluralize
            duration = duration.replace(/turn(?!s)/g, "turns");
            duration = duration.replace(/round(?!s)/g, "rounds");
            duration = duration.replace(/minute(?!s)/g, "minutes");
            duration = duration.replace(/hour(?!s)/g, "hours");
            duration = duration.replace(/day(?!s)/g, "days");
        }
    });

    return duration
}

export function calculateMetamagicLimit(playerConfigs) {
    let metamagicLimit = 1;

    findAllConfiguredAspects(playerConfigs, "metamagicLimitBonus", [], (aspectPlayerConfigs, aspectValue, typeFoundOn, playerConfigForObject) => {
        if (aspectValue.conditions) {
            const conditionsAreMet = performBooleanCalculation(aspectPlayerConfigs, aspectValue.conditions, { playerConfigForObject });
            if (!conditionsAreMet) {
                // We did not meet the conditions for this bonus to apply.
                return;
            }
        }

        let metamagicLimitBonus;
        if (aspectValue.calculation) {
            metamagicLimitBonus = performMathCalculation(aspectPlayerConfigs, aspectValue.calculation, { playerConfigForObject });
        } else {
            metamagicLimitBonus = aspectValue;
        }

        metamagicLimit += metamagicLimitBonus;
    });

    return metamagicLimit;
}

export function calculateSavingThrowTypes(savingThrowType) {
    if (Array.isArray(savingThrowType)) {
        const saveThrowsCapitalized = savingThrowType.map(save => getCapitalizedAbilityScoreName(save));
        const savingThrowString = concatStringArrayToOrStringWithCommas(saveThrowsCapitalized);
        return savingThrowString;
    } else {
        return getCapitalizedAbilityScoreName(savingThrowType);
    }
}

export function calculateAddendumAspects(playerConfigs, addendumNames, additionalEffects, parameters = {}) {
    let allAddendumsStrings = "";
    for (let addendumName of addendumNames) {
        const singleAddendum = calculateAddendumAspect(playerConfigs, addendumName, additionalEffects, parameters);
        if (singleAddendum && singleAddendum.length > 0) {
            if (allAddendumsStrings.length > 0) {
                // Newline between different addendums.
                allAddendumsStrings += "\n\n";
            }

            allAddendumsStrings += singleAddendum;
        }
    }
    return allAddendumsStrings;
}

export function calculateAddendumAspect(playerConfigs, addendumName, additionalEffects, parameters = {}) {
    let addendumString = "";

    findAllConfiguredAspects(playerConfigs, addendumName, additionalEffects, (aspectPlayerConfigs, aspectValue, typeFoundOn, playerConfigForObject) => {
        let valueToAdd;

        if (aspectValue.conditions) {
            const conditionsAreMet = performBooleanCalculation(aspectPlayerConfigs, aspectValue.conditions, { ...parameters, playerConfigForObject, additionalEffects });
            if (!conditionsAreMet) {
                // We did not meet the conditions for this bonus to apply.
                return;
            }
        }

        if (aspectValue.calculation) {
            valueToAdd = performMathCalculation(aspectPlayerConfigs, aspectValue.calculation, { ...parameters, playerConfigForObject, additionalEffects });
        } else {
            valueToAdd = aspectValue;
        }

        if (aspectPlayerConfigs != playerConfigs) {
            valueToAdd += "\n\n" + rightTriangleUnicode + "From " + aspectPlayerConfigs.name;
        }

        if (valueToAdd && valueToAdd.length > 0) {
            if (addendumString.length > 0) {
                // Newline between different addendums.
                addendumString += "\n\n";
            }
            addendumString += valueToAdd;
        }
    });

    return addendumString;
}

export function calculateFeatures(playerConfigs) {
    const allFeatures = []

    findAllValidFeatures(playerConfigs, (feature, typeFoundOn, playerConfigForObject) => {
        if (feature.conditions) {
            const conditionsAreMet = performBooleanCalculation(playerConfigs, feature.conditions, { ...playerConfigForObject });
            if (!conditionsAreMet) {
                // We did not meet the conditions for feature to apply.
                return;
            }
        }

        allFeatures.push({ feature, typeFoundOn, playerConfigForObject });
    });

    return allFeatures;
}

function findAllValidFeatures(playerConfigs, onFeatureFound) {
    const name2DndSubclass = getNameDictionaryForCollection("subclasses");

    return findAllConfiguredAspects(playerConfigs, "features", [], (aspectPlayerConfigs, aspectValue, typeFoundOn, playerConfigForObject) => {
        switch (typeFoundOn) {
            case "class":
                for (let classFeature of aspectValue) {
                    if (classFeature.classLevel <= playerConfigForObject.levels) {
                        onFeatureFound(classFeature, typeFoundOn, playerConfigForObject);
                    }
                }
                return;
            case "species": 
                for (let speciesFeature of aspectValue) {
                    if (speciesFeature.level <= aspectPlayerConfigs.level) {
                        onFeatureFound(speciesFeature, typeFoundOn, playerConfigForObject);
                    }
                }
                return;
            case "subclass":
                for (let subclassFeature of aspectValue) {
                    const subclassName = playerConfigForObject.name;
                    const subclass = name2DndSubclass[subclassName];
                    const className = subclass.class;
                    const classLevel = calculateAspectCollection(playerConfigs, "classLevel" + className);
                    if (subclassFeature.classLevel <= classLevel) {
                        onFeatureFound(subclassFeature, typeFoundOn, playerConfigForObject);
                    }
                }
                return;
        }

        if (typeFoundOn.startsWith("species[")) {
            for (let speciesFeature of aspectValue) {
                if (speciesFeature.level <= aspectPlayerConfigs.level) {
                    onFeatureFound(speciesFeature, typeFoundOn, playerConfigForObject);
                }
            }
        } else {
            for (let feature of aspectValue) {
                onFeatureFound(feature, typeFoundOn, playerConfigForObject);
            }
        }
    });
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
        case "level":
            return playerConfigs.level;
        case "tier":
            return calculateTierForPlayerLevel(playerConfigs);
        case "proficiencyBonus":
            return calculateProficiencyBonus(playerConfigs);
        case "initiativeBonus":
            return calculateInitiativeBonus(playerConfigs);
        case "speed":
            return calculateSpeed(playerConfigs);
        case "size":
            return calculateSize(playerConfigs);
        case "passivePerception":
            return calculatePassivePerception(playerConfigs);
        case "features":
            return calculateFeatures(playerConfigs);
        case "featureNames": 
            return calculateFeatures(playerConfigs).map(x => x.feature.name);
        case "knownSpells":
            const spellCastingFeatures = getAllSpellcastingFeatures(playerConfigs);
            return getAllSpells(playerConfigs, spellCastingFeatures);
        case "knownSpellNames":
            const spellCastingFeatures2 = getAllSpellcastingFeatures(playerConfigs);
            return getAllSpells(playerConfigs, spellCastingFeatures2).map(x => x.name);
        case "heldItems":
            return GetHeldItems(playerConfigs.items);
        case "equippedItems":
            return GetEquippedItems(playerConfigs.items);
        case "metamagic":
            return getAllSelectedMetamagicOptions(playerConfigs);

    }

    if (aspectName.startsWith("classLevel")) {
        const classToSearchFor = aspectName.substring(10);
        const classConfig = playerConfigs.classes.find(classConfig => classConfig.name === classToSearchFor);
        if (classConfig) {
            return classConfig.levels;
        } else {
            // We don't have this class.
            return 0;
        }
    }

    if (aspectName.startsWith("skillProficiency")) {
        const skillProficiencyName = aspectName.substring(16);
        return calculateSkillProficiency(playerConfigs, skillProficiencyName);
    }

    if (aspectName.startsWith("spellSaveDC")) {
        const classToSearchFor = aspectName.substring(11);
        const classConfig = playerConfigs.classes.find(classConfig => classConfig.name === classToSearchFor);
        const className = classConfig.name;
        const dndClassMap = getNameDictionaryForCollection("classes");
        const dndClass = dndClassMap[className];
        const spellCastingFeature = dndClass.features.find(feature => feature.spellcasting);
        const spellSaveDC = calculateSpellSaveDC(playerConfigs, [], { feature: spellCastingFeature }, false, undefined);
        return spellSaveDC.dc;
    }

    if (aspectName.endsWith("SavingThrow")) {
        const savingThrowName = aspectName.substring(0, aspectName.length - 11);
        const playerSavingThrowProficiencies = calculateAspectCollection(playerConfigs, "savingThrowProficiencies");
        const hasSavingThrowProficiency = playerSavingThrowProficiencies.some(save => save === savingThrowName);
        return calculateSavingThrowBonus(playerConfigs, savingThrowName, hasSavingThrowProficiency);
    }

    const aspectCollection = calculateAspectCollectionCore(playerConfigs, aspectName);
    return aspectCollection;
}

export function calculateAspectCollectionCore(playerConfigs, aspectName, pathToProperty = "$VALUE") {
    // Aspects are things like Language, Resistance, etc that are added from various Species, Class, Feats or Magical Effects.
    let aspectCollection = {};

    findAllConfiguredAspects(playerConfigs, aspectName, [], (aspectPlayerConfigs, aspectValue, typeFoundOn, playerConfigForObject) => {
        setAspectCollectionFromArrayOrProperty(aspectCollection, aspectValue, pathToProperty);
    });

    return convertHashMapToArrayOfStrings(aspectCollection);
}

function setAspectCollectionFromArrayOrProperty(totalAspectCollection, arrayOrProperty, pathToProperty = "$VALUE") {
    if (arrayOrProperty) {
        if (Array.isArray(arrayOrProperty)) {
            // It is an array.
            for (const aspect of arrayOrProperty) {
                const aspectValue = getValueFromObjectAndPath(aspect, pathToProperty);
                if (aspectValue !== null) {
                    totalAspectCollection[aspectValue] = true;
                }
            }
        } else {
            // It is a property
            const aspectValue = getValueFromObjectAndPath(arrayOrProperty, pathToProperty);
            if (aspectValue !== null) {
                totalAspectCollection[aspectValue] = true;
            }
        }
    }
}

let findAllConfiguredAspects_collections = undefined;
let findAllConfiguredAspects_lastAspects = {};
let findAllConfiguredAspects_levelsDeep = 0;

function findAllConfiguredAspects(playerConfigs, aspectName, additionalEffects, onAspectFound) {
    // TODO: Instead of playerConfigForObject, we can pass multiple parameters and be a bit more specific. This is going to require a lot of work and an overhaul to our configs as well but will make everything so much cleaner and easier to use, write and read.
    const backgroundMap = getNameDictionaryForCollection("backgrounds");
    const speciesMap = getNameDictionaryForCollection("species");
    const featMap = getNameDictionaryForCollection("feats");
    const eldrichinvocationMap = getNameDictionaryForCollection("eldrichinvocations");
    const subclassMap = getNameDictionaryForCollection("subclasses");

    // Check additional effects first.
    if (additionalEffects && additionalEffects.length > 0) {
        processAdditionalEffects(playerConfigs, additionalEffects, "additionalEffects", aspectName, onAspectFound);  
    }

    // Check the base player for the aspect.
    const baseAspectValue = getValueFromObjectAndPath(playerConfigs, aspectName)
    if (baseAspectValue) {
        onAspectFound(playerConfigs, baseAspectValue, "player", playerConfigs);
    }

    // Check the species for the aspect.
    const dndspecies = speciesMap[playerConfigs.species.name];
    if (dndspecies) {
        const speciesAspectValue = getValueFromObjectAndPath(dndspecies, aspectName)
        if (speciesAspectValue) {
            onAspectFound(playerConfigs, speciesAspectValue, "species", playerConfigs.species);
        }

        const allDndSpeciesFeatures = dndspecies?.features ? [...dndspecies.features] : [];

        if (dndspecies.choices) {
            findAspectsFromChoice(playerConfigs, dndspecies, "species.choices.", aspectName, (aspectValue) => onAspectFound(playerConfigs, aspectValue, "species[" + playerConfigs.species.name  + "]", playerConfigs.species.choices));

            findAspectsFromChoice(playerConfigs, dndspecies, "species.choices.", "features", (aspectValue) => {
                for (let speciesFeature of aspectValue) {
                    allDndSpeciesFeatures.push(speciesFeature);
                }
            });
        }
        
        if (allDndSpeciesFeatures) {
            for (let j = 0; j < allDndSpeciesFeatures.length; j++) {
                const speciesFeature = allDndSpeciesFeatures[j];
                if (!speciesFeature.level || speciesFeature.level <= playerConfigs.level) {
                    const featurePropertyName = speciesFeature.name.replace(/\s/g, "") + speciesFeature.level;
                    processFeature(playerConfigs, aspectName, speciesFeature, playerConfigs.species, "species", featurePropertyName, { featMap, eldrichinvocationMap }, onAspectFound);
                }
            }
        }
    }
    
    const dndClasses = getAllPlayerDNDClasses(playerConfigs);
    for (let i = 0; i < dndClasses.length; i++) {
        const dndClass = TransformDndClassBasedOnMainOrMulticlass(playerConfigs, dndClasses[i]);
        // Check each of the classes for the aspect.
        const classAspectValue = dndClass[aspectName];
        if (classAspectValue) {
            onAspectFound(playerConfigs, classAspectValue, "class", playerConfigs.classes[i]);
        }

        const allDndClassFeatures = dndClass.features ? [...dndClass.features] : [];

        if (dndClass.choices) {
            findAspectsFromChoice(playerConfigs, dndClass, "classes[" + i + "].choices.", aspectName, (aspectValue) => onAspectFound(playerConfigs, aspectValue, "class", playerConfigs.classes[i].choices));

            findAspectsFromChoice(playerConfigs, dndClass, "classes[" + i + "].choices.", "features", (aspectValue) => {
                for (let classFeature of aspectValue) {
                    allDndClassFeatures.push(classFeature);
                }
            });
        }

        if (allDndClassFeatures) {
            for (let j = 0; j < allDndClassFeatures.length; j++) {
                const classFeature = allDndClassFeatures[j];
                if (!classFeature.classLevel || classFeature.classLevel <= playerConfigs.classes[i].levels) {
                    const featurePropertyName = classFeature.name.replace(/\s/g, "") + classFeature.classLevel;
                    const classFeaturePlayerConfig = playerConfigs.classes[i].features ? playerConfigs.classes[i].features[featurePropertyName] : undefined;

                    processFeature(playerConfigs, aspectName, classFeature, playerConfigs.classes[i], "classes[" + i + "]", featurePropertyName, { featMap, eldrichinvocationMap }, onAspectFound);

                    if (classFeature.subclass) {
                        const selectedSubclass = classFeaturePlayerConfig?.name;
                        if (selectedSubclass) {
                            const dndSubclass = subclassMap[selectedSubclass];
                            if (dndSubclass) {
                                if (dndSubclass[aspectName]) {
                                    onAspectFound(playerConfigs, dndSubclass[aspectName], "subclass", playerConfigs.classes[i].features[featurePropertyName]);
                                }

                                if (dndSubclass.choices) {
                                    findAspectsFromChoice(playerConfigs, dndSubclass, "classes[" + i + "].features." + featurePropertyName + ".choices.", aspectName, (aspectValue) => onAspectFound(playerConfigs, aspectValue, "subclass", classFeaturePlayerConfig.choices));
                                }

                                if (dndSubclass.features) {
                                    // TODO: We really need to unify the logic for looking through features.
                                    for (const subclassFeature of dndSubclass.features) {
                                        if (subclassFeature[aspectName]) {
                                            onAspectFound(playerConfigs, subclassFeature[aspectName], "subclass", playerConfigs.classes[i].features[featurePropertyName]);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // Check the background for the aspect.
    const dndBackground = backgroundMap[playerConfigs.background.name];
    if (dndBackground) {
        const backgroundAspectValue = getValueFromObjectAndPath(dndBackground, aspectName);
        if (backgroundAspectValue) {
            onAspectFound(playerConfigs, backgroundAspectValue, "background", playerConfigs.background);
        }

        if (dndBackground.feat) {
            const dndfeat = featMap[dndBackground.feat];
            if (dndfeat) {
                processFeat(playerConfigs, aspectName, dndBackground.feat, playerConfigs.background, "background", "featMap", { featMap, eldrichinvocationMap }, onAspectFound);
            }
        }
    }

    if (playerConfigs.items) {
        // Check equipped items for the aspect.
        const itemsDictionary = getNameDictionaryForCollection("items");
        for (let item of playerConfigs.items) {
            if (item.equipped) {
                const dndItem = itemsDictionary[item.name];
                if (dndItem && (!dndItem.attunement || item.attuned === playerConfigs.name) && dndItem.aspects && dndItem.aspects[aspectName]) {
                    onAspectFound(playerConfigs, dndItem.aspects[aspectName], "item", item);
                }
            }
        }
    }

    if (playerConfigs?.statBlocks && playerConfigs.statBlocks.length > 0) {
        const statBlockMap = getNameDictionaryForCollection("statblocks");
        for (let statBlock of playerConfigs.statBlocks) {
            const dndStatBlock = statBlockMap[statBlock];
            if (dndStatBlock && dndStatBlock.aspects && dndStatBlock.aspects[aspectName]) {
                onAspectFound(playerConfigs, dndStatBlock.aspects[aspectName], "statblock", dndStatBlock);
            }

            const allStatBlockFeatures = dndStatBlock?.aspects?.features ? [...dndStatBlock.aspects.features] : [];
            
            if (allStatBlockFeatures) {
                for (let i = 0; i < allStatBlockFeatures.length; i++) {
                    const statBlockFeature = allStatBlockFeatures[i];
                    if (statBlockFeature && statBlockFeature[aspectName]) {
                        onAspectFound(playerConfigs, statBlockFeature[aspectName], "feature", statBlockFeature);
                    }
                }
            }
        }
    }

    if (playerConfigs?.homebrew && playerConfigs.homebrew.length > 0) {
        const dndHomebrewMap = getNameDictionaryForCollection("homebrew");
        for (let i = 0; i < playerConfigs.homebrew.length; i++) {
            const homebrew = playerConfigs.homebrew[i];
            const dndHomebrew = dndHomebrewMap[homebrew.name];
            if (dndHomebrew) {
                const classAspectValue = dndHomebrew[aspectName];
                if (classAspectValue) {
                    onAspectFound(playerConfigs, classAspectValue, "homebrew", homebrew);
                }
    
                const allDndHomebrewFeatures = dndHomebrew.features ? [...dndHomebrew.features] : [];
    
                if (dndHomebrew.choices) {
                    findAspectsFromChoice(playerConfigs, dndHomebrew, "homebrew[" + i + "].choices.", aspectName, (aspectValue) => onAspectFound(playerConfigs, aspectValue, "homebrew", homebrew));
    
                    findAspectsFromChoice(playerConfigs, dndHomebrew, "homebrew[" + i + "].choices.", "features", (aspectValue) => {
                        for (let classFeature of aspectValue) {
                            allDndHomebrewFeatures.push(classFeature);
                        }
                    });
                }
    
                if (allDndHomebrewFeatures) {
                    for (let j = 0; j < allDndHomebrewFeatures.length; j++) {
                        const homebrewFeature = allDndHomebrewFeatures[j];
                        if (homebrewFeature && homebrewFeature[aspectName]) {
                            onAspectFound(playerConfigs, homebrewFeature[aspectName], "feature", homebrew);
                        }
                    }
                }
            }
        }
    }

    // TODO: Right now there's an infinite recursion problem if this is visited more than once. 
    // There's likely a better solution than what I have implemented here. We basically don't allow a lower callstack to execute for an aspect if a higher callstack already has.
    // It re-iterates in processActiveEffect, maybe the caching needs to be done in there instead so that caculating out an active effect doesn't take itself into account when doing so?
    // As far as I am aware this hasn't caused any problems yet, so maybe it's fine to leave it like this for now, since it's only for calculating aspects on active effects, and I can't think of examples of active effects affecting other active effects...
    if (!findAllConfiguredAspects_lastAspects[aspectName]) {
        if (playerConfigs?.currentStatus?.conditions && playerConfigs.currentStatus.conditions.length > 0) {
            const dndConditionsMap = getNameDictionaryForCollection("conditions");
            // Some conditions cause other conditions, and we don't want to check any condition twice, this will help with that.
            const dndConditionsChecked = {};
            for (let playerCondition of playerConfigs.currentStatus.conditions) {
                findAspectFromCondition(dndConditionsChecked, dndConditionsMap, playerCondition.name, aspectName, (aspectValue) => onAspectFound(playerConfigs, aspectValue, "condition", playerCondition));
            }
        }

        if (findAllConfiguredAspects_levelsDeep === 0) {
            findAllConfiguredAspects_collections = {};
        }
        findAllConfiguredAspects_levelsDeep++;
        findAllConfiguredAspects_lastAspects[aspectName] = true;
        try {
            if (playerConfigs?.currentStatus?.activeEffects && playerConfigs.currentStatus.activeEffects.length > 0) {
                for (let activeEffect of playerConfigs.currentStatus.activeEffects) {
                    processActiveEffect(playerConfigs, playerConfigs, activeEffect, findAllConfiguredAspects_collections, aspectName, onAspectFound);

                    if (activeEffect.additionalEffects && activeEffect.additionalEffects.length > 0) {
                        processAdditionalEffects(playerConfigs, activeEffect.additionalEffects, "aspects", aspectName, onAspectFound, "activeEffect", activeEffect); 
                    }

                    if (activeEffect.allies) {
                        for (let ally of activeEffect.allies) {
                            findAllConfiguredAspects(ally, "parentAspects", [], (aspectPlayerConfigs, parentAspect, typeFoundOn, playerConfigForObject) => {
                                for (let parentAspectName of Object.keys(parentAspect)) {
                                    if (parentAspectName === aspectName) {
                                        const aspectValue = parentAspect[parentAspectName];
                                        onAspectFound(aspectPlayerConfigs, aspectValue, "ally", ally);
                                    }
                                }
                            });

                            checkAllyForActiveEffects(playerConfigs, ally, findAllConfiguredAspects_collections, aspectName, onAspectFound);
                        }
                    }
                }
            }

            if (playerConfigs.parent) {
                checkParentForActiveEffects(playerConfigs, playerConfigs.parent, findAllConfiguredAspects_collections, aspectName, onAspectFound);
            }
        } finally {
            findAllConfiguredAspects_levelsDeep--;
            delete findAllConfiguredAspects_lastAspects[aspectName];
            if (findAllConfiguredAspects_levelsDeep === 0) {
                findAllConfiguredAspects_collections = undefined;
            }
        }
    }
}

function processAdditionalEffects(playerConfigs, additionalEffects, searchType, aspectName, onAspectFound, typeFoundOn = undefined, playerConfigForObject = undefined) {
    let spellName2Spell = undefined
    const metamagicMap = getNameDictionaryForCollection("metamagic");
    for (let additionalEffect of additionalEffects) {
        let baseEffectObject = undefined;
        switch (additionalEffect.type) {
            case "spell":
                if (spellName2Spell === undefined) {
                    const spellCastingFeatures = getAllSpellcastingFeatures(playerConfigs);
                    const playerSpells = getAllSpells(playerConfigs, spellCastingFeatures);
                    spellName2Spell = convertArrayToDictionary(playerSpells, "name");
                }
                baseEffectObject = spellName2Spell[additionalEffect.name];
                break;
            case "metamagic":
                baseEffectObject = metamagicMap[additionalEffect.name];
                break;
        }

        if (baseEffectObject) {
            let additionalEffectsObject = undefined;
            if (additionalEffect.path) {
                const pathedToObject = getValueFromObjectAndPath(baseEffectObject, additionalEffect.path);
                if (pathedToObject) {
                    additionalEffectsObject = pathedToObject[searchType];
                }
            } else {
                additionalEffectsObject = baseEffectObject[searchType];
            }

            if (additionalEffectsObject) {
                const additionalEffectAspectValue = additionalEffectsObject[aspectName];
                if (additionalEffectAspectValue) {
                    if (typeFoundOn && playerConfigForObject) {
                        onAspectFound(playerConfigs, additionalEffectAspectValue, typeFoundOn, playerConfigForObject);
                    } else {
                        onAspectFound(playerConfigs, additionalEffectAspectValue, additionalEffect.type, baseEffectObject);
                    }
                }
            }
        }
    }
}

function processFeature(playerConfigs, aspectName, feature, playerConfigFeatureObject, pathToFeatureConfigObject, featurePropertyName, collections, onAspectFound) {
    const playerConfigFeatureObjectFeature = playerConfigFeatureObject.features ? playerConfigFeatureObject.features[featurePropertyName] : undefined;
    if (aspectName !== "feat" && aspectName !== "eldrichInvocations") {
        const classFeatureAspectValue = getValueFromObjectAndPath(feature, aspectName);
        if (classFeatureAspectValue) {
            onAspectFound(playerConfigs, classFeatureAspectValue, "feature", playerConfigFeatureObjectFeature);
        }
    }
    
    if (feature.choices) {
        findAspectsFromChoice(playerConfigs, feature, pathToFeatureConfigObject + ".features." + featurePropertyName + ".choices.", aspectName, (aspectValue) => onAspectFound(playerConfigs, aspectValue, "feature", playerConfigFeatureObjectFeature.choices));
    }

    if (feature.feat) {
        const selectedFeatName = playerConfigFeatureObjectFeature?.name;
        if (selectedFeatName) {
            const dndfeat = collections.featMap[selectedFeatName];
            if (dndfeat) {
                processFeat(playerConfigs, aspectName, selectedFeatName, playerConfigFeatureObjectFeature, pathToFeatureConfigObject + ".features." + featurePropertyName, "featMap", collections, onAspectFound);
            }
        }
    }

    if (feature.eldrichInvocations) {
        const eldrichInvocations = playerConfigFeatureObjectFeature?.eldrichInvocations;
        if (eldrichInvocations && eldrichInvocations.length > 0) {
            for (let i = 0; i < eldrichInvocations.length; i++) {
                const eldrichInvocation = eldrichInvocations[i];
                if (eldrichInvocation) {
                    processFeat(playerConfigs, aspectName, eldrichInvocation.name, eldrichInvocation, pathToFeatureConfigObject + ".features." + featurePropertyName + ".eldrichInvocations[" + i + "]", "eldrichinvocationMap", collections, onAspectFound);
                }
            }
        }
    }
}

function processFeat(playerConfigs, aspectName, selectedFeatName, playerConfigFeatureObjectFeature, pathToFeatureConfigObjectFeat, collection, collections, onAspectFound) {
    if (aspectName === "feat") {
        onAspectFound(playerConfigs, selectedFeatName, "feature", playerConfigFeatureObjectFeature);
    }

    const dndCollection = collections[collection];
    const dndfeat = dndCollection[selectedFeatName];
    if (dndfeat) {
        if (dndfeat.aspects && dndfeat.aspects[aspectName]) {
            onAspectFound(playerConfigs, dndfeat.aspects[aspectName], "feat", playerConfigFeatureObjectFeature);
        }

        const allFeatures = dndfeat?.aspects?.features ? [...dndfeat.aspects.features] : [];
        if (dndfeat.choices) {
            findAspectsFromChoice(playerConfigs, dndfeat, pathToFeatureConfigObjectFeat + ".choices.", aspectName, (aspectValue) => onAspectFound(playerConfigs, aspectValue, "feat", playerConfigFeatureObjectFeature.choices));

            findAspectsFromChoice(playerConfigs, dndfeat, pathToFeatureConfigObjectFeat, "features", (aspectValue) => {
                for (let oneFeature of aspectValue) {
                    allFeatures.push(oneFeature);
                }
            });
        }

        if (allFeatures.length > 0) {
            for (let i = 0; i < allFeatures.length; i++) {
                const featFeature = allFeatures[i];
                if (featFeature) {
                    const featureName = featFeature.name.replace(/\s/g, "");

                    if (featFeature) {
                        processFeature(playerConfigs, aspectName, featFeature, playerConfigFeatureObjectFeature, pathToFeatureConfigObjectFeat, featureName, collections, onAspectFound);
                    }
                }
            }
        }
    }
}

function checkParentForActiveEffects(playerConfigs, parentConfigs, collections, aspectName, onAspectFound) {
    if (parentConfigs?.currentStatus?.activeEffects && parentConfigs.currentStatus.activeEffects.length > 0) {
        for (let activeEffect of parentConfigs.currentStatus.activeEffects) {
            processActiveEffect(playerConfigs, parentConfigs, activeEffect, collections, aspectName, onAspectFound);
        }
    }

    if (parentConfigs.parent) {
        checkParentForActiveEffects(playerConfigs, parentConfigs.parent, collections, aspectName, onAspectFound);
    }
}

function checkAllyForActiveEffects(playerConfigs, ally, collections, aspectName, onAspectFound) {
    if (ally?.currentStatus?.activeEffects && ally.currentStatus.activeEffects.length > 0) {
        for (let activeEffect of ally.currentStatus.activeEffects) {
            processActiveEffect(playerConfigs, ally, activeEffect, collections, aspectName, onAspectFound);

            if (activeEffect.allies) {
                for (let childAlly of activeEffect.allies) {
                    checkAllyForActiveEffects(playerConfigs, childAlly, collections, aspectName, onAspectFound);
                }
            }
        }
    }
}

function processActiveEffect(affectedPlayerConfigs, activeEffectPlayerConfigs, activeEffect, collections, aspectName, onAspectFound) {
    if (activeEffect.targetNamesMap && activeEffect.targetNamesMap[affectedPlayerConfigs.name]) {
        const collection = getOrAddCachedActiveEffectCollection(activeEffectPlayerConfigs, collections, activeEffect.fromRemoteCharacter);
        switch (activeEffect.type) {
            case "spell":
                const spell = collection.spellName2Spell[activeEffect.name];
                if (spell && spell.aspects && spell.aspects[aspectName]) {
                    onAspectFound(activeEffectPlayerConfigs, spell.aspects[aspectName], "spell", activeEffect);
                }
                break;
            case "featureaction":
                const actionFeature = collection.actionFeatures.find(feature => feature.feature.actions.some(action => action.name === activeEffect.name));
                if (actionFeature) {
                    const featureAction = actionFeature.feature.actions.find(action => action.name === activeEffect.name);
                    if (featureAction && featureAction.aspects && featureAction.aspects[aspectName]) {
                        onAspectFound(activeEffectPlayerConfigs, featureAction.aspects[aspectName], "featureAction", activeEffect);
                    }
                }
                break;
            case "action":
                const action = collection.actionName2Action[activeEffect.name];
                if (action && action.aspects && action.aspects[aspectName]) {
                    onAspectFound(activeEffectPlayerConfigs, action.aspects[aspectName], "action", activeEffect);
                }
                break;
            case "item":
                const item = collection.itemName2Item[activeEffect.name];
                if (item && item.consumeEffect && item.consumeEffect.aspects && item.consumeEffect.aspects[aspectName]) {
                    onAspectFound(activeEffectPlayerConfigs, item.consumeEffect.aspects[aspectName], "action", activeEffect);
                }
                break;
        }
    }
}

function getOrAddCachedActiveEffectCollection(playerConfigs, collections, fromRemoteCharacter) {
    const characterName = fromRemoteCharacter ?? playerConfigs.name;

    if (collections[characterName]) {
        return collections[characterName];
    }

    let playerConfigsToSearchFor = undefined;
    if (characterName === playerConfigs.name) {
        playerConfigsToSearchFor = playerConfigs;
    } else {
        const remoteCharactersString = localStorage.getItem("REMOTE_CHARACTERS");
        const remoteCharacters = remoteCharactersString ? JSON.parse(remoteCharactersString) : {};
        playerConfigsToSearchFor = remoteCharacters[characterName];
    }

    if (playerConfigsToSearchFor) {
        const spellCastingFeatures = getAllSpellcastingFeatures(playerConfigsToSearchFor);
        const playerSpells = getAllSpells(playerConfigsToSearchFor, spellCastingFeatures);
        const spellName2Spell = convertArrayToDictionary(playerSpells, "name");

        const actionFeatures = getAllActionFeatures(playerConfigsToSearchFor);

        const actionName2Action = getNameDictionaryForCollection("actions");
        const itemName2Item = getNameDictionaryForCollection("items");

        const collection = { spellName2Spell, actionFeatures, actionName2Action, itemName2Item };
        collections[characterName] = collection;
        return collection;
    } else {
        const collection = { spellName2Spell: {}, actionFeatures: [], actionName2Action: {} };
        collections[characterName] = collection;
        return collection;
    }
}

function findAspectFromCondition(dndConditionsChecked, dndConditionsMap, conditionName, aspectName, onAspectFound) {
    if (!dndConditionsChecked[conditionName]) {
        dndConditionsChecked[conditionName] = true;
        const dndCondition = dndConditionsMap[conditionName]
        if (dndCondition[aspectName]) {
            onAspectFound(dndCondition[aspectName]);
        }

        if (dndCondition.additionalConditions) {
            for (let additionalConditionName of dndCondition.additionalConditions) {
                findAspectFromCondition(dndConditionsChecked, dndConditionsMap, additionalConditionName, aspectName, onAspectFound);
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

export function performDiceRollCalculation(playerConfigs, calculation, parameters = {}) {
    const doSingleCalculationForSpecialTypes = (singleCalculation) => {
        switch (singleCalculation.type) {
            case "dieRoll":
                const diceCalculationObject = {};
                const diceProperty = "d" + singleCalculation.value
                diceCalculationObject[diceProperty] = 1;
                
                return diceCalculationObject;
        }
        return 0;
    };
    const performSpecialTransformations = (playerConfigs, singleCalculation, singleValue) => {
        if (singleCalculation.type === "if-then" || singleCalculation.type === "multiple-if") {
            // It is already in the correct format.
            return singleValue;
        }

        let transformedValue = singleValue;
        if (singleCalculation.resultNeedsCalculated && singleValue.calculation) {
            transformedValue = performMathCalculation(playerConfigs, singleValue.calculation, parameters);
        }

        if (singleCalculation.multiplier) {
            const multiplier = performMathCalculation(playerConfigs, singleCalculation.multiplier, parameters);

            if (isObject(transformedValue)) {
                // This value to multipy against is a die object. Multiply each of the dice in it by the mulitplier.
                for (let key of Object.keys(transformedValue)) {
                    transformedValue[key] *= multiplier;
                }
            } else {
                // This value to multipy against is just simple numeric value. We can just multiply the two values.
                transformedValue = transformedValue * multiplier;
            }
        }

        if (singleCalculation.dividedBy) {
            const divededBy = performMathCalculation(playerConfigs, singleCalculation.dividedBy, parameters) * 1.0;
            
            if (isObject(transformedValue)) {
                // This value to multipy against is a die object. Multiply each of the dice in it by the mulitplier.
                for (let key of Object.keys(transformedValue)) {
                    transformedValue[key] =  singleCalculation.roundUp ? Math.ceil(transformedValue[key] / divededBy) : Math.floor(transformedValue[key] / divededBy);
                }
            } else {
                // This value to multipy against is just simple numeric value. We can just multiply the two values.
                transformedValue = singleCalculation.roundUp ? Math.ceil(transformedValue / divededBy) : Math.floor(transformedValue / divededBy);
            }
        }

        return createDiceObjectWithType(transformedValue, singleCalculation.diceType);
    };
    const performAddition = (currentTotal, valueToAdd) => {
        return addDiceObjectsWithTypeTogether(currentTotal, valueToAdd);
    };
    const shouldBreak = (total) => {
        return false;
    }

    const diceObject = performCalculation(playerConfigs, calculation, doSingleCalculationForSpecialTypes, performSpecialTransformations, performAddition, shouldBreak, () => { return {}; }, parameters);
    return diceObject;
}

export function computeAverageDiceRoll(diceObjectWithType) {
    let total = 0;
    for (let diceType of Object.keys(diceObjectWithType)) {
        const diceObject = diceObjectWithType[diceType];
        for (let diceObjectKey of Object.keys(diceObject)) {
            if (diceObjectKey === "static") {
                total += diceObject[diceObjectKey];
            }
            else if (diceObjectKey.startsWith("d")) {
                const dieSizeString = diceObjectKey.substring(1);
                if (isNumeric(dieSizeString)) {
                    const dieSize = parseInt(dieSizeString);
                    const averageRoll = calculateSingleDieAverage(dieSize);
                    const allRolls = diceObject[diceObjectKey] * averageRoll;
                    total += allRolls;
                }
            }
        }
    }
    return total;
}

export function calculateSingleDieAverage(dieSize) {
    let allPossibleValuesAddedUp = 0;
    for (let singlePossibleValue = 1; singlePossibleValue <= dieSize; singlePossibleValue++) {
        allPossibleValuesAddedUp += singlePossibleValue;
    }
    const averageValue = ((allPossibleValuesAddedUp) / (dieSize));
    return averageValue
}

export function createDiceObjectWithType(diceObject, diceType) {
    let diceTypeProperty;
    if (diceType) {
        if (Array.isArray(diceType)) {
            diceTypeProperty = concatStringArrayToOrStringWithCommas(diceType);
        } else {
            diceTypeProperty = diceType
        }
    } else {
        diceTypeProperty = "";
    }
    const diceObjectWithType = {}
    diceObjectWithType[diceTypeProperty] = diceObject;
    return diceObjectWithType;
}

export function multiplyDiceObjectsWithTypeByMultiplier(diceObjectWithType, multiplier) {
    for (let diceType of Object.keys(diceObjectWithType)) {
        const diceObject = diceObjectWithType[diceType];
        for (let key of Object.keys(diceObject)) {
            diceObject[key] = (diceObject[key] * multiplier);
        }
    }
    return diceObjectWithType;
}

export function addDiceObjectsWithTypeTogether(diceObjectWithType1, diceObjectWithType2) {
    if (isObject(diceObjectWithType2)) {
        for (let diceType of Object.keys(diceObjectWithType2)) {
            const diceObject2 = diceObjectWithType2[diceType];
            if (diceType === "") {
                // If blank, try to use the first / main type from what we are adding it to.
                const keys = Object.keys(diceObjectWithType1);
                if (keys.length > 0) {
                    diceType = keys[0];
                }
            }
    
            if (!diceObjectWithType1[diceType]) {
                diceObjectWithType1[diceType] = {};
            }
            diceObjectWithType1[diceType] = addDiceObjectsTogether(diceObjectWithType1[diceType], diceObject2);
        }
    } else if (diceObjectWithType2) {
        // This ain't a dice.
        const diceType = Object.keys(diceObjectWithType1)[0];
        diceObjectWithType1[diceType] = addDiceObjectsTogether(diceObjectWithType1[diceType], diceObjectWithType2);
    }
    return diceObjectWithType1;
}

export function addDiceObjectsTogether(diceObject1, diceObject2) {
    if (Array.isArray(diceObject2)) {
        diceObject1["static"] = concatStringArrayToAndStringWithCommas(diceObject2);
    } else if (isObject(diceObject2)) {
        // The value to add is a die object. Iterate through each of the dice and add them to our totals.
        for (let key of Object.keys(diceObject2)) {
            if (diceObject1[key]) {
                diceObject1[key] += diceObject2[key];
            } else {
                diceObject1[key] = diceObject2[key];
            }
        }
    } else {
        // The value to add is just a numeric value. Add it to the "static" amount.
        if (diceObject1["static"]) {
            diceObject1["static"] += diceObject2;
        } else {
            diceObject1["static"] = diceObject2;
        }
    }
    return diceObject1;
}

export function convertDiceRollWithTypeToValue(diceObjectWithType) {
    let valueToReturn = "";
    for (let diceType of Object.keys(diceObjectWithType)) {
        const diceObject = diceObjectWithType[diceType];
        let value = convertDiceRollToValue(diceObject);
        if (value) {
            if (valueToReturn.length > 0) {
                valueToReturn += " + "
            }

            if (diceType === "") {
                valueToReturn += value;
            } else {
                valueToReturn += (value + " " + diceType)
            }
        }
    }
    return valueToReturn;
}

export function convertDiceRollToValue(diceObject) {
    let diceString = "";
    const diceObjectKeys = Object.keys(diceObject);
    if (diceObjectKeys.length > 0) {
        const sortedDiceObjectKeys = diceObjectKeys.sort((a, b) => {
            const aIsDice = a.startsWith("d");
            const bIsDice = b.startsWith("d");
            if (aIsDice && bIsDice) {
                const aNum = parseInt(a.substring(0));
                const bNum = parseInt(b.substring(0));
                // We want to start with the largest dice first.
                return bNum - aNum;
            } else if (aIsDice) {
                return -1;
            } else {
                return 1;
            }
        });
        for (let diceObjectKey of sortedDiceObjectKeys) {
            const diceObjectValue = diceObject[diceObjectKey];     
            if (diceObjectValue !== 0) {
                let stringToAdd;
                if (diceObjectKey.startsWith("d")) {
                    if (diceObjectValue === 1) {
                        stringToAdd = (diceObjectKey);
                    } else if (diceObjectValue === -1) {
                        stringToAdd = ("-" + diceObjectKey);
                    } else {
                        stringToAdd = (diceObjectValue + diceObjectKey);
                    }
                } else {
                    stringToAdd = diceObjectValue;
                }

                if (diceObjectValue > 0) {
                    diceString += (diceString.length > 0 ? "+" + stringToAdd : stringToAdd);
                } else if (diceObjectValue < 0) {
                    diceString += stringToAdd;
                } else if (diceObjectValue !== 0 && diceObjectValue !== false && diceObjectValue !== undefined && diceObjectValue !== null) {
                    diceString += stringToAdd;
                } // Zero, false, undefined, etc should not be added.
            }
        }
    }
    return diceString;
}

export function performMathCalculation(playerConfigs, calculation, parameters = {}) {
    const doSingleCalculationForSpecialTypes = (singleCalculation) => {
        return 0;
    };
    const performSpecialTransformations = (playerConfigs, singleCalculation, singleValue) => {
        if (singleCalculation.resultNeedsCalculated && singleValue.calculation) {
            singleValue = performMathCalculation(playerConfigs, singleValue.calculation, parameters);
        }

        if (singleCalculation.multiplier) {
            const multiplier = performMathCalculation(playerConfigs, singleCalculation.multiplier, parameters);
            singleValue = multiplier * singleValue;
        }

        if (singleCalculation.dividedBy) {
            const divededBy = performMathCalculation(playerConfigs, singleCalculation.dividedBy, parameters) * 1.0;
            singleValue = singleCalculation.roundUp ? Math.ceil(singleValue / divededBy) : Math.floor(singleValue / divededBy);
        }

        if (singleCalculation.filter) {
            singleValue = singleValue.filter(value => performBooleanCalculation(playerConfigs, singleCalculation.filter, { ...parameters, value }));
        }

        if (singleCalculation.map) {
            singleValue = singleValue.map(value => performMathCalculation(playerConfigs, singleCalculation.map, { ...parameters, value }));
        }

        return singleValue;
    };
    const performAddition = (currentTotal, valueToAdd) => {
        if (!currentTotal) {
            if (isNumeric(valueToAdd)) {
                return parseInt(valueToAdd);
            } else {
                return valueToAdd;
            }
        } else if (isNumeric(valueToAdd)) {
            return currentTotal + parseInt(valueToAdd);
        } else if (Array.isArray(currentTotal) && Array.isArray(valueToAdd)) {
            return [...currentTotal, ...valueToAdd];
        }
        return currentTotal + valueToAdd;
    };

    const shouldBreak = (total) => {
        return false;
    }

    return performCalculation(playerConfigs, calculation, doSingleCalculationForSpecialTypes, performSpecialTransformations, performAddition, shouldBreak, () => { return 0; }, parameters);
}

export function performBooleanCalculation(playerConfigs, calculation, parameters = {}) {
    const doSingleCalculationForSpecialTypes = (singleCalculation) => {
        return false;
    };
    const performSpecialTransformations = (playerConfigs, singleCalculation, singleValue) => {
        if (singleCalculation.resultNeedsCalculated && singleValue.calculation) {
            singleValue = performBooleanCalculation(playerConfigs, singleValue.calculation, parameters);
        }

        if (singleCalculation.equals) {
            const valueToEqual = performMathCalculation(playerConfigs, singleCalculation.equals, parameters);
            const valueToReturn = (singleValue == valueToEqual);
            return valueToReturn;
        }

        if (singleCalculation.notEquals) {
            const valueToEqual = performMathCalculation(playerConfigs, singleCalculation.notEquals, parameters);
            const valueToReturn = (singleValue != valueToEqual);
            return valueToReturn;
        }

        if (singleCalculation.greaterThan) {
            const valueToEqual = performMathCalculation(playerConfigs, singleCalculation.greaterThan, parameters);
            const valueToReturn = (singleValue > valueToEqual);
            return valueToReturn;
        }

        if (singleCalculation.greaterThanOrEqualTo) {
            const valueToEqual = performMathCalculation(playerConfigs, singleCalculation.greaterThanOrEqualTo, parameters);
            const valueToReturn = (singleValue >= valueToEqual);
            return valueToReturn;
        }

        if (singleCalculation.lessThan) {
            const valueToEqual = performMathCalculation(playerConfigs, singleCalculation.lessThan, parameters);
            const valueToReturn = (singleValue < valueToEqual);
            return valueToReturn;
        }

        if (singleCalculation.lessThanOrEqualTo) {
            const valueToEqual = performMathCalculation(playerConfigs, singleCalculation.lessThanOrEqualTo, parameters);
            const valueToReturn = (singleValue <= valueToEqual);
            return valueToReturn;
        }

        if (singleCalculation.includes) {
            if (singleValue) {
                const valueThatShouldBeIncluded = performMathCalculation(playerConfigs, singleCalculation.includes, parameters);
                const valueToReturn = singleValue.includes(valueThatShouldBeIncluded);
                return valueToReturn;
            } else {
                return false;
            }
        }

        if (singleCalculation.notIncludes) {
            if (singleValue) {
                const valueThatShouldBeIncluded = performMathCalculation(playerConfigs, singleCalculation.notIncludes, parameters);
                const valueToReturn = !singleValue.includes(valueThatShouldBeIncluded);
                return valueToReturn;
            } else {
                return true;
            }
        }

        if (singleCalculation.some) {
            if (singleValue) {
                const valueToReturn = singleValue.some(x => {
                    const newParameters = { ...parameters };
                    newParameters[singleCalculation.itemParameterName] = x;
                    const passesCheck = performBooleanCalculation(playerConfigs, singleCalculation.some, newParameters);
                    return passesCheck;
                })
                return valueToReturn;
            } else {
                return false;
            }
        }

        if (singleCalculation.notSome) {
            if (singleValue) {
                const valueToReturn = !singleValue.some(x => {
                    const newParameters = { ...parameters };
                    newParameters[singleCalculation.itemParameterName] = x;
                    const passesCheck = performBooleanCalculation(playerConfigs, singleCalculation.notSome, newParameters);
                    return passesCheck;
                })
                return valueToReturn;
            } else {
                return true;
            }
        }

        return singleValue;
    };
    const performAddition = (currentTotal, valueToAdd) => {
        return currentTotal && valueToAdd;
    };

    const shouldBreak = (total) => {
        return !total;
    }

    return performCalculation(playerConfigs, calculation, doSingleCalculationForSpecialTypes, performSpecialTransformations, performAddition, shouldBreak, () => { return true; }, parameters);
}

function performCalculation(playerConfigs, calculation, doSingleCalculationForSpecialTypes, performSpecialTransformations, performAddition, shouldBreak, getDefaultValue, parameters) {
    let total = getDefaultValue();
    for (let i = 0; i < calculation.length; i++) {
        const singleCalculation = calculation[i];
        let singleValue = doSingleCalculation(playerConfigs, singleCalculation, doSingleCalculationForSpecialTypes, parameters, (innerPlayerConfigs, innerCalc) => performCalculation(innerPlayerConfigs, innerCalc, doSingleCalculationForSpecialTypes, performSpecialTransformations, performAddition, shouldBreak, getDefaultValue, parameters));

        singleValue = performSpecialTransformations(playerConfigs, singleCalculation, singleValue);

        total = performAddition(total, singleValue);

        if (shouldBreak(total)) {
            break;
        }
    }
    return total;
}

function doSingleCalculation(playerConfigs, singleCalculation, performCalculationForSpecialTypes, parameters, performOriginalCalculationType) {
    switch (singleCalculation.type) {
        case "static":
            return singleCalculation.value;
        case "aspect":
            if (playerConfigs) {
                const valueToReturn = calculateAspectCollection(playerConfigs, singleCalculation.value);
                return valueToReturn;
            }
            // If there are no playerconfigs, we can't get any aspects. Don't even try. Just return the default.
            break;
        case "collection":
            return getCollection(singleCalculation.value);
        case "parameter":
            const parameterValue = getValueFromObjectAndPath(parameters, singleCalculation.propertyPath);
            return parameterValue;
        case "config":
            const configValue = getValueFromObjectAndPath(playerConfigs, singleCalculation.propertyPath);
            return configValue;
        case "parentCalculation":
            const parentPlayerConfigs = playerConfigs.parent;
            return performOriginalCalculationType(parentPlayerConfigs, singleCalculation.calculation);
        case "math":
            return performMathCalculation(playerConfigs, singleCalculation.values, parameters);
        case "highestOf":
            let highestValue;
            for (let i = 0; i < singleCalculation.values.length; i++) {
                const singleValue = performMathCalculation(playerConfigs, singleCalculation.values[i], parameters);
                if (i === 0) {
                    highestValue = singleValue;
                } else {
                    if (singleValue > highestValue) {
                        highestValue = singleValue
                    }
                }
            }
            return highestValue;
        case "lowestOf":
            let lowestOf;
            for (let i = 0; i < singleCalculation.values.length; i++) {
                const singleValue = performMathCalculation(playerConfigs, singleCalculation.values[i], parameters);
                if (i === 0) {
                    lowestOf = singleValue;
                } else {
                    if (singleValue < lowestOf) {
                        lowestOf = singleValue
                    }
                }
            }
            return lowestOf;
        case "if-then":
            const ifValue = performBooleanCalculation(playerConfigs, singleCalculation.if, parameters);
            if (ifValue) {
                return performOriginalCalculationType(playerConfigs, singleCalculation.then);
            } else if (singleCalculation.else) {
                return performOriginalCalculationType(playerConfigs, singleCalculation.else);
            }
            // If not true and there is no else, we do not return: the performCalculationForSpecialTypes() will end up getting hit and should return the default value.
            break;
        case "multiple-if":
            if (singleCalculation.cases) {
                for (let singleCaseObject of singleCalculation.cases) {
                    if (!singleCaseObject.if || performBooleanCalculation(playerConfigs, singleCaseObject.if, parameters)) {
                        // If there was no if (aka default), or if the if statement evalutated to true, use the then caluclation. Otherwise, loop to the next case.
                        return performOriginalCalculationType(playerConfigs, singleCaseObject.then);
                    }
                }
            }
            // If there are no cases or it falls all the way through without a default, we do not return: the performCalculationForSpecialTypes() will end up getting hit and should return the default value.
            break;
        case "or":
            for (let i = 0; i < singleCalculation.values.length; i++) {
                const singleValue = performBooleanCalculation(playerConfigs, singleCalculation.values[i], parameters);
                if (singleValue) {
                    return true;
                }
            }
            return false;
    }
    return performCalculationForSpecialTypes(singleCalculation);
}

export function getAllSpellcastingFeatures(playerConfigs) {
    const features = calculateAspectCollection(playerConfigs, "features");
    const spellcastingFeatures = features.filter(object => object.feature.spellcasting);
    return spellcastingFeatures;
}

export function getAllActionFeatures(playerConfigs) {
    const features = calculateAspectCollection(playerConfigs, "features");
    const actionFeatures = features.filter(object => object.feature.actions);
    return actionFeatures;
}

export function getAllConsumableActionItems(playerConfigs) {
    const consumableActionItems = [];
    if (playerConfigs.items && playerConfigs.items.length) {
        const itemName2Item = getNameDictionaryForCollection("items");

        for (let item of playerConfigs.items) {
            let dndItem = itemName2Item[item.name];
            dndItem = getItemFromItemTemplate(dndItem);
            if (doesItemHaveConsumeAction(dndItem)) {
                consumableActionItems.push(item);
            }
        }
    }
    return consumableActionItems;
    
}

export function doesItemHaveConsumeAction(dndItem) {
    return dndItem && dndItem.consumable && dndItem.consumeEffect;
}

export function getAllSelectedMetamagicOptions(playerConfigs) {
    let allMetamagicOptions = [];
    findAllConfiguredAspects(playerConfigs, "metamagic", [], (aspectPlayerConfigs, parentAspect, typeFoundOn, playerConfigForObject) => {
        if (playerConfigForObject) {
            if (Array.isArray(playerConfigForObject.metamagic)) {
                allMetamagicOptions = [...allMetamagicOptions, ...playerConfigForObject.metamagic];
            } else {
                allMetamagicOptions.push(playerConfigForObject.metamagic);
            }
        }
    });
    return allMetamagicOptions;
}

export function getAllSpells(playerConfigs, spellcastingFeatures) {
    // Get all spells and cantrips built into dictionaries for instant lookup.
    const cantripName2Cantrip  = getNameDictionaryForCollection("cantrips");
    const spellName2Spell = getNameDictionaryForCollection("spells");

    // Get each of the features with the same spellcasting modifiers together.
    const sortedCantripsCollection = [];
    const sortedSpellsCollection = [];
    for (let spellcastingFeature of spellcastingFeatures) {
        const spellcasting = spellcastingFeature.feature.spellcasting;
        if (spellcasting.cantripsKnown) {
            if (spellcasting.cantripsKnown.predeterminedSelections && spellcasting.cantripsKnown.predeterminedSelections.length > 0) {
                for (let predeterminedSelection of spellcasting.cantripsKnown.predeterminedSelections) {
                    const cantripToAdd = {...cantripName2Cantrip[predeterminedSelection.spellName]};
                    cantripToAdd.feature = spellcastingFeature.feature;
                    addSpellToSortedCollection(sortedCantripsCollection, cantripToAdd);
                }
            }

            const featurePropertyName = spellcastingFeature.feature.name.replace(/\s/g, "") + (spellcastingFeature.feature.level ?? spellcastingFeature.feature.classLevel ?? "");
            const userInputForSpells = spellcastingFeature.playerConfigForObject.features ? spellcastingFeature.playerConfigForObject.features[featurePropertyName] : undefined;
            if (userInputForSpells && userInputForSpells.cantrips) {
                for (let cantripName of userInputForSpells.cantrips) {
                    if (cantripName) {
                        const cantripToAdd = {...cantripName2Cantrip[cantripName]};
                        cantripToAdd.feature = spellcastingFeature.feature;
                        addSpellToSortedCollection(sortedCantripsCollection, cantripToAdd);
                    }
                }
            }
        }

        if (spellcasting.spellsKnown) {
            if (spellcasting.spellsKnown.predeterminedSelections && spellcasting.spellsKnown.predeterminedSelections.length > 0) {
                for (let predeterminedSelection of spellcasting.spellsKnown.predeterminedSelections) {
                    // Check that the spell exists before adding it.
                    if (spellName2Spell[predeterminedSelection.spellName]) {
                        const spellToAdd = {...spellName2Spell[predeterminedSelection.spellName]};
                        spellToAdd.feature = spellcastingFeature.feature;
                        if (predeterminedSelection.freeUses) {
                            if (predeterminedSelection.freeUses.calculation) {
                                spellToAdd.freeUses = performMathCalculation(playerConfigs, predeterminedSelection.freeUses.calculation);
                            } else if (predeterminedSelection.freeUses > 0) {
                                spellToAdd.freeUses = predeterminedSelection.freeUses;
                            }
                        }
                        addSpellToSortedCollection(sortedSpellsCollection, spellToAdd);
                    }
                }
            }

            const featurePropertyName = spellcastingFeature.feature.name.replace(/\s/g, "") + (spellcastingFeature.feature.level ?? spellcastingFeature.feature.classLevel ?? "");
            const userInputForSpells = spellcastingFeature.playerConfigForObject.features ? spellcastingFeature.playerConfigForObject.features[featurePropertyName] : undefined;
            if (userInputForSpells && userInputForSpells.spells) {
                for (let spellName of userInputForSpells.spells) {
                    if (spellName) {
                        const spellToAdd = {...spellName2Spell[spellName]};
                        spellToAdd.feature = spellcastingFeature.feature;
                        if (spellcasting.spellsKnown.freeUses) {
                            if (spellcasting.spellsKnown.freeUses.calculation) {
                                spellToAdd.freeUses = performMathCalculation(playerConfigs, spellcasting.spellsKnown.freeUses.calculation);
                            } else if (spellcasting.spellsKnown.freeUses > 0) {
                                spellToAdd.freeUses = spellcasting.spellsKnown.freeUses;
                            }
                        }
                        addSpellToSortedCollection(sortedSpellsCollection, spellToAdd);
                    }
                }
            }
        }
    }

    const allPlayerSpells = sortedCantripsCollection.concat(sortedSpellsCollection);
    return allPlayerSpells;
}

function addSpellToSortedCollection(sortedSpellsCollection, spellToAdd) {
    let insertAtIndex = -1;
    for (let i = 0; i < sortedSpellsCollection.length; i++) {
        const spellInIndex = sortedSpellsCollection[i];
        if (spellToAdd.level !== spellInIndex.level) {
            if (spellToAdd.level < spellInIndex.level) {
                insertAtIndex = i;
                break;
            } else {
                // Keep going, our level is too low.
                continue;
            }
        }

        if (spellToAdd.name.localeCompare(spellInIndex.name) <= 0) {
            insertAtIndex = i;
            break;
        }
    }

    if (insertAtIndex === -1) {
        sortedSpellsCollection.push(spellToAdd);
    } else {
        sortedSpellsCollection.splice(insertAtIndex, 0, spellToAdd);
    }
}

export function getItemFromItemTemplate(originalDndItem, itemName2Item = undefined) {
    if (!itemName2Item && originalDndItem && originalDndItem.type === "Template") {
        itemName2Item = getNameDictionaryForCollection("items");
    }

    let dndItem = originalDndItem;
    if (dndItem) {
        while (dndItem.type === "Template") {
            const itemName = dndItem.templateOf;
            let newItem = {...itemName2Item[itemName]};
            for (let itemProperty of Object.keys(dndItem)) {
                if (itemProperty !== "type" && itemProperty !== "templateOf") {
                    // Override using the properties of the template.
                    newItem[itemProperty] = originalDndItem[itemProperty];
                }
            }
            dndItem = newItem;
        }
        return dndItem;
    }
    return undefined;
}

export function findResource(playerConfigs, resourceSource, typeForResource, playerConfigsForResource, resourceName) {
    let resourceSourceResources = undefined;
    if (resourceSource.resources) {
        resourceSourceResources = resourceSource.resources;
    }

    if (resourceSource.aspects?.resources) {
        resourceSourceResources = resourceSource.aspects.resources;
    }

    for (let originalResource of resourceSourceResources) {

        if (originalResource.name === resourceName) {
            if (originalResource.combineGlobalResources) {
                return generateGlobalResourceFromResource(playerConfigs, originalResource, typeForResource, playerConfigsForResource);
            } else {
                return generateStandardResourceFromResource(playerConfigs, originalResource, typeForResource, playerConfigsForResource);
            }
        }

        if (originalResource.combineGlobalResources && (originalResource.name + originalResource.subName) === resourceName) {
            return generateStandardResourceFromResource(playerConfigs, originalResource, typeForResource, playerConfigsForResource);
        }
    }
}

export function findResourceFromAllResources(playerConfigs, resourceName) {
    let resourceToFind = undefined;
    findAllConfiguredAspects(playerConfigs, "resources", [], (aspectPlayerConfigs, aspectValue, typeFoundOn, playerConfigForObject) => {
        if (Array.isArray(aspectValue)) {
            for (let singleResource of aspectValue) {
                if (!resourceToFind) {
                    if (singleResource.name === resourceName) {
                        if (singleResource.combineGlobalResources) {
                            resourceToFind = generateGlobalResourceFromResource(playerConfigs, singleResource, typeFoundOn, playerConfigForObject);
                        } else {
                            resourceToFind = generateStandardResourceFromResource(playerConfigs, singleResource, typeFoundOn, playerConfigForObject);
                        }
                    }

                    if (singleResource.combineGlobalResources && (singleResource.name + singleResource.subName) === resourceName) {
                        resourceToFind = generateStandardResourceFromResource(playerConfigs, singleResource, typeFoundOn, playerConfigForObject);
                    }
                }
            }
        }
    });
    return resourceToFind;
}

export function getAllStandardResourcesForObject(playerConfigs, resourceSource, typeForResource, playerConfigsForResource) {
    let resourceSourceResources = undefined;
    if (resourceSource.resources) {
        resourceSourceResources = resourceSource.resources;
    }

    if (resourceSource.aspects?.resources) {
        resourceSourceResources = resourceSource.aspects.resources;
    }

    const allResources = [];

    for (let originalResource of resourceSourceResources) {
        allResources.push(generateStandardResourceFromResource(playerConfigs, originalResource, typeForResource, playerConfigsForResource));
    }
    return allResources;
}

export function getAllStandardResourcesForCharacter(playerConfigs) {
    const allResources = [];
    findAllConfiguredAspects(playerConfigs, "resources", [], (aspectPlayerConfigs, aspectValue, typeFoundOn, playerConfigForObject) => {
        if (Array.isArray(aspectValue)) {
            for (let singleResource of aspectValue) {
                const resourceToAdd = generateStandardResourceFromResource(playerConfigs, singleResource, typeFoundOn, playerConfigForObject);
                allResources.push(resourceToAdd);
            }
        }
    });
    return allResources;
}

function generateStandardResourceFromResource(playerConfigs, originalResource, typeForResource, playerConfigsForResource) {
    let newResource = {...originalResource};

    if (originalResource.combineGlobalResources) {
        newResource.name = originalResource.name + originalResource.subName;
        newResource.displayName = originalResource.subDisplayName + " " + originalResource.displayName;

        delete newResource.combineGlobalResources;
    }

    generateNewUsesCalculationIfNotPresent(newResource);
    addResourcesForLevelToUses(newResource.uses.calculation, playerConfigs, originalResource, typeForResource, playerConfigsForResource);

    newResource.maxUses = GetMaxUsesForResource(playerConfigs, newResource, playerConfigsForResource);
    newResource.remainingUses = GetRemainingUsesForResource(playerConfigs, newResource);

    return newResource;
}

function generateGlobalResourceFromResource(playerConfigs, originalResource, typeForResource, playerConfigsForResource) {
    let newResource = {...originalResource};

    delete newResource.subName;
    delete newResource.subDisplayName;

    generateNewUsesCalculationIfNotPresent(newResource);
    addResourcesForLevelToUses(newResource.uses.calculation, playerConfigs, originalResource, typeForResource, playerConfigsForResource);

    newResource.subResources = [{ subName: originalResource.subName, maxCalculation: [...newResource.uses.calculation] }];
    
    findAllConfiguredAspects(playerConfigs, "resources", [], (aspectPlayerConfigs, aspectValue, typeFoundOn, playerConfigForObject) => {
        if (Array.isArray(aspectValue)) {
            for (let innerResource of aspectValue) {
                if (innerResource.combineGlobalResources && originalResource.name === innerResource.name && originalResource.subName !== innerResource.subName) {
                    let innerResourceUsesCalculation = [];
                    if (innerResource?.uses?.calculation) {
                        innerResourceUsesCalculation = [...innerResource.uses.calculation];
                    }

                    addResourcesForLevelToUses(innerResourceUsesCalculation, playerConfigs, originalResource, typeFoundOn, playerConfigForObject);

                    newResource.uses.calculation = [...newResource.uses.calculation, ...innerResourceUsesCalculation];

                    let innerSubResource = { subName: innerResource.subName, maxCalculation: innerResourceUsesCalculation };
                    if (typeFoundOn === "class" || typeFoundOn === "subclass") {
                        // Resources that come from a class or subclass should move to the top of the sublist so that they are restored first (and expended last).
                        newResource.subResources.splice(0, 0, innerSubResource);
                    } else {
                        newResource.subResources.push(innerSubResource);
                    }
                }
            }
        }
    });

    newResource.maxUses = GetMaxUsesForResource(playerConfigs, newResource, playerConfigsForResource);
    newResource.remainingUses = GetRemainingUsesForResource(playerConfigs, newResource);

    return newResource;
}

function generateNewUsesCalculationIfNotPresent(newResource) {
    if (!newResource.uses || !newResource.uses.calculation) {
        newResource.uses = {
            calculation: []
        };
    }
}

function addResourcesForLevelToUses(calculationArray, playerConfigs, originalResource, typeForResource, playerConfigsForResource) {
    switch (typeForResource) {
        case "class":
            const allClassesMap = getNameDictionaryForCollection("classes");
            const dndClass = allClassesMap[playerConfigsForResource.name];
            if (dndClass.resourcesPerLevel) {
                const levels = playerConfigsForResource.levels;
                const resourcesPerLevel = dndClass.resourcesPerLevel[levels - 1];
                calculationArray.push({
                    type: "static",
                    value: resourcesPerLevel[originalResource.name]
                });
            }
            break;
    }
}