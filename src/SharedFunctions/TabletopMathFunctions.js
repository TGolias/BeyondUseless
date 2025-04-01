import { getCollection } from "../Collections";
import { convertNumberToSize, convertSizeToNumber, getCapitalizedAbilityScoreName, getValueFromObjectAndPath } from "./ComponentFunctions";
import { GetHeldItems } from "./EquipmentFunctions";
import { concatStringArrayToAndStringWithCommas, concatStringArrayToOrStringWithCommas, convertArrayOfStringsToHashMap, convertArrayToDictionary, convertHashMapToArrayOfStrings, isNumeric, isObject } from "./Utils";

export function calculateProficiencyBonus(playerConfigs) {
    let proficiencyBonusOverride = undefined
    findAllConfiguredAspects(playerConfigs, "proficiencyBonusOverride", (aspectValue, typeFoundOn, playerConfigForObject) => {
        if (aspectValue.calculation) {
            proficiencyBonusOverride = performMathCalculation(playerConfigs, aspectValue.calculation, { playerConfigForObject });
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
    findAllConfiguredAspects(playerConfigs, "armorClass", (aspectValue, typeFoundOn, playerConfigForObject) => {
        let newArmorClass;
        if (aspectValue.calculation) {
            newArmorClass = performMathCalculation(playerConfigs, aspectValue.calculation, { playerConfigForObject });
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
    findAllConfiguredAspects(playerConfigs, "armorClassBonus", (aspectValue, typeFoundOn, playerConfigForObject) => {
        let armorClassBonus;
        if (aspectValue.calculation) {
            armorClassBonus = performDiceRollCalculation(playerConfigs, aspectValue.calculation, { playerConfigForObject });
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

    // Now that we are using the highest AC calculation, check for any other AC bonuses and add them to the score.
    findAllConfiguredAspects(playerConfigs, "initiativeBonus", (aspectValue, typeFoundOn, playerConfigForObject) => {
        let initiativeBonus;
        if (aspectValue.calculation) {
            initiativeBonus = performDiceRollCalculation(playerConfigs, aspectValue.calculation, { playerConfigForObject });
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

    findAllConfiguredAspects(playerConfigs, "size", (aspectValue, typeFoundOn, playerConfigForObject) => {
        size = aspectValue;
    });

    findAllConfiguredAspects(playerConfigs, "sizeBonus", (aspectValue, typeFoundOn, playerConfigForObject) => {
        let sizeBonus;
        if (aspectValue.calculation) {
            sizeBonus = performMathCalculation(playerConfigs, aspectValue.calculation, { playerConfigForObject });
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
    const size = calculateSize(playerConfigs);
    const multiplier = carryDragLifePushMultiplierForSizes[size].carryMultiplier;
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

export function currentWeightCarried(playerConfigs) {
    let weightCarried = 0;
    if (playerConfigs.items) {
        // Check equipped items for the aspect.
        const items = getCollection("items");
        // Convert to a dictionary for quick searches because the list could be LONG.
        const itemsDictionary = convertArrayToDictionary(items, "name");
        for (let item of playerConfigs.items) {
            const dndItem = getItemFromItemTemplate(itemsDictionary[item.name], itemsDictionary);
            if (dndItem && dndItem.weight) {
                weightCarried += dndItem.weight;
            }
        }
    }
    return weightCarried;
}

export function calculateSpeed(playerConfigs) {
    // Start with 0, lol. All races have a base speed set, and if we end up seeing 0 in the UI, we'll know something is wrong for sure.
    let startingSpeed = 0;

    // There might be multiple speeds between the species / subspecies, override with whatever we see is the highest.
    findAllConfiguredAspects(playerConfigs, "speed", (aspectValue, typeFoundOn, playerConfigForObject) => {
        let newSpeed;
        if (aspectValue.calculation) {
            newSpeed = performMathCalculation(playerConfigs, aspectValue.calculation, { playerConfigForObject });
        } else {
            newSpeed = aspectValue;
        }

        if (newSpeed > startingSpeed) {
            startingSpeed = newSpeed;
        }
    });

    let speed = createDiceObjectWithType({});
    speed = addDiceObjectsWithTypeTogether(speed, startingSpeed);

    findAllConfiguredAspects(playerConfigs, "speedBonus", (aspectValue, typeFoundOn, playerConfigForObject) => {
        let speedBonus;
        if (aspectValue.calculation) {
            speedBonus = performDiceRollCalculation(playerConfigs, aspectValue.calculation, { playerConfigForObject });
        } else {
            speedBonus = aspectValue;
        }
        speed = addDiceObjectsWithTypeTogether(speed, speedBonus);
    });

    findAllConfiguredAspects(playerConfigs, "forcedSpeed", (aspectValue, typeFoundOn, playerConfigForObject) => {
        let forcedSpeed;
        if (aspectValue.calculation) {
            forcedSpeed = performMathCalculation(playerConfigs, aspectValue.calculation, { playerConfigForObject });
        } else {
            forcedSpeed = aspectValue;
        }

        // The speed is being forced to this value.
        speed = addDiceObjectsWithTypeTogether(createDiceObjectWithType({}), forcedSpeed);
    });

    findAllConfiguredAspects(playerConfigs, "speedMultiplier", (aspectValue, typeFoundOn, playerConfigForObject) => {
        let speedMultiplier;
        if (aspectValue.calculation) {
            speedMultiplier = performMathCalculation(playerConfigs, aspectValue.calculation, { playerConfigForObject });
        } else {
            speedMultiplier = aspectValue;
        }
        speed = multiplyDiceObjectsWithTypeByMultiplier(speed, speedMultiplier);
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

export function calculateHPMax(playerConfigs) {
    const dndClasses = getAllPlayerDNDClasses(playerConfigs);

    let extraHPPerLVL = 0;
    findAllConfiguredAspects(playerConfigs, "hpPerLVL", (hpPerLVL, typeFoundOn, foundObject) => {
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

    findAllConfiguredAspects(playerConfigs, "maxHpBonus", (aspectValue, typeFoundOn, playerConfigForObject) => {
        let maxHpBonus;
        if (aspectValue.calculation) {
            maxHpBonus = performMathCalculation(playerConfigs, aspectValue.calculation, { playerConfigForObject });
        } else {
            maxHpBonus = aspectValue;
        }

        maxHpSoFar += maxHpBonus;
    });

    findAllConfiguredAspects(playerConfigs, "maxHpOverride", (aspectValue, typeFoundOn, playerConfigForObject) => {
        let maxHpOverride;
        if (aspectValue.calculation) {
            maxHpOverride = performMathCalculation(playerConfigs, aspectValue.calculation, { playerConfigForObject });
        } else {
            maxHpOverride = aspectValue;
        }

        // The hp is being overridden to this value.
        maxHpSoFar = maxHpOverride;
    });

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

    findAllConfiguredAspects(playerConfigs, statToCalculate, (aspectValue, typeFoundOn, playerConfigForObject) => {
        baseStatValue += aspectValue;
    });

    // See if there are any overrides that are higher without it.
    const overrideStatAspectName = statToCalculate + "Override";
    findAllConfiguredAspects(playerConfigs, overrideStatAspectName, (aspectValue, typeFoundOn, playerConfigForObject) => {
        if (baseStatValue < aspectValue) {
            // If the override is higher than the stat without the override, set that to the new value.
            baseStatValue = aspectValue;
        }
    });

    return baseStatValue;
}

export function calculateSkillProficiency(playerConfigs, skillProficiencyName) {
    const dndSkillProficiencies = getCollection("skillProficiencies");
    const dndSkillProficiency = dndSkillProficiencies.find(prof => prof.name === skillProficiencyName);

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

    findAllConfiguredAspects(playerConfigs, "skillProficiency" + dndSkillProficiency.name + "Bonus", (aspectValue, typeFoundOn, playerConfigForObject) => {
        let skillProficiencyBonus;
        if (aspectValue.calculation) {
            skillProficiencyBonus = performDiceRollCalculation(playerConfigs, aspectValue.calculation, { playerConfigForObject });
        } else {
            skillProficiencyBonus = aspectValue;
        }
        skillBonus = addDiceObjectsWithTypeTogether(skillBonus, skillProficiencyBonus);
    });

    findAllConfiguredAspects(playerConfigs, "skillProficiencyAllBonus", (aspectValue, typeFoundOn, playerConfigForObject) => {
        let skillProficiencyBonus;
        if (aspectValue.calculation) {
            skillProficiencyBonus = performDiceRollCalculation(playerConfigs, aspectValue.calculation, { playerConfigForObject });
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

    findAllConfiguredAspects(playerConfigs, modifier + "SavingThrowBonus", (aspectValue, typeFoundOn, playerConfigForObject) => {
        let savingThrowBonus;
        if (aspectValue.calculation) {
            savingThrowBonus = performDiceRollCalculation(playerConfigs, aspectValue.calculation, { playerConfigForObject });
        } else {
            savingThrowBonus = aspectValue;
        }
        savingThrow = addDiceObjectsWithTypeTogether(savingThrow, savingThrowBonus);
    });

    findAllConfiguredAspects(playerConfigs, "allSavingThrowBonus", (aspectValue, typeFoundOn, playerConfigForObject) => {
        let savingThrowBonus;
        if (aspectValue.calculation) {
            savingThrowBonus = performDiceRollCalculation(playerConfigs, aspectValue.calculation, { playerConfigForObject });
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

export function calculateUnarmedAttackBonus(playerConfigs) {
    let attackBonus = createDiceObjectWithType({});

    let highestValidAbility = undefined;
    let highestValidAbilityModifier = undefined;

    let strengthModifier = calculateAspectCollection(playerConfigs, "strengthModifier");
    highestValidAbility = "strength";
    highestValidAbilityModifier = strengthModifier;

    findAllConfiguredAspects(playerConfigs, "alternateUnarmedAttackModifier", (aspectValue, typeFoundOn, playerConfigForObject) => {
        if (aspectValue.conditon) {
            const conditionsAreMet = performBooleanCalculation(playerConfigs, aspectValue.conditon, { playerConfigForObject });
            if (!conditionsAreMet) {
                // We did not meet the conditions for this alternate modifier to apply.
                return;
            }
        }

        let modifierName;
        if (aspectValue.calculation) {
            modifierName = performMathCalculation(playerConfigs, aspectValue.calculation, { playerConfigForObject });
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
    findAllConfiguredAspects(playerConfigs, "unarmedAttackBonus", (aspectValue, typeFoundOn, playerConfigForObject) => {
        if (aspectValue.conditions) {
            const conditionsAreMet = performBooleanCalculation(playerConfigs, aspectValue.conditions, { attackAbility: highestValidAbility, attackAbilityModifier: highestValidAbilityModifier, playerConfigForObject });
            if (!conditionsAreMet) {
                // We did not meet the conditions for this bonus to apply.
                return;
            }
        }

        let unarmedAttackBonus;
        if (aspectValue.calculation) {
            unarmedAttackBonus = performDiceRollCalculation(playerConfigs, aspectValue.calculation, { attackAbility: highestValidAbility, attackAbilityModifier: highestValidAbilityModifier, playerConfigForObject });
        } else {
            unarmedAttackBonus = aspectValue;
        }

        attackBonus = addDiceObjectsWithTypeTogether(attackBonus, unarmedAttackBonus);
    });

    findAllConfiguredAspects(playerConfigs, "allAttackBonus", (aspectValue, typeFoundOn, playerConfigForObject) => {
        if (aspectValue.conditions) {
            const conditionsAreMet = performBooleanCalculation(playerConfigs, aspectValue.conditions, { attackAbility: highestValidAbility, attackAbilityModifier: highestValidAbilityModifier });
            if (!conditionsAreMet) {
                // We did not meet the conditions for this bonus to apply.
                return;
            }
        }

        let allAttackBonus;
        if (aspectValue.calculation) {
            allAttackBonus = performDiceRollCalculation(playerConfigs, aspectValue.calculation, { attackAbility: highestValidAbility, attackAbilityModifier: highestValidAbilityModifier, playerConfigForObject });
        } else {
            allAttackBonus = aspectValue
        }

        attackBonus = addDiceObjectsWithTypeTogether(attackBonus, allAttackBonus);
    });

    let amount = convertDiceRollWithTypeToValue(attackBonus);
    if (!amount) {
        amount = "0";
    }
    let addendum = calculateAddendumAspects(playerConfigs, ["unarmedAttackAddendum", "allAttackAddendum"], { attackAbility: highestValidAbility, attackAbilityModifier: highestValidAbilityModifier });

    return { amount, addendum };
}

export function calculateUnarmedDamage(playerConfigs) {
    // By default the unarmed attack base is 1.
    let highestUnarmedAverage = 1;
    let highestUnarmedAttack = createDiceObjectWithType({ static: 1 }, "Bludgeoning");

    findAllConfiguredAspects(playerConfigs, "alternateUnarmedDamageCalculation", (aspectValue, typeFoundOn, playerConfigForObject) => {
        if (aspectValue.conditon) {
            const conditionsAreMet = performBooleanCalculation(playerConfigs, aspectValue.conditon);
            if (!conditionsAreMet) {
                // We did not meet the conditions for this alternate modifier to apply.
                return;
            }
        }

        // This is a pain, we have to check the dies in the alternate calculations and see what is the highest. Long term, I should probably just show all calculations though.
        if (aspectValue.calculation && aspectValue.calculation.length > 0) {
            let alternateUnarmedAttackDamageCalculation = performDiceRollCalculation(playerConfigs, aspectValue.calculation, { playerConfigForObject });
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

    findAllConfiguredAspects(playerConfigs, "alternateUnarmedDamageModifier", (aspectValue, typeFoundOn, playerConfigForObject) => {
        if (aspectValue.conditon) {
            const conditionsAreMet = performBooleanCalculation(playerConfigs, aspectValue.conditon, { playerConfigForObject });
            if (!conditionsAreMet) {
                // We did not meet the conditions for this alternate modifier to apply.
                return;
            }
        }

        let modifierName;
        if (aspectValue.calculation) {
            modifierName = performMathCalculation(playerConfigs, aspectValue.calculation);
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
    findAllConfiguredAspects(playerConfigs, "unarmedDamageBonus", (aspectValue, typeFoundOn, playerConfigForObject) => {
        if (aspectValue.conditon) {
            const conditionsAreMet = performBooleanCalculation(playerConfigs, aspectValue.conditon, { attackAbility: highestValidAbility, attackAbilityModifier: highestValidAbilityModifier, playerConfigForObject });
            if (!conditionsAreMet) {
                // We did not meet the conditions for this bonus to apply.
                return;
            }
        }

        let unarmedDamageBonus;
        if (aspectValue.calculation) {
            unarmedDamageBonus = performDiceRollCalculation(playerConfigs, aspectValue.calculation, { attackAbility: highestValidAbility, attackAbilityModifier: highestValidAbilityModifier, playerConfigForObject });
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

    findAllConfiguredAspects(playerConfigs, "alternateUnarmedAttackModifier", (aspectValue, typeFoundOn, playerConfigForObject) => {
        if (aspectValue.conditon) {
            const conditionsAreMet = performBooleanCalculation(playerConfigs, aspectValue.conditon, { playerConfigForObject });
            if (!conditionsAreMet) {
                // We did not meet the conditions for this alternate modifier to apply.
                return;
            }
        }

        let modifierName;
        if (aspectValue.calculation) {
            modifierName = performMathCalculation(playerConfigs, aspectValue.calculation, { playerConfigForObject });
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
    findAllConfiguredAspects(playerConfigs, "unarmedDCBonus", (aspectValue, typeFoundOn, playerConfigForObject) => {
        if (aspectValue.conditions) {
            const conditionsAreMet = performBooleanCalculation(playerConfigs, aspectValue.conditions, { attackAbility: highestValidAbility, attackAbilityModifier: highestValidAbilityModifier, playerConfigForObject });
            if (!conditionsAreMet) {
                // We did not meet the conditions for this bonus to apply.
                return;
            }
        }

        let unarmedDCBonus;
        if (aspectValue.calculation) {
            unarmedDCBonus = performDiceRollCalculation(playerConfigs, aspectValue.calculation, { attackAbility: highestValidAbility, attackAbilityModifier: highestValidAbilityModifier, playerConfigForObject });
        } else {
            unarmedDCBonus = aspectValue;
        }
        unarmedDC = addDiceObjectsWithTypeTogether(unarmedDC, unarmedDCBonus);
    });

    let dc = convertDiceRollWithTypeToValue(unarmedDC);
    if (!dc) {
        dc = "0";
    }
    const addendum = calculateAddendumAspect(playerConfigs, "unarmedDCAddendum", { attackAbility: highestValidAbility, attackAbilityModifier: highestValidAbilityModifier });

    return { dc, addendum };
}

export function calculateWeaponAttackBonus(playerConfigs, weapon, isThrown) {
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

    findAllConfiguredAspects(playerConfigs, "alternateWeaponAttackModifier", (aspectValue, typeFoundOn, playerConfigForObject) => {
        if (aspectValue.conditon) {
            const conditionsAreMet = performBooleanCalculation(playerConfigs, aspectValue.conditon, { weapon, isThrown });
            if (!conditionsAreMet) {
                // We did not meet the conditions for this alternate modifier to apply.
                return;
            }
        }

        let modifierName;
        if (aspectValue.calculation) {
            modifierName = performMathCalculation(playerConfigs, aspectValue.calculation, { weapon, isThrown });
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
    findAllConfiguredAspects(playerConfigs, "weaponAttackBonus", (aspectValue, typeFoundOn, playerConfigForObject) => {
        if (aspectValue.conditions) {
            const conditionsAreMet = performBooleanCalculation(playerConfigs, aspectValue.conditions, { weapon, isThrown, attackAbility: highestValidAbility, attackAbilityModifier: highestValidAbilityModifier, playerConfigForObject });
            if (!conditionsAreMet) {
                // We did not meet the conditions for this bonus to apply.
                return;
            }
        }

        let weaponAttackBonus;
        if (aspectValue.calculation) {
            weaponAttackBonus = performDiceRollCalculation(playerConfigs, aspectValue.calculation, { weapon, isThrown, attackAbility: highestValidAbility, attackAbilityModifier: highestValidAbilityModifier, playerConfigForObject });
        } else {
            weaponAttackBonus = aspectValue;
        }
        attackBonus = addDiceObjectsWithTypeTogether(attackBonus, weaponAttackBonus);
    });

    findAllConfiguredAspects(playerConfigs, "allAttackBonus", (aspectValue, typeFoundOn, playerConfigForObject) => {
        if (aspectValue.conditions) {
            const conditionsAreMet = performBooleanCalculation(playerConfigs, aspectValue.conditions, { weapon, isThrown, attackAbility: highestValidAbility, attackAbilityModifier: highestValidAbilityModifier, playerConfigForObject });
            if (!conditionsAreMet) {
                // We did not meet the conditions for this bonus to apply.
                return;
            }
        }

        let allAttackBonus;
        if (aspectValue.calculation) {
            allAttackBonus = performDiceRollCalculation(playerConfigs, aspectValue.calculation, { weapon, isThrown, attackAbility: highestValidAbility, attackAbilityModifier: highestValidAbilityModifier, playerConfigForObject });
        } else {
            allAttackBonus = aspectValue;
        }
        attackBonus = addDiceObjectsWithTypeTogether(attackBonus, allAttackBonus);
    });

    let amount = convertDiceRollWithTypeToValue(attackBonus);
    if (!amount) {
        amount = "0";
    }
    let addendum = calculateAddendumAspects(playerConfigs, ["weaponAttackAddendum", "allAttackAddendum"], { weapon, isThrown, attackAbility: highestValidAbility, attackAbilityModifier: highestValidAbilityModifier });

    if (weapon.properties) {
        const allProperties = getCollection("properties");
        const propertiesMap = convertArrayToDictionary(allProperties, "name");
        for (let property of weapon.properties) {
            const stringSplit = property.split(" ");
            const firstString = stringSplit[0];

            const dndProperty = propertiesMap[firstString]
            if (dndProperty && dndProperty.weaponAttackAddendum) {
                const propertyString = performMathCalculation(playerConfigs, dndProperty.weaponAttackAddendum.calculation, { weapon, isThrown, attackAbility: highestValidAbility, attackAbilityModifier: highestValidAbilityModifier, propertyStrings: stringSplit });
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
            const allMasteries = getCollection("masteries");
            const dndMastery = allMasteries.find(mastery => mastery.name === weapon.mastery);

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
        const allMisc = getCollection("misc");
        const rangedMisc = allMisc.find(misc => misc.name === "Ranged");

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

export function calculateWeaponDamage(playerConfigs, weapon, isThrown, isExtraLightAttack, isExtraCleaveAttack) {
    let damage = undefined;
    if (weapon.properties && weapon.properties.includes("Versatile")) {
        // Check if they can actually two-hand the weapon.
        const heldItems = GetHeldItems(playerConfigs.items);
        if (heldItems.length === 1 && heldItems[0].name === weapon.name) {

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

    findAllConfiguredAspects(playerConfigs, "alternateWeaponDamageModifier", (aspectValue, typeFoundOn, playerConfigForObject) => {
        if (aspectValue.conditon) {
            const conditionsAreMet = performBooleanCalculation(playerConfigs, aspectValue.conditon, { weapon, isThrown });
            if (!conditionsAreMet) {
                // We did not meet the conditions for this alternate modifier to apply.
                return;
            }
        }

        let modifierName;
        if (aspectValue.calculation) {
            modifierName = performMathCalculation(playerConfigs, aspectValue.calculation, { weapon, isThrown });
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
    findAllConfiguredAspects(playerConfigs, "weaponDamageBonus", (aspectValue, typeFoundOn, playerConfigForObject) => {
        if (aspectValue.conditon) {
            const conditionsAreMet = performBooleanCalculation(playerConfigs, aspectValue.conditon, { weapon, isThrown, isExtraLightAttack, isExtraCleaveAttack, attackAbility: highestValidAbility, attackAbilityModifier: highestValidAbilityModifier, playerConfigForObject });
            if (!conditionsAreMet) {
                // We did not meet the conditions for this bonus to apply.
                return;
            }
        }

        let weaponDamageBonus;
        if (aspectValue.calculation) {
            weaponDamageBonus = performDiceRollCalculation(playerConfigs, aspectValue.calculation, { weapon, isThrown, isExtraLightAttack, isExtraCleaveAttack, attackAbility: highestValidAbility, attackAbilityModifier: highestValidAbilityModifier, playerConfigForObject });
        } else {
            weaponDamageBonus = aspectValue;
        }
        damage = addDiceObjectsWithTypeTogether(damage, weaponDamageBonus);
    });

    const finalDamage = convertDiceRollWithTypeToValue(damage);
    if (!finalDamage) {
        return 0;
    }
    return finalDamage;
}

export function calculateSpellAttack(playerConfigs, spell, slotLevel) {
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
    findAllConfiguredAspects(playerConfigsToUse, "spellAttackBonus", (aspectValue, typeFoundOn, playerConfigForObject) => {
        if (aspectValue.conditions) {
            const conditionsAreMet = performBooleanCalculation(playerConfigsToUse, aspectValue.conditions, { spell: spellToUse, spellcastingAbility, spellcastingAbilityModifier, slotLevel, playerConfigForObject });
            if (!conditionsAreMet) {
                // We did not meet the conditions for this bonus to apply.
                return;
            }
        }

        let spellAttackBonus;
        if (aspectValue.calculation) {
            spellAttackBonus = performDiceRollCalculation(playerConfigsToUse, aspectValue.calculation, { spell: spellToUse, spellcastingAbility, spellcastingAbilityModifier, slotLevel, playerConfigForObject });
        } else {
            spellAttackBonus = aspectValue;
        }
        attackBonus = addDiceObjectsWithTypeTogether(attackBonus, spellAttackBonus);
    });

    findAllConfiguredAspects(playerConfigsToUse, "allAttackBonus", (aspectValue, typeFoundOn, playerConfigForObject) => {
        if (aspectValue.conditions) {
            const conditionsAreMet = performBooleanCalculation(playerConfigsToUse, aspectValue.conditions, { spell: spellToUse, spellcastingAbility, spellcastingAbilityModifier, slotLevel });
            if (!conditionsAreMet) {
                // We did not meet the conditions for this bonus to apply.
                return;
            }
        }

        let allAttackBonus;
        if (aspectValue.calculation) {
            allAttackBonus = performDiceRollCalculation(playerConfigsToUse, aspectValue.calculation, { spell: spellToUse, spellcastingAbility, spellcastingAbilityModifier, slotLevel, playerConfigForObject });
        } else {
            allAttackBonus = aspectValue;
        }
        attackBonus = addDiceObjectsWithTypeTogether(attackBonus, allAttackBonus);
    });

    let amount = convertDiceRollWithTypeToValue(attackBonus);
    if (!amount) {
        amount = "0";
    }
    let addendum = calculateAddendumAspects(playerConfigs, ["spellAttackAddendum", "allAttackAddendum"], { spell, spellcastingAbility, spellcastingAbilityModifier, slotLevel });

    if (spellToUse.challengeType === "attackRoll") {
        const spellRange = calculateRange(playerConfigsToUse, spell.range);
        // TODO: Need to differentiate between melee and ranged spell attacks.
        if (isNumeric(spellRange) && spellRange > 5) {
            const allMisc = getCollection("misc");
            const rangedMisc = allMisc.find(misc => misc.name === "Ranged");
    
            const rangedString = performMathCalculation(playerConfigs, rangedMisc.weaponAttackAddendum.calculation, { spell, spellcastingAbility, spellcastingAbilityModifier, slotLevel });

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

export function calculateSpellSaveDC(playerConfigs, spell, slotLevel) {
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
    findAllConfiguredAspects(playerConfigsToUse, "spellSaveDCBonus", (aspectValue, typeFoundOn, playerConfigForObject) => {
        if (aspectValue.conditions) {
            const conditionsAreMet = performBooleanCalculation(playerConfigsToUse, aspectValue.conditions, { spell: spellToUse, spellcastingAbility, spellcastingAbilityModifier, slotLevel, playerConfigForObject });
            if (!conditionsAreMet) {
                // We did not meet the conditions for this bonus to apply.
                return;
            }
        }

        let spellSaveDCBonus;
        if (aspectValue.calculation) {
            spellSaveDCBonus = performDiceRollCalculation(playerConfigsToUse, aspectValue.calculation, { spell: spellToUse, spellcastingAbility, spellcastingAbilityModifier, slotLevel, playerConfigForObject });
        } else {
            spellSaveDCBonus = aspectValue;
        }
        spellSaveDC = addDiceObjectsWithTypeTogether(spellSaveDC, spellSaveDCBonus);
    });

    let dc = convertDiceRollWithTypeToValue(spellSaveDC);
    if (!dc) {
        dc = "0";
    }
    const addendum = calculateAddendumAspect(playerConfigs, "spellSaveDCAddendum", { spell, spellcastingAbility, spellcastingAbilityModifier, slotLevel });

    return { dc, addendum };
}

export function calculateOtherSpellAspect(playerConfigs, spell, slotLevel, aspectName, aspectBonusName, additionalParams = undefined) {
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
    let spellAspect = performDiceRollCalculation(playerConfigsToUse, spell[aspectName].calculation, { spell: spellToUse, spellcastingAbility, spellcastingAbilityModifier, slotLevel, ...additionalParams });
    
    if (aspectBonusName) {
        // See if there are additional bonuses to apply to this aspect.
        findAllConfiguredAspects(playerConfigsToUse, aspectBonusName, (aspectValue, typeFoundOn, playerConfigForObject) => {
            if (aspectValue.conditions) {
                const conditionsAreMet = performBooleanCalculation(playerConfigsToUse, aspectValue.conditions, { spell: spellToUse, spellcastingAbility, spellcastingAbilityModifier, slotLevel, playerConfigForObject, ...additionalParams });
                if (!conditionsAreMet) {
                    // We did not meet the conditions for this bonus to apply.
                    return;
                }
            }

            let aspectBonus
            if (aspectValue.calculation) {
                aspectBonus = performDiceRollCalculation(playerConfigsToUse, aspectValue.calculation, { spell: spellToUse, spellcastingAbility, spellcastingAbilityModifier, slotLevel, playerConfigForObject, ...additionalParams });
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

export function calculateOtherFeatureActionAspect(playerConfigs, featureAction, aspectName, aspectBonusName, additionalParams = undefined) {
    // Start with the feature action's calculation
    let actionAspect = performDiceRollCalculation(playerConfigs, featureAction[aspectName].calculation, { featureAction, ...additionalParams });
    
    if (aspectBonusName) {
        // See if there are additional bonuses to apply to this aspect.
        findAllConfiguredAspects(playerConfigs, aspectBonusName, (aspectValue, typeFoundOn, playerConfigForObject) => {
            if (aspectValue.conditions) {
                const conditionsAreMet = performBooleanCalculation(playerConfigs, aspectValue.conditions, { featureAction, ...additionalParams });
                if (!conditionsAreMet) {
                    // We did not meet the conditions for this bonus to apply.
                    return;
                }
            }

            let aspectBonus;
            if (aspectValue.calculation) {
                aspectBonus = performDiceRollCalculation(playerConfigs, aspectValue.calculation, { featureAction, playerConfigForObject, ...additionalParams });
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

export function calculateAttackRollForAttackRollType(playerConfigs, actionObject, castAtLevel, attackRollType) {
    switch (attackRollType) {
        // TODO: Need to differentiate between melee and ranged spell attacks.
        case "spellAttack":
            return calculateSpellAttack(playerConfigs, actionObject, castAtLevel);
        case "unarmedAttack":
            return calculateUnarmedAttackBonus(playerConfigs);
    }
}

export function calculateRange(playerConfigs, range) {
    if (range) {
        if (isObject(range)) {
            let rangeString = "";
            if (range.normal) {
                if (isObject(range.normal)) {
                    rangeString += performMathCalculation(playerConfigs, range.normal.calculation);
                } else {
                    rangeString += range.normal;
                }
            }
            if (range.long) {
                rangeString += "/";
                if (isObject(range.long)) {
                    rangeString += performMathCalculation(playerConfigs, range.normal.calculation);
                } else {
                    rangeString += range.long;
                }
            }
            return rangeString;
        } else {
            return range;
        }
    }
    return undefined;
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

export function calculateAddendumAspects(playerConfigs, addendumNames, parameters = {}) {
    let allAddendumsStrings = "";
    for (let addendumName of addendumNames) {
        const singleAddendum = calculateAddendumAspect(playerConfigs, addendumName, parameters);
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

export function calculateAddendumAspect(playerConfigs, addendumName, parameters = {}) {
    let addendumString = "";

    findAllConfiguredAspects(playerConfigs, addendumName, (aspectValue, typeFoundOn, playerConfigForObject) => {
        let valueToAdd;

        if (aspectValue.conditions) {
            const conditionsAreMet = performBooleanCalculation(playerConfigs, aspectValue.conditions, { ...parameters, playerConfigForObject });
            if (!conditionsAreMet) {
                // We did not meet the conditions for this bonus to apply.
                return;
            }
        }

        if (aspectValue.calculation) {
            valueToAdd = performMathCalculation(playerConfigs, aspectValue.calculation, { ...parameters, playerConfigForObject });
        } else {
            valueToAdd = aspectValue;
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
    return findAllConfiguredAspects(playerConfigs, "features", (aspectValue, typeFoundOn, playerConfigForObject) => {
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
                    if (speciesFeature.level <= playerConfigs.level) {
                        onFeatureFound(speciesFeature, typeFoundOn, playerConfigForObject);
                    }
                }
                return;
        }

        if (typeFoundOn.startsWith("species[")) {
            for (let speciesFeature of aspectValue) {
                if (speciesFeature.level <= playerConfigs.level) {
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

    findAllConfiguredAspects(playerConfigs, aspectName, (aspectValue, typeFoundOn, playerConfigForObject) => {
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

function findAllConfiguredAspects(playerConfigs, aspectName, onAspectFound) {
    const backgrounds = getCollection("backgrounds");
    const species = getCollection("species");
    const feats = getCollection('feats');
    const subclasses = getCollection('subclasses');

    // Check the base player for the aspect.
    const baseAspectValue = getValueFromObjectAndPath(playerConfigs, aspectName)
    if (baseAspectValue) {
        onAspectFound(baseAspectValue, "player", playerConfigs);
    }

    // Check the species for the aspect.
    const dndspecies = species.find(x => x.name === playerConfigs.species.name);
    if (dndspecies) {
        const speciesAspectValue = getValueFromObjectAndPath(dndspecies, aspectName)
        if (speciesAspectValue) {
            onAspectFound(speciesAspectValue, "species", playerConfigs.species);
        }

        const allDndSpeciesFeatures = dndspecies?.features ? [...dndspecies.features] : [];

        if (dndspecies.choices) {
            findAspectsFromChoice(playerConfigs, dndspecies, "species.choices.", aspectName, (aspectValue) => onAspectFound(aspectValue, "species[" + playerConfigs.species.name  + "]", playerConfigs.species.choices));

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
                    const speciesFeaturePlayerConfig = playerConfigs.species.features ? playerConfigs.species.features[featurePropertyName] : undefined;

                    if (aspectName !== "feat") {
                        const speciesFeatureAspectValue = getValueFromObjectAndPath(speciesFeature, aspectName);
                        if (speciesFeatureAspectValue) {
                            onAspectFound(speciesFeatureAspectValue, "feature", speciesFeaturePlayerConfig);
                        }
                    }

                    if (speciesFeature.choices) {
                        findAspectsFromChoice(playerConfigs, speciesFeature, "species.features." + featurePropertyName + ".choices.", aspectName, (aspectValue) => onAspectFound(aspectValue, "feature", speciesFeaturePlayerConfig.choices));
                    }

                    if (speciesFeature.feat) {
                        const selectedFeatName = speciesFeaturePlayerConfig?.name;
                        if (selectedFeatName) {
                            if (aspectName === "feat") {
                                onAspectFound(selectedFeatName, "feature", speciesFeaturePlayerConfig);
                            }

                            const dndfeat = feats.find(x => x.name === selectedFeatName);
                            if (dndfeat) {
                                if (dndfeat.aspects && dndfeat.aspects[aspectName]) {
                                    onAspectFound(dndfeat.aspects[aspectName], "feat", playerConfigs.species.features[featurePropertyName]);
                                }

                                if (dndfeat.choices) {
                                    findAspectsFromChoice(playerConfigs, dndfeat, "species.features." + featurePropertyName + ".choices.", aspectName, (aspectValue) => onAspectFound(aspectValue, "feat", speciesFeaturePlayerConfig.choices));
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    
    const dndClasses = getAllPlayerDNDClasses(playerConfigs);
    for (let i = 0; i < dndClasses.length; i++) {
        const dndClass = dndClasses[i];
        // Check each of the classes for the aspect.
        const classAspectValue = dndClass[aspectName];
        if (classAspectValue) {
            onAspectFound(classAspectValue, "class", playerConfigs.classes[i]);
        }

        const allDndClassFeatures = dndClass.features ? [...dndClass.features] : [];

        if (dndClass.choices) {
            findAspectsFromChoice(playerConfigs, dndClass, "classes[" + i + "].choices.", aspectName, (aspectValue) => onAspectFound(aspectValue, "class", playerConfigs.classes[i].choices));

            findAspectsFromChoice(playerConfigs, dndClass, "classes[" + i + "].choices.", "features", (aspectValue) => {
                for (let classFeature of aspectValue) {
                    allDndClassFeatures.push(classFeature);
                }
            });
        }

        if (allDndClassFeatures) {
            for (let j = 0; j < dndClass.features.length; j++) {
                const classFeature = dndClass.features[j];
                if (!classFeature.classLevel || classFeature.classLevel <= playerConfigs.classes[i].levels) {
                    const featurePropertyName = classFeature.name.replace(/\s/g, "") + classFeature.classLevel;
                    const classFeaturePlayerConfig = playerConfigs.classes[i].features ? playerConfigs.classes[i].features[featurePropertyName] : undefined;

                    if (aspectName !== "feat") {
                        const classFeatureAspectValue = getValueFromObjectAndPath(classFeature, aspectName);
                        if (classFeatureAspectValue) {
                            onAspectFound(classFeatureAspectValue, "feature", classFeaturePlayerConfig);
                        }
                    }

                    if (classFeature.choices) {
                        findAspectsFromChoice(playerConfigs, classFeature, "classes[" + i + "].features." + featurePropertyName + ".choices.", aspectName, (aspectValue) => onAspectFound(aspectValue, "feature", classFeaturePlayerConfig.choices));
                    }

                    if (classFeature.subclass) {
                        const selectedSubclass = classFeaturePlayerConfig?.name;
                        if (selectedSubclass) {
                            const dndSubclass = subclasses.find(x => x.name === selectedSubclass);
                            if (dndSubclass) {
                                if (dndSubclass[aspectName]) {
                                    onAspectFound(dndSubclass[aspectName], "subclass", playerConfigs.classes[i].features[featurePropertyName]);
                                }

                                if (dndSubclass.choices) {
                                    findAspectsFromChoice(playerConfigs, dndSubclass, "classes[" + i + "].features." + featurePropertyName + ".choices.", aspectName, (aspectValue) => onAspectFound(aspectValue, "subclass", classFeaturePlayerConfig.choices));
                                }

                                if (dndSubclass.features) {
                                    // TODO: We really need to unify the logic for looking through features.
                                    for (const subclassFeature of dndSubclass.features) {
                                        if (subclassFeature[aspectName]) {
                                            onAspectFound(subclassFeature[aspectName], "subclass", playerConfigs.classes[i].features[featurePropertyName]);
                                        }
                                    }
                                }
                            }
                        }
                    }

                    if (classFeature.feat) {
                        const selectedFeatName = classFeaturePlayerConfig?.name;
                        if (selectedFeatName) {
                            if (aspectName === "feat") {
                                onAspectFound(selectedFeatName, "feature", classFeaturePlayerConfig);
                            }

                            const dndfeat = feats.find(x => x.name === selectedFeatName);
                            if (dndfeat) {
                                if (dndfeat.aspects && dndfeat.aspects[aspectName]) {
                                    onAspectFound(dndfeat.aspects[aspectName], "feat", playerConfigs.classes[i].features[featurePropertyName]);
                                }

                                if (dndfeat.choices) {
                                    findAspectsFromChoice(playerConfigs, dndfeat, "classes[" + i + "].features." + featurePropertyName + ".choices.", aspectName, (aspectValue) => onAspectFound(aspectValue, "feat", classFeaturePlayerConfig.choices));
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // Check the background for the aspect.
    const dndBackground = backgrounds.find(x => x.name === playerConfigs.background.name);
    if (dndBackground) {
        const backgroundAspectValue = getValueFromObjectAndPath(dndBackground, aspectName);
        if (backgroundAspectValue) {
            onAspectFound(backgroundAspectValue, "background", playerConfigs.background);
        }

        if (dndBackground.feat) {
            const dndfeat = feats.find(x => x.name === dndBackground.feat);
            if (dndfeat) {
                if (dndfeat.aspects && dndfeat.aspects[aspectName]) {
                    onAspectFound(dndfeat.aspects[aspectName], "feat", playerConfigs.background);
                }
    
                if (dndfeat.choices) {
                    findAspectsFromChoice(playerConfigs, dndfeat, "background.choices.", aspectName, (aspectValue) => onAspectFound(aspectValue, "feat", playerConfigs.background));
                }
            }
        }

        if (playerConfigs.items) {
            // Check equipped items for the aspect.
            const items = getCollection("items");
            // Convert to a dictionary for quick searches because the list could be LONG.
            const itemsDictionary = convertArrayToDictionary(items, "name");
            for (let item of playerConfigs.items) {
                if (item.equipped) {
                    const dndItem = itemsDictionary[item.name];
                    if (dndItem && (!dndItem.attunement || item.attuned) && dndItem.aspects && dndItem.aspects[aspectName]) {
                        onAspectFound(dndItem.aspects[aspectName], "item", item);
                    }
                }
            }
        }
    }

    if (aspectName !== "features") {
        if (playerConfigs?.currentStatus?.conditions && playerConfigs.currentStatus.conditions.length > 0) {
            const dndConditions = getCollection("conditions");
            const dndConditionsMap = convertArrayToDictionary(dndConditions, "name");
            // Some conditions cause other conditions, and we don't want to check any condition twice, this will help with that.
            const dndConditionsChecked = {};
            for (let playerCondition of playerConfigs.currentStatus.conditions) {
                findAspectFromCondition(dndConditionsChecked, dndConditionsMap, playerCondition.name, aspectName, (aspectValue) => onAspectFound(aspectValue, "condition", playerCondition));
            }
        }

        if (playerConfigs?.currentStatus?.activeEffects && playerConfigs.currentStatus.activeEffects.length > 0) {
            const collections = {};
            for (let activeEffect of playerConfigs.currentStatus.activeEffects) {
                if (activeEffect.onSelf) {
                    const collection = getOrAddCachedActiveEffectCollection(playerConfigs, collections, activeEffect.fromRemoteCharacter);
                    switch (activeEffect.type) {
                        case "spell":
                            const spell = collection.spellName2Spell[activeEffect.name];
                            if (spell && spell.aspects && spell.aspects[aspectName]) {
                                onAspectFound(spell.aspects[aspectName], "spell", activeEffect);
                            }
                            break;
                        case "featureaction":
                            const actionFeature = collection.actionFeatures.find(feature => feature.feature.actions.some(action => action.name === activeEffect.name));
                            if (actionFeature) {
                                const featureAction = actionFeature.feature.actions.find(action => action.name === activeEffect.name);
                                if (featureAction && featureAction.aspects && featureAction.aspects[aspectName]) {
                                    onAspectFound(featureAction.aspects[aspectName], "featureAction", activeEffect);
                                }
                            }
                            break;
                        case "action":
                            const action = collection.actionName2Action[activeEffect.name];
                            if (action && action.aspects && action.aspects[aspectName]) {
                                onAspectFound(action.aspects[aspectName], "action", activeEffect);
                            }
                            break;
                    }
                }

                if (activeEffect.allies) {
                    for (let ally of activeEffect.allies) {
                        findAllConfiguredAspects(ally, "parentAspects", (parentAspect, typeFoundOn, playerConfigForObject) => {
                            for (let parentAspectName of Object.keys(parentAspect)) {
                                if (parentAspectName === aspectName) {
                                    const aspectValue = parentAspect[parentAspectName];
                                    onAspectFound(aspectValue, "ally", ally);
                                }
                            }
                        });
                    }
                }
            }
        }
    }

    if (playerConfigs?.statBlocks && playerConfigs.statBlocks.length > 0) {
        const allStatBlocks = getCollection("statblocks");
        const statBlockMap = convertArrayToDictionary(allStatBlocks, "name");
        for (let statBlock of playerConfigs.statBlocks) {
            const dndStatBlock = statBlockMap[statBlock];
            if (dndStatBlock && dndStatBlock.aspects && dndStatBlock.aspects[aspectName]) {
                onAspectFound(dndStatBlock.aspects[aspectName], "statblock", dndStatBlock);
            }

            const allStatBlockFeatures = dndStatBlock?.aspects?.features ? [...dndStatBlock.aspects.features] : [];
            
            if (allStatBlockFeatures) {
                for (let i = 0; i < allStatBlockFeatures.length; i++) {
                    const statBlockFeature = allStatBlockFeatures[i];
                    if (statBlockFeature && statBlockFeature[aspectName]) {
                        onAspectFound(statBlockFeature[aspectName], "feature", statBlockFeature);
                    }
                }
            }
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
        const playerSpells = getAllSpells(spellCastingFeatures);
        const spellName2Spell = convertArrayToDictionary(playerSpells, "name");

        const actionFeatures = getAllActionFeatures(playerConfigsToSearchFor);

        const actions = getCollection("actions");
        const actionName2Action = convertArrayToDictionary(actions, "name");

        const collection = { spellName2Spell, actionFeatures, actionName2Action };
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
        if (singleCalculation.type === "if-then") {
            // It is already in the correct format.
            return singleValue;
        }

        let transformedValue = singleValue;
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

        return createDiceObjectWithType(transformedValue, singleCalculation.diceType);
    };
    const performAddition = (currentTotal, valueToAdd) => {
        return addDiceObjectsWithTypeTogether(currentTotal, valueToAdd);
    };

    const diceObject = performCalculation(playerConfigs, calculation, doSingleCalculationForSpecialTypes, performSpecialTransformations, performAddition, () => { return {}; }, parameters);
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
    } else {
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
        if (singleCalculation.multiplier) {
            const multiplier = performMathCalculation(playerConfigs, singleCalculation.multiplier, parameters);
            singleValue = multiplier * singleValue;
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
        if (!currentTotal && !isNumeric(valueToAdd)) {
            return valueToAdd;
        } else if (isNumeric(valueToAdd)) {
            return currentTotal + parseInt(valueToAdd);
        } else if (Array.isArray(currentTotal), Array.isArray(valueToAdd)) {
            return [...currentTotal, ...valueToAdd];
        }
        return currentTotal + valueToAdd;
    };

    return performCalculation(playerConfigs, calculation, doSingleCalculationForSpecialTypes, performSpecialTransformations, performAddition, () => { return 0; }, parameters);
}

export function performBooleanCalculation(playerConfigs, calculation, parameters = {}) {
    const doSingleCalculationForSpecialTypes = (singleCalculation) => {
        return false;
    };
    const performSpecialTransformations = (playerConfigs, singleCalculation, singleValue) => {
        if (singleCalculation.equals) {
            const valueToEqual = performMathCalculation(playerConfigs, singleCalculation.equals, parameters)
            const valueToReturn = (singleValue == valueToEqual);
            return valueToReturn;
        }

        if (singleCalculation.greaterThan) {
            const valueToEqual = performMathCalculation(playerConfigs, singleCalculation.greaterThan, parameters)
            const valueToReturn = (singleValue > valueToEqual);
            return valueToReturn;
        }

        if (singleCalculation.greaterThanOrEqualTo) {
            const valueToEqual = performMathCalculation(playerConfigs, singleCalculation.greaterThanOrEqualTo, parameters)
            const valueToReturn = (singleValue >= valueToEqual);
            return valueToReturn;
        }

        if (singleCalculation.lessThan) {
            const valueToEqual = performMathCalculation(playerConfigs, singleCalculation.lessThan, parameters)
            const valueToReturn = (singleValue <= valueToEqual);
            return valueToReturn;
        }

        if (singleCalculation.lessThanOrEqualTo) {
            const valueToEqual = performMathCalculation(playerConfigs, singleCalculation.lessThanOrEqualTo, parameters)
            const valueToReturn = (singleValue < valueToEqual);
            return valueToReturn;
        }

        if (singleCalculation.includes) {
            if (singleValue) {
                const valueThatShouldBeIncluded = performMathCalculation(playerConfigs, singleCalculation.includes, parameters)
                const valueToReturn = singleValue.includes(valueThatShouldBeIncluded);
                return valueToReturn;
            } else {
                return false;
            }
        }

        return singleValue;
    };
    const performAddition = (currentTotal, valueToAdd) => {
        return currentTotal && valueToAdd;
    };

    return performCalculation(playerConfigs, calculation, doSingleCalculationForSpecialTypes, performSpecialTransformations, performAddition, () => { return true; }, parameters);
}

function performCalculation(playerConfigs, calculation, doSingleCalculationForSpecialTypes, performSpecialTransformations, performAddition, getDefaultValue, parameters) {
    let total = getDefaultValue();
    for (let i = 0; i < calculation.length; i++) {
        const singleCalculation = calculation[i];
        let singleValue = doSingleCalculation(playerConfigs, singleCalculation, doSingleCalculationForSpecialTypes, parameters, (innerPlayerConfigs, innerCalc) => performCalculation(innerPlayerConfigs, innerCalc, doSingleCalculationForSpecialTypes, performSpecialTransformations, performAddition, getDefaultValue, parameters));

        singleValue = performSpecialTransformations(playerConfigs, singleCalculation, singleValue);

        total = performAddition(total, singleValue);
    }
    return total;
}

function doSingleCalculation(playerConfigs, singleCalculation, performCalculationForSpecialTypes, parameters, performOriginalCalculationType) {
    switch (singleCalculation.type) {
        case "static":
            return singleCalculation.value;
        case "aspect":
            if (playerConfigs) {
                return calculateAspectCollection(playerConfigs, singleCalculation.value);
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
            const singleValue = performBooleanCalculation(playerConfigs, singleCalculation.if, parameters);
            if (singleValue) {
                return performOriginalCalculationType(playerConfigs, singleCalculation.then);
            } else if (singleCalculation.else) {
                return performOriginalCalculationType(playerConfigs, singleCalculation.else);
            }
            // If not true and there is no else, we do not return: the performCalculationForSpecialTypes() will end up getting hit and should return the default value.
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

export function getAllSpells(spellcastingFeatures) {
    // Get all spells and cantrips built into dictionaries for instant lookup.
    let allCantrips = getCollection("cantrips");
    const cantripName2Cantrip = convertArrayToDictionary(allCantrips, "name");
    let allSpells = getCollection("spells");
    const spellName2Spell = convertArrayToDictionary(allSpells, "name");

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

            const featurePropertyName = spellcastingFeature.feature.name.replace(/\s/g, "") + (spellcastingFeature.feature.level ?? spellcastingFeature.feature.classLevel);
            const userInputForSpells = spellcastingFeature.playerConfigForObject.features ? spellcastingFeature.playerConfigForObject.features[featurePropertyName] : undefined;
            if (userInputForSpells && userInputForSpells.cantrips) {
                for (let cantripName of userInputForSpells.cantrips) {
                    const cantripToAdd = {...cantripName2Cantrip[cantripName]};
                    cantripToAdd.feature = spellcastingFeature.feature;
                    addSpellToSortedCollection(sortedCantripsCollection, cantripToAdd);
                }
            }
        }

        if (spellcasting.spellsKnown) {
            if (spellcasting.spellsKnown.predeterminedSelections && spellcasting.spellsKnown.predeterminedSelections.length > 0) {
                for (let predeterminedSelection of spellcasting.spellsKnown.predeterminedSelections) {
                    const spellToAdd = {...spellName2Spell[predeterminedSelection.spellName]};
                    spellToAdd.feature = spellcastingFeature.feature;
                    if (predeterminedSelection.freeUses && predeterminedSelection.freeUses > 0) {
                        spellToAdd.freeUses = predeterminedSelection.freeUses;
                    }
                    addSpellToSortedCollection(sortedSpellsCollection, spellToAdd);
                }
            }

            const featurePropertyName = spellcastingFeature.feature.name.replace(/\s/g, "") + (spellcastingFeature.feature.level ?? spellcastingFeature.feature.classLevel);
            const userInputForSpells = spellcastingFeature.playerConfigForObject.features ? spellcastingFeature.playerConfigForObject.features[featurePropertyName] : undefined;
            if (userInputForSpells && userInputForSpells.spells) {
                for (let cantripName of userInputForSpells.spells) {
                    const spellToAdd = {...spellName2Spell[cantripName]};
                    spellToAdd.feature = spellcastingFeature.feature;
                    addSpellToSortedCollection(sortedSpellsCollection, spellToAdd);
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
    if (!itemName2Item && originalDndItem.type === "Template") {
        const items = getCollection("items");
        itemName2Item = convertArrayToDictionary(items, "name");
    }

    let dndItem = originalDndItem;
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