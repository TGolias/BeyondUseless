import { getCollection } from "../Collections";
import { getCapitalizedAbilityScoreName, getValueFromObjectAndPath } from "./ComponentFunctions";
import { GetHeldItems } from "./EquipmentFunctions";
import { convertArrayOfStringsToHashMap, convertArrayToDictionary, convertHashMapToArrayOfStrings, isNumeric, isObject } from "./Utils";

export function calculateProficiencyBonus(playerConfigs) {
    return 2 + Math.floor((playerConfigs.level - 1) / 4);
}

export function calculateArmorClass(playerConfigs) {
    // Start with unarmored dc. 10 + dex modifier.
    let armorClass = 10 + calculateAspectCollection(playerConfigs, "dexterityModifier");

    // Check if there are any other ways to calculate armor class.
    findAllConfiguredAspects(playerConfigs, "armorClass", (aspectValue, typeFoundOn, playerConfigForObject) => {
        let newArmorClass;
        if (aspectValue.calculation) {
            newArmorClass = performMathCalculation(playerConfigs, aspectValue.calculation, { playerConfigForObject });
        }
        else {
            newArmorClass = aspectValue;
        }

        if (newArmorClass > armorClass) {
            armorClass = newArmorClass;
        }
    });

    // Now that we are using the highest AC calculation, check for any other AC bonuses and add them to the score.
    findAllConfiguredAspects(playerConfigs, "armorClassBonus", (aspectValue, typeFoundOn, playerConfigForObject) => {
        let armorClassBonus;
        if (aspectValue.calculation) {
            armorClassBonus = performMathCalculation(playerConfigs, aspectValue.calculation, { playerConfigForObject });
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
    findAllConfiguredAspects(playerConfigs, "initiativeBonus", (aspectValue, typeFoundOn, playerConfigForObject) => {
        let initiativeBonus;
        if (aspectValue.calculation) {
            initiativeBonus = performMathCalculation(playerConfigs, aspectValue.calculation);
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
    findAllConfiguredAspects(playerConfigs, "size", (aspectValue, typeFoundOn, playerConfigForObject) => {
        size = aspectValue;
    });

    return size;
}

export function calculateSpeed(playerConfigs) {
    // Start with 0, lol. All races have a base speed set, and if we end up seeing 0 in the UI, we'll know something is wrong for sure.
    let speed = 0;

    // There might be multiple speeds between the species / subspecies, override with whatever we see is the highest.
    findAllConfiguredAspects(playerConfigs, "speed", (aspectValue, typeFoundOn, playerConfigForObject) => {
        let newSpeed;
        if (aspectValue.calculation) {
            newSpeed = performMathCalculation(playerConfigs, aspectValue.calculation, { playerConfigForObject });
        }
        else {
            newSpeed = aspectValue;
        }

        if (newSpeed > speed) {
            speed = newSpeed;
        }
    });

    findAllConfiguredAspects(playerConfigs, "speedBonus", (aspectValue, typeFoundOn, playerConfigForObject) => {
        let speedBonus;
        if (aspectValue.calculation) {
            speedBonus = performMathCalculation(playerConfigs, aspectValue.calculation, { playerConfigForObject });
        }
        else {
            speedBonus = aspectValue;
        }

        speed += speedBonus;
    });

    findAllConfiguredAspects(playerConfigs, "forcedSpeed", (aspectValue, typeFoundOn, playerConfigForObject) => {
        let forcedSpeed;
        if (aspectValue.calculation) {
            forcedSpeed = performMathCalculation(playerConfigs, aspectValue.calculation, { playerConfigForObject });
        }
        else {
            forcedSpeed = aspectValue;
        }

        // The speed is being forced to this value.
        speed = forcedSpeed;
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
    const playerHalfSkillProficiencies = calculateAspectCollection(playerConfigs, "halfSkillProficiencies");
    const playerHalfSkillProficienciesMap = convertArrayOfStringsToHashMap(playerHalfSkillProficiencies)

    // They seemingly simplified this... it's just 10 plus your perception skill modifer.
    let passivePerception = 10 + calculateSkillBonus(playerConfigs, perceptionSkillProf, playerSkillProficienciesMap[perceptionSkillProf.name], playerExpertiseMap[perceptionSkillProf.name], playerHalfSkillProficienciesMap[perceptionSkillProf.name]);
    return passivePerception;
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
    let skillBonus = calculateModifierForBaseStat(calculateBaseStat(playerConfigs, dndSkillProficiency.modifier));
    if (hasProficiency) {
        let proficencyBonus = calculateProficiencyBonus(playerConfigs);
        skillBonus += proficencyBonus;
        if (hasExpertise) {
            // Add it again!!!
            skillBonus += proficencyBonus;
        }
    } else if (hasHalfProficiency) {
        let proficencyBonus = calculateProficiencyBonus(playerConfigs);
        const halfProficencyBonusRoundDown = Math.floor(proficencyBonus / 2);
        skillBonus += halfProficencyBonusRoundDown;
    }

    findAllConfiguredAspects(playerConfigs, "skillProficiency" + dndSkillProficiency.name + "Bonus", (aspectValue, typeFoundOn, playerConfigForObject) => {
        let initiativeBonus;
        if (aspectValue.calculation) {
            initiativeBonus = performMathCalculation(playerConfigs, aspectValue.calculation, { playerConfigForObject });
        }
        else {
            initiativeBonus = aspectValue;
        }

        skillBonus += initiativeBonus;
    });

    findAllConfiguredAspects(playerConfigs, "skillProficiencyAllBonus", (aspectValue, typeFoundOn, playerConfigForObject) => {
        let initiativeBonus;
        if (aspectValue.calculation) {
            initiativeBonus = performMathCalculation(playerConfigs, aspectValue.calculation, { playerConfigForObject });
        }
        else {
            initiativeBonus = aspectValue;
        }

        skillBonus += initiativeBonus;
    });

    return skillBonus;
}

export function calculateSavingThrowBonus(playerConfigs, modifier, hasProficiency) {
    let savingThrowBonus = calculateModifierForBaseStat(calculateBaseStat(playerConfigs, modifier));
    if (hasProficiency) {
        let proficencyBonus = calculateProficiencyBonus(playerConfigs);
        savingThrowBonus += proficencyBonus;
    }

    findAllConfiguredAspects(playerConfigs, modifier + "SavingThrowBonus", (aspectValue, typeFoundOn, playerConfigForObject) => {
        let initiativeBonus;
        if (aspectValue.calculation) {
            initiativeBonus = performMathCalculation(playerConfigs, aspectValue.calculation, { playerConfigForObject });
        }
        else {
            initiativeBonus = aspectValue;
        }

        savingThrowBonus += initiativeBonus;
    });

    findAllConfiguredAspects(playerConfigs, "allSavingThrowBonus", (aspectValue, typeFoundOn, playerConfigForObject) => {
        let initiativeBonus;
        if (aspectValue.calculation) {
            initiativeBonus = performMathCalculation(playerConfigs, aspectValue.calculation, { playerConfigForObject });
        }
        else {
            initiativeBonus = aspectValue;
        }

        savingThrowBonus += initiativeBonus;
    });

    return savingThrowBonus;
}

export function calculateUnarmedAttackBonus(playerConfigs) {
    const calculationsForAttackBonus = [];

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
        }
        else {
            modifierName = aspectValue;
        }

        const modifierValue = calculateAspectCollection(playerConfigs, modifierName + "Modifier");
        // Do greater than or equal to here. We have a perference towards these alternate modifiers. Long term, I should probably just show all calculations though.
        if (highestValidAbilityModifier === undefined || modifierValue >= highestValidAbilityModifier) {
            highestValidAbility = modifierName;
            highestValidAbilityModifier = modifierValue;
        }
    });

    calculationsForAttackBonus.push({
        type: "static",
        value: highestValidAbilityModifier
    });

    // Always add proficiency bonus for unarmed attacks. Pretty sweet I guess.
    calculationsForAttackBonus.push({
        type: "aspect",
        value: "proficiencyBonus",
    });
    
    // See if there are additional bonuses to apply to our attack.
    findAllConfiguredAspects(playerConfigs, "unarmedAttackBonus", (aspectValue, typeFoundOn, playerConfigForObject) => {
        if (aspectValue.conditions) {
            const conditionsAreMet = performBooleanCalculation(playerConfigs, aspectValue.conditions, { attackAbility: highestValidAbility, attackAbilityModifier: highestValidAbilityModifier });
            if (!conditionsAreMet) {
                // We did not meet the conditions for this bonus to apply.
                return;
            }
        }

        if (aspectValue.calculation) {
            calculationsForAttackBonus.push(...aspectValue.calculation);
        }
        else {
            calculationsForAttackBonus.push({
                type: "static",
                value: aspectValue
            });
        }
    });

    findAllConfiguredAspects(playerConfigs, "allAttackBonus", (aspectValue, typeFoundOn, playerConfigForObject) => {
        if (aspectValue.conditions) {
            const conditionsAreMet = performBooleanCalculation(playerConfigs, aspectValue.conditions, { attackAbility: highestValidAbility, attackAbilityModifier: highestValidAbilityModifier });
            if (!conditionsAreMet) {
                // We did not meet the conditions for this bonus to apply.
                return;
            }
        }

        if (aspectValue.calculation) {
            calculationsForAttackBonus.push(...aspectValue.calculation);
        }
        else {
            calculationsForAttackBonus.push({
                type: "static",
                value: aspectValue
            });
        }
    });

    const amount = performMathCalculation(playerConfigs, calculationsForAttackBonus, { attackAbility: highestValidAbility, attackAbilityModifier: highestValidAbilityModifier });
    let addendum = calculateAddendumAspects(playerConfigs, ["unarmedAttackAddendum", "allAttackAddendum"], { attackAbility: highestValidAbility, attackAbilityModifier: highestValidAbilityModifier });

    return { amount, addendum };
}

export function calculateUnarmedDamage(playerConfigs) {
    let calculationsForAttackDamage;

    // By default the unarmed attack base is 1.
    let highestUnarmedAttackDie = 1;
    let highestUnarmedAttackCalculation = [
        {
            type: "static",
            value: 1
        }
    ];

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
            let unarmedAttackCalculationDie = aspectValue.calculation[0].value;
            if (unarmedAttackCalculationDie >= highestUnarmedAttackDie) {
                highestUnarmedAttackDie = unarmedAttackCalculationDie;
                highestUnarmedAttackCalculation = aspectValue.calculation;
            }
        }
    });

    calculationsForAttackDamage = [...highestUnarmedAttackCalculation];

    let highestValidAbility = undefined;
    let highestValidAbilityModifier = undefined;

    let strengthModifier = calculateAspectCollection(playerConfigs, "strengthModifier");
    highestValidAbility = "strength";
    highestValidAbilityModifier = strengthModifier;

    findAllConfiguredAspects(playerConfigs, "alternateUnarmedDamageModifier", (aspectValue, typeFoundOn, playerConfigForObject) => {
        if (aspectValue.conditon) {
            const conditionsAreMet = performBooleanCalculation(playerConfigs, aspectValue.conditon);
            if (!conditionsAreMet) {
                // We did not meet the conditions for this alternate modifier to apply.
                return;
            }
        }

        let modifierName;
        if (aspectValue.calculation) {
            modifierName = performMathCalculation(playerConfigs, aspectValue.calculation);
        }
        else {
            modifierName = aspectValue;
        }

        const modifierValue = calculateAspectCollection(playerConfigs, modifierName + "Modifier");
        // Do greater than or equal to here. We have a perference towards these alternate modifiers. Long term, I should probably just show all calculations though.
        if (highestValidAbilityModifier === undefined || modifierValue >= highestValidAbilityModifier) {
            highestValidAbility = modifierName;
            highestValidAbilityModifier = modifierValue;
        }
    });

    calculationsForAttackDamage.push({
        type: "static",
        value: highestValidAbilityModifier
    });
    
    // See if there are additional bonuses to apply to our damage.
    findAllConfiguredAspects(playerConfigs, "unarmedDamageBonus", (aspectValue, typeFoundOn, playerConfigForObject) => {
        if (aspectValue.conditon) {
            const conditionsAreMet = performBooleanCalculation(playerConfigs, aspectValue.conditon, { attackAbility: highestValidAbility, attackAbilityModifier: highestValidAbilityModifier });
            if (!conditionsAreMet) {
                // We did not meet the conditions for this bonus to apply.
                return;
            }
        }

        if (aspectValue.calculation) {
            calculationsForAttackDamage.push(...aspectValue.calculation);
        }
        else {
            calculationsForAttackDamage.push({
                type: "static",
                value: aspectValue
            });
        }
    });

    let calculationToPerform;
    if (highestUnarmedAttackDie === 1) {
        // Ensure unarmed attack damage is at least 1.
        calculationToPerform = []
        calculationToPerform.push({
            type: "highestOf",
            values: [
                calculationsForAttackDamage,
                [
                    {
                        type: "static",
                        value: 1
                    }
                ]
            ]
        });
    } else {
        // We have an alternate / better way of calculating damage. We want the calculation to show the whole thing, even with a potentially negative modifier.
        calculationToPerform = calculationsForAttackDamage;
    }

    const calculationString = performDiceRollCalculation(playerConfigs, calculationToPerform, { attackAbility: highestValidAbility, attackAbilityModifier: highestValidAbilityModifier });
    return calculationString;
}

export function calculateUnarmedAttackDC(playerConfigs) {
    const calculationsForUnarmedDC = [];

    // Start with 8.
    calculationsForUnarmedDC.push({
        type: "static",
        value: 8
    });

    let highestValidAbility = undefined;
    let highestValidAbilityModifier = undefined;

    let strengthModifier = calculateAspectCollection(playerConfigs, "strengthModifier");
    highestValidAbility = "strength";
    highestValidAbilityModifier = strengthModifier;

    findAllConfiguredAspects(playerConfigs, "alternateUnarmedAttackModifier", (aspectValue, typeFoundOn, playerConfigForObject) => {
        if (aspectValue.conditon) {
            const conditionsAreMet = performBooleanCalculation(playerConfigs, aspectValue.conditon);
            if (!conditionsAreMet) {
                // We did not meet the conditions for this alternate modifier to apply.
                return;
            }
        }

        let modifierName;
        if (aspectValue.calculation) {
            modifierName = performMathCalculation(playerConfigs, aspectValue.calculation);
        }
        else {
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
    calculationsForUnarmedDC.push({
        type: "static",
        value: highestValidAbilityModifier
    });

    // Always add proficiency bonus for unarmed attacks. Pretty sweet I guess.
    calculationsForUnarmedDC.push({
        type: "aspect",
        value: "proficiencyBonus"
    });
    
    // See if there are additional bonuses to apply to our DC.
    findAllConfiguredAspects(playerConfigs, "unarmedDCBonus", (aspectValue, typeFoundOn, playerConfigForObject) => {
        if (aspectValue.conditions) {
            const conditionsAreMet = performBooleanCalculation(playerConfigs, aspectValue.conditions, { attackAbility: highestValidAbility, attackAbilityModifier: highestValidAbilityModifier });
            if (!conditionsAreMet) {
                // We did not meet the conditions for this bonus to apply.
                return;
            }
        }

        if (aspectValue.calculation) {
            calculationsForUnarmedDC.push(...aspectValue.calculation);
        }
        else {
            calculationsForUnarmedDC.push({
                type: "static",
                value: aspectValue
            });
        }
    });

    const dc = performDiceRollCalculation(playerConfigs, calculationsForUnarmedDC, { attackAbility: highestValidAbility, attackAbilityModifier: highestValidAbilityModifier });
    const addendum = calculateAddendumAspect(playerConfigs, "spellSaveDCAddendum", { attackAbility: highestValidAbility, attackAbilityModifier: highestValidAbilityModifier });

    return { dc, addendum };
}

export function calculateWeaponAttackBonus(playerConfigs, weapon, isThrown) {
    const calculationsForAttackBonus = [];

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
        }
        else {
            modifierName = aspectValue;
        }

        const modifierValue = calculateAspectCollection(playerConfigs, modifierName + "Modifier");
        // Do greater than or equal to here. We have a perference towards these alternate modifiers for the case of True Strike and spells like it. Long term, I should probably just show all calculations though.
        if (highestValidAbilityModifier === undefined || modifierValue >= highestValidAbilityModifier) {
            highestValidAbility = modifierName;
            highestValidAbilityModifier = modifierValue;
        }
    });

    calculationsForAttackBonus.push({
        type: "static",
        value: highestValidAbilityModifier
    });

    // Check if we should add the proficency bonus.
    let isProficient = false;
    if (weapon.tags) {
        const weaponProficienyMap = calculateAspectCollection(playerConfigs, "weaponProficiencies");
        isProficient = weapon.tags.some(tag => weaponProficienyMap.includes(tag));
        if (isProficient) {
            calculationsForAttackBonus.push({
                type: "aspect",
                value: "proficiencyBonus",
            });
        }
    }
    
    // See if there are additional bonuses to apply to our attack.
    findAllConfiguredAspects(playerConfigs, "weaponAttackBonus", (aspectValue, typeFoundOn, playerConfigForObject) => {
        if (aspectValue.conditions) {
            const conditionsAreMet = performBooleanCalculation(playerConfigs, aspectValue.conditions, { weapon, isThrown, attackAbility: highestValidAbility, attackAbilityModifier: highestValidAbilityModifier });
            if (!conditionsAreMet) {
                // We did not meet the conditions for this bonus to apply.
                return;
            }
        }

        if (aspectValue.calculation) {
            calculationsForAttackBonus.push(...aspectValue.calculation);
        }
        else {
            calculationsForAttackBonus.push({
                type: "static",
                value: aspectValue
            });
        }
    });

    findAllConfiguredAspects(playerConfigs, "allAttackBonus", (aspectValue, typeFoundOn, playerConfigForObject) => {
        if (aspectValue.conditions) {
            const conditionsAreMet = performBooleanCalculation(playerConfigs, aspectValue.conditions, { weapon, isThrown, attackAbility: highestValidAbility, attackAbilityModifier: highestValidAbilityModifier });
            if (!conditionsAreMet) {
                // We did not meet the conditions for this bonus to apply.
                return;
            }
        }

        if (aspectValue.calculation) {
            calculationsForAttackBonus.push(...aspectValue.calculation);
        }
        else {
            calculationsForAttackBonus.push({
                type: "static",
                value: aspectValue
            });
        }
    });

    const amount = performMathCalculation(playerConfigs, calculationsForAttackBonus, { weapon, isThrown, attackAbility: highestValidAbility, attackAbilityModifier: highestValidAbilityModifier });
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
    let calculationsForDamage = undefined;
    if (weapon.properties && weapon.properties.includes("Versatile")) {
        // Check if they can actually two-hand the weapon.
        const heldItems = GetHeldItems(playerConfigs.items);
        if (heldItems.length === 1 && heldItems[0].name === weapon.name) {
            calculationsForDamage = [...weapon.twoHandedDamage.calculation];
        }
    }

    if (!calculationsForDamage) {
        // There are no overrides for weapon damage. Start with the normal weapon damage.
        calculationsForDamage = [...weapon.damage.calculation];
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
        }
        else {
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
        calculationsForDamage.push({
            type: "static",
            value: highestValidAbilityModifier
        });
    }
    
    // See if there are additional bonuses to apply to our damage.
    findAllConfiguredAspects(playerConfigs, "weaponDamageBonus", (aspectValue, typeFoundOn, playerConfigForObject) => {
        if (aspectValue.conditon) {
            const conditionsAreMet = performBooleanCalculation(playerConfigs, aspectValue.conditon, { weapon, isThrown, isExtraLightAttack, isExtraCleaveAttack, attackAbility: highestValidAbility, attackAbilityModifier: highestValidAbilityModifier });
            if (!conditionsAreMet) {
                // We did not meet the conditions for this bonus to apply.
                return;
            }
        }

        if (aspectValue.calculation) {
            calculationsForDamage.push(...aspectValue.calculation);
        }
        else {
            calculationsForDamage.push({
                type: "static",
                value: aspectValue
            });
        }
    });

    const calculationString = performDiceRollCalculation(playerConfigs, calculationsForDamage, { weapon, isThrown, isExtraLightAttack, isExtraCleaveAttack, attackAbility: highestValidAbility, attackAbilityModifier: highestValidAbilityModifier });
    return calculationString;
}

export function calculateSpellAttack(playerConfigs, spell, slotLevel) {
    const calculationsForAttackBonus = [];

    const spellcastingAbility = performMathCalculation(playerConfigs, spell.feature.spellcasting.ability.calculation);
    const spellcastingAbilityModifier = calculateAspectCollection(playerConfigs, spellcastingAbility + "Modifier");

    // Always add spellcasting ability modifier.
    calculationsForAttackBonus.push({
        type: "aspect",
        value: spellcastingAbility + "Modifier"
    });

    // Always add proficieny bonus for spellcasting.
    calculationsForAttackBonus.push({
        type: "aspect",
        value: "proficiencyBonus"
    });
    
    // See if there are additoinal bonuses to apply to our attack.
    findAllConfiguredAspects(playerConfigs, "spellAttackBonus", (aspectValue, typeFoundOn, playerConfigForObject) => {
        if (aspectValue.conditions) {
            const conditionsAreMet = performBooleanCalculation(playerConfigs, aspectValue.conditions, { spell, spellcastingAbility, spellcastingAbilityModifier, slotLevel });
            if (!conditionsAreMet) {
                // We did not meet the conditions for this bonus to apply.
                return;
            }
        }

        if (aspectValue.calculation) {
            calculationsForAttackBonus.push(...aspectValue.calculation);
        }
        else {
            calculationsForAttackBonus.push({
                type: "static",
                value: aspectValue
            });
        }
    });

    findAllConfiguredAspects(playerConfigs, "allAttackBonus", (aspectValue, typeFoundOn, playerConfigForObject) => {
        if (aspectValue.conditions) {
            const conditionsAreMet = performBooleanCalculation(playerConfigs, aspectValue.conditions, { spell, spellcastingAbility, spellcastingAbilityModifier, slotLevel });
            if (!conditionsAreMet) {
                // We did not meet the conditions for this bonus to apply.
                return;
            }
        }

        if (aspectValue.calculation) {
            calculationsForAttackBonus.push(...aspectValue.calculation);
        }
        else {
            calculationsForAttackBonus.push({
                type: "static",
                value: aspectValue
            });
        }
    });

    const amount = performDiceRollCalculation(playerConfigs, calculationsForAttackBonus, { spell, spellcastingAbility, spellcastingAbilityModifier, slotLevel });
    let addendum = calculateAddendumAspects(playerConfigs, ["spellAttackAddendum", "allAttackAddendum"], { spell, spellcastingAbility, spellcastingAbilityModifier, slotLevel });

    if (spell.challengeType === "attackRoll") {
        const spellRange = calculateRange(playerConfigs, spell.range);
        if (isNumeric(spellRange)) {
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
    const calculationsForSpellSaveDCBonus = [];


    const spellcastingAbility = performMathCalculation(playerConfigs, spell.feature.spellcasting.ability.calculation);
    const spellcastingAbilityModifier = calculateAspectCollection(playerConfigs, spellcastingAbility + "Modifier");

    // Start with 8. Because that's what the rules say.
    calculationsForSpellSaveDCBonus.push({
        type: "static",
        value: 8
    });

    // Always add spellcasting ability modifier.
    calculationsForSpellSaveDCBonus.push({
        type: "aspect",
        value: spellcastingAbility + "Modifier"
    });

    // Always add proficieny bonus for spellcasting.
    calculationsForSpellSaveDCBonus.push({
        type: "aspect",
        value: "proficiencyBonus"
    });
    
    // See if there are additoinal bonuses to apply to our attack.
    findAllConfiguredAspects(playerConfigs, "spellSaveDCBonus", (aspectValue, typeFoundOn, playerConfigForObject) => {
        if (aspectValue.conditions) {
            const conditionsAreMet = performBooleanCalculation(playerConfigs, aspectValue.conditions, { spell, spellcastingAbility, spellcastingAbilityModifier, slotLevel });
            if (!conditionsAreMet) {
                // We did not meet the conditions for this bonus to apply.
                return;
            }
        }

        if (aspectValue.calculation) {
            calculationsForSpellSaveDCBonus.push(...aspectValue.calculation);
        }
        else {
            calculationsForSpellSaveDCBonus.push({
                type: "static",
                value: aspectValue
            });
        }
    });

    const dc = performDiceRollCalculation(playerConfigs, calculationsForSpellSaveDCBonus, { spell, spellcastingAbility, spellcastingAbilityModifier, slotLevel });
    const addendum = calculateAddendumAspect(playerConfigs, "spellSaveDCAddendum", { spell, spellcastingAbility, spellcastingAbilityModifier, slotLevel });

    return { dc, addendum };
}

export function calculateOtherFeatureActionAspect(playerConfigs, featureAction, aspectName, aspectBonusName, additionalParams = undefined) {
    const calculationsForActionAspect = [];

    // Start with the feature action's calculation
    calculationsForActionAspect.push(...featureAction[aspectName].calculation);
    
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

            if (aspectValue.calculation) {
                calculationsForActionAspect.push(...aspectValue.calculation);
            }
            else {
                calculationsForActionAspect.push({
                    type: "static",
                    value: aspectValue
                });
            }
        });
    }

    const amount = performDiceRollCalculation(playerConfigs, calculationsForActionAspect, { featureAction, ...additionalParams });
    return amount;
}

export function calculateOtherSpellAspect(playerConfigs, spell, slotLevel, aspectName, aspectBonusName, additionalParams = undefined) {
    const calculationsForSpellAspect = [];

    const spellcastingAbility = performMathCalculation(playerConfigs, spell.feature.spellcasting.ability.calculation);
    const spellcastingAbilityModifier = calculateAspectCollection(playerConfigs, spellcastingAbility + "Modifier");

    // Start with the spell's calculation
    calculationsForSpellAspect.push(...spell[aspectName].calculation);
    
    if (aspectBonusName) {
        // See if there are additional bonuses to apply to this aspect.
        findAllConfiguredAspects(playerConfigs, aspectBonusName, (aspectValue, typeFoundOn, playerConfigForObject) => {
            if (aspectValue.conditions) {
                const conditionsAreMet = performBooleanCalculation(playerConfigs, aspectValue.conditions, { spell, spellcastingAbility, spellcastingAbilityModifier, slotLevel, ...additionalParams });
                if (!conditionsAreMet) {
                    // We did not meet the conditions for this bonus to apply.
                    return;
                }
            }

            if (aspectValue.calculation) {
                calculationsForSpellAspect.push(...aspectValue.calculation);
            }
            else {
                calculationsForSpellAspect.push({
                    type: "static",
                    value: aspectValue
                });
            }
        });
    }

    const amount = performDiceRollCalculation(playerConfigs, calculationsForSpellAspect, { spell, spellcastingAbility, spellcastingAbilityModifier, slotLevel, ...additionalParams });
    return amount;
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
        let savingThrowString = "";
        for (let i = 0; i < savingThrowType.length; i++) {
            if (i > 0) {
                if (i === savingThrowType.length - 1) {
                    savingThrowString += " or ";
                } else {
                    savingThrowString += ", ";
                }
            }
            savingThrowString += getCapitalizedAbilityScoreName(savingThrowType[i]);
        }
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
        }
        else {
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
        for (let feature of aspectValue) {
            onFeatureFound(feature, typeFoundOn, playerConfigForObject);
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

    // Check the base player for the spect.
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
                    if (dndItem && dndItem.aspects && dndItem.aspects[aspectName]) {
                        onAspectFound(dndItem.aspects[aspectName], "item", item);
                    }
                }
            }
        }
    }

    if (playerConfigs?.currentStatus?.conditions) {
        const dndConditions = getCollection("conditions");
        const dndConditionsMap = convertArrayToDictionary(dndConditions, "name");
        // Some conditions cause other conditions, and we don't want to check any condition twice, this will help with that.
        const dndConditionsChecked = {};
        for (let playerCondition of playerConfigs?.currentStatus?.conditions) {
            findAspectFromCondition(dndConditionsChecked, dndConditionsMap, playerCondition.name, aspectName, (aspectValue) => onAspectFound(aspectValue, "condition", playerCondition));
        }
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
        if (singleCalculation.multiplier) {
            const multiplier = performMathCalculation(playerConfigs, singleCalculation.multiplier, parameters);

            if (isObject(singleValue)) {
                // This value to multipy against is a die object. Multiply each of the dice in it by the mulitplier.
                for (let key of Object.keys(singleValue)) {
                    singleValue[key] *= multiplier;
                }
            } else {
                // This value to multipy against is just simple numeric value. We can just multiply the two values.
                return singleValue * multiplier;
            }
        }

        return singleValue;
    };
    const performAddition = (currentTotal, valueToAdd) => {
        if (Array.isArray(valueToAdd)) {
            currentTotal["static"] = valueToAdd.join(", ");
        } else if (isObject(valueToAdd)) {
            // The value to add is a die object. Iterate through each of the dice and add them to our totals.
            for (let key of Object.keys(valueToAdd)) {
                if (currentTotal[key]) {
                    currentTotal[key] += valueToAdd[key];
                } else {
                    currentTotal[key] = valueToAdd[key];
                }
            }
        } else {
            // The value to add is just a numeric value. Add it to the "static" amount.
            if (currentTotal["static"]) {
                currentTotal["static"] += valueToAdd;
            } else {
                currentTotal["static"] = valueToAdd;
            }
        }

        return currentTotal;
    };

    const diceObject = performCalculation(playerConfigs, calculation, doSingleCalculationForSpecialTypes, performSpecialTransformations, performAddition, () => { return {}; }, parameters);

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

        return singleValue;
    };
    const performAddition = (currentTotal, valueToAdd) => {
        if (!currentTotal && !isNumeric(valueToAdd)) {
            return valueToAdd;
        } else if (isNumeric(valueToAdd)) {
            return currentTotal + parseInt(valueToAdd);
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
        let singleValue = doSingleCalculation(playerConfigs, singleCalculation, doSingleCalculationForSpecialTypes, parameters, (innerCalc) => performCalculation(playerConfigs, innerCalc, doSingleCalculationForSpecialTypes, performSpecialTransformations, performAddition, getDefaultValue, parameters));

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
        case "parameter":
            const parameterValue = getValueFromObjectAndPath(parameters, singleCalculation.propertyPath);
            return parameterValue;
        case "config":
            const configValue = getValueFromObjectAndPath(playerConfigs, singleCalculation.propertyPath);
            return configValue;
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
                return performOriginalCalculationType(singleCalculation.then);
            } else if (singleCalculation.else) {
                return performOriginalCalculationType(singleCalculation.else);
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