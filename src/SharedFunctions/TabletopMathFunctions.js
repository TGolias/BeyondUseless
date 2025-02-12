import { getCollection } from "../Collections";
import { getValueFromObjectAndPath } from "./ComponentFunctions";
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
        if (aspectValue.calcuation) {
            newArmorClass = performMathCalculation(playerConfigs, aspectValue.calcuation);
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
        if (aspectValue.calcuation) {
            armorClassBonus = performMathCalculation(playerConfigs, aspectValue.calcuation);
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
        if (aspectValue.calcuation) {
            initiativeBonus = performMathCalculation(playerConfigs, aspectValue.calcuation);
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
        if (aspectValue.calcuation) {
            newSpeed = performMathCalculation(playerConfigs, aspectValue.calcuation);
        }
        else {
            newSpeed = aspectValue;
        }

        if (newSpeed > speed) {
            speed = newSpeed;
        }
    });

    // Now that we are using the highest AC calculation, check for any other AC bonuses and add them to the score.
    findAllConfiguredAspects(playerConfigs, "speedBonus", (aspectValue, typeFoundOn, playerConfigForObject) => {
        let speedBonus;
        if (aspectValue.calcuation) {
            speedBonus = performMathCalculation(playerConfigs, aspectValue.calcuation);
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

export function calculateWeaponAttackBonus(playerConfigs, weapon, isThrown) {
    const calculationsForAttackBonus = [];

    const takeTheHighestOfTheseCalculations = [];
    if (weapon.weaponRange === "Ranged" || weapon.properties.includes("Finesse")) {
        takeTheHighestOfTheseCalculations.push([{
            type: "aspect",
            value: "dexterityModifier",
        }]);
    }
    if (weapon.weaponRange === "Melee") {
        takeTheHighestOfTheseCalculations.push([{
            type: "aspect",
            value: "strengthModifier",
        }]);
    }

    findAllConfiguredAspects(playerConfigs, "alternateWeaponAttackModifier", (aspectValue, typeFoundOn, playerConfigForObject) => {
        if (aspectValue.conditon) {
            const conditionsAreMet = performBooleanCalculation(playerConfigs, aspectValue.conditon, { weapon, isThrown });
            if (!conditionsAreMet) {
                // We did not meet the conditions for this alternate modifier to apply.
                return;
            }
        }

        if (aspectValue.calcuation) {
            takeTheHighestOfTheseCalculations.push(...aspectValue.calcuation);
        }
        else {
            takeTheHighestOfTheseCalculations.push({
                type: "static",
                value: aspectValue
            });
        }
    });

    calculationsForAttackBonus.push({
        type: "highestOf",
        values: takeTheHighestOfTheseCalculations
    });

    // Check if we should add the proficency bonus.
    if (weapon.tags) {
        const weaponProficienyMap = calculateAspectCollection(playerConfigs, "weaponProficiencies");
        const isProficient = weapon.tags.some(tag => weaponProficienyMap.includes(tag));
        if (isProficient) {
            calculationsForAttackBonus.push({
                type: "aspect",
                value: "proficiencyBonus",
            });
        }
    }
    
    // See if there are additoinal bonuses to apply to our attack.
    findAllConfiguredAspects(playerConfigs, "weaponAttackBonus", (aspectValue, typeFoundOn, playerConfigForObject) => {
        if (aspectValue.conditions) {
            const conditionsAreMet = performBooleanCalculation(playerConfigs, aspectValue.conditions, { weapon, isThrown });
            if (!conditionsAreMet) {
                // We did not meet the conditions for this bonus to apply.
                return;
            }
        }

        if (aspectValue.calcuation) {
            calculationsForAttackBonus.push(...aspectValue.calcuation);
        }
        else {
            calculationsForAttackBonus.push({
                type: "static",
                value: aspectValue
            });
        }
    });

    const amount = performMathCalculation(playerConfigs, calculationsForAttackBonus, { weapon, isThrown });
    return amount;
}

export function calculateWeaponDamage(playerConfigs, weapon, isThrown) {
    const calculationsForDamage = [...weapon.damage.calcuation];

    const takeTheHighestOfTheseCalculations = [];
    if (weapon.weaponRange === "Ranged" || weapon.properties.includes("Finesse")) {
        takeTheHighestOfTheseCalculations.push([{
            type: "aspect",
            value: "dexterityModifier",
        }]);
    }
    if (weapon.weaponRange === "Melee") {
        takeTheHighestOfTheseCalculations.push([{
            type: "aspect",
            value: "strengthModifier",
        }]);
    }

    findAllConfiguredAspects(playerConfigs, "alternateWeaponDamageModifier", (aspectValue, typeFoundOn, playerConfigForObject) => {
        if (aspectValue.conditon) {
            const conditionsAreMet = performBooleanCalculation(playerConfigs, aspectValue.conditon, { weapon, isThrown });
            if (!conditionsAreMet) {
                // We did not meet the conditions for this alternate modifier to apply.
                return;
            }
        }

        if (aspectValue.calcuation) {
            takeTheHighestOfTheseCalculations.push(...aspectValue.calcuation);
        }
        else {
            takeTheHighestOfTheseCalculations.push({
                type: "static",
                value: aspectValue
            });
        }
    });

    calculationsForDamage.push({
        type: "highestOf",
        values: takeTheHighestOfTheseCalculations
    });

    // See if there are additoinal bonuses to apply to our damage.
    findAllConfiguredAspects(playerConfigs, "weaponDamageBonus", (aspectValue, typeFoundOn, playerConfigForObject) => {
        if (aspectValue.conditon) {
            const conditionsAreMet = performBooleanCalculation(playerConfigs, aspectValue.conditon, { weapon, isThrown });
            if (!conditionsAreMet) {
                // We did not meet the conditions for this bonus to apply.
                return;
            }
        }

        if (aspectValue.calcuation) {
            calculationsForDamage.push(...aspectValue.calcuation);
        }
        else {
            calculationsForDamage.push({
                type: "static",
                value: aspectValue
            });
        }
    });

    const calculationString = performDiceRollCalculation(playerConfigs, calculationsForDamage, { weapon, isThrown });
    return calculationString;
}

export function calculateSpellAttack(playerConfigs, spell, slotLevel) {
    const calculationsForAttackBonus = [];

    const spellcastingAbility = performMathCalculation(playerConfigs, spell.feature.spellcasting.ability.calcuation);
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
            const conditionsAreMet = performBooleanCalculation(playerConfigs, aspectValue.conditions, { spell, spellcastingAbilityModifier, slotLevel });
            if (!conditionsAreMet) {
                // We did not meet the conditions for this bonus to apply.
                return;
            }
        }

        if (aspectValue.calcuation) {
            calculationsForAttackBonus.push(...aspectValue.calcuation);
        }
        else {
            calculationsForAttackBonus.push({
                type: "static",
                value: aspectValue
            });
        }
    });

    const amount = performDiceRollCalculation(playerConfigs, calculationsForAttackBonus, { spell, spellcastingAbilityModifier, slotLevel });
    return amount;
}

export function calculateSpellSaveDC(playerConfigs, spell, slotLevel) {
    const calculationsForSpellSaveDCBonus = [];


    const spellcastingAbility = performMathCalculation(playerConfigs, spell.feature.spellcasting.ability.calcuation);
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
            const conditionsAreMet = performBooleanCalculation(playerConfigs, aspectValue.conditions, { spell, spellcastingAbilityModifier, slotLevel });
            if (!conditionsAreMet) {
                // We did not meet the conditions for this bonus to apply.
                return;
            }
        }

        if (aspectValue.calcuation) {
            calculationsForSpellSaveDCBonus.push(...aspectValue.calcuation);
        }
        else {
            calculationsForSpellSaveDCBonus.push({
                type: "static",
                value: aspectValue
            });
        }
    });

    const amount = performDiceRollCalculation(playerConfigs, calculationsForSpellSaveDCBonus, { spell, spellcastingAbilityModifier, slotLevel });
    return amount;
}

export function calculateOtherSpellAspect(playerConfigs, spell, slotLevel, aspectName, aspectBonusName) {
    const calculationsForAttackBonus = [];

    const spellcastingAbility = performMathCalculation(playerConfigs, spell.feature.spellcasting.ability.calcuation);
    const spellcastingAbilityModifier = calculateAspectCollection(playerConfigs, spellcastingAbility + "Modifier");

    // Start with the spell's calculation
    calculationsForAttackBonus.push(...spell[aspectName].calcuation);
    
    if (aspectBonusName) {
        // See if there are additional bonuses to apply to this aspect.
        findAllConfiguredAspects(playerConfigs, aspectBonusName, (aspectValue, typeFoundOn, playerConfigForObject) => {
            if (aspectValue.conditions) {
                const conditionsAreMet = performBooleanCalculation(playerConfigs, aspectValue.conditions, { spell, spellcastingAbilityModifier, slotLevel });
                if (!conditionsAreMet) {
                    // We did not meet the conditions for this bonus to apply.
                    return;
                }
            }

            if (aspectValue.calcuation) {
                calculationsForAttackBonus.push(...aspectValue.calcuation);
            }
            else {
                calculationsForAttackBonus.push({
                    type: "static",
                    value: aspectValue
                });
            }
        });
    }

    const amount = performDiceRollCalculation(playerConfigs, calculationsForAttackBonus, { spell, spellcastingAbilityModifier, slotLevel });
    return amount;
}

export function calculateFeatures(playerConfigs) {
    const allFeatures = []

    findAllValidFeatures(playerConfigs, (feature, typeFoundOn, playerConfigForObject) => {
        allFeatures.push({ feature, typeFoundOn, playerConfigForObject });
    });

    return allFeatures;
}

function calculateFeatureNames(playerConfigs) {
    const allFeatureNames = []

    findAllValidFeatures(playerConfigs, (feature, typeFoundOn, playerConfigForObject) => {
        allFeatureNames.push(feature);
    });

    return allFeatureNames;
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
        case "features":
            return calculateFeatures(playerConfigs);
        case "featureNames": 
            return calculateFeatureNames(playerConfigs);
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
                totalAspectCollection[aspectValue] = true;
            }
        } else {
            // It is a property
            const aspectValue = getValueFromObjectAndPath(arrayOrProperty, pathToProperty);
            totalAspectCollection[aspectValue] = true;
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
        onAspectFound(baseAspectValue, "player", playerConfigs);
    }

    // Check the species for the aspect.
    const dndspecies = species.find(x => x.name === playerConfigs.species.name);
    const speciesAspectValue = getValueFromObjectAndPath(dndspecies, aspectName)
    if (speciesAspectValue) {
        onAspectFound(speciesAspectValue, "species", playerConfigs.species);
    }

    const allDndSpeciesFeatures = dndspecies.features ? [...dndspecies.features] : [];

    if (dndspecies.choices) {
        findAspectsFromChoice(playerConfigs, dndspecies, "species.choices.", aspectName, (aspectValue) => onAspectFound(aspectValue, "species", playerConfigs.species.choices));

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
                                onAspectFound(dndfeat.aspects[aspectName], "feats", playerConfigs.species.features[featurePropertyName]);
                            }

                            if (dndfeat.choices) {
                                findAspectsFromChoice(playerConfigs, dndfeat, "species.features." + featurePropertyName + ".choices.", aspectName, (aspectValue) => onAspectFound(aspectValue, "feats", speciesFeaturePlayerConfig.choices));
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

                    if (classFeature.feat) {
                        const selectedFeatName = classFeaturePlayerConfig?.name;
                        if (selectedFeatName) {
                            if (aspectName === "feat") {
                                onAspectFound(selectedFeatName, "feature", classFeaturePlayerConfig);
                            }

                            const dndfeat = feats.find(x => x.name === selectedFeatName);
                            if (dndfeat) {
                                if (dndfeat.aspects && dndfeat.aspects[aspectName]) {
                                    onAspectFound(dndfeat.aspects[aspectName], "feats", playerConfigs.classes[i].features[featurePropertyName]);
                                }

                                if (dndfeat.choices) {
                                    findAspectsFromChoice(playerConfigs, dndfeat, "classes[" + i + "].features." + featurePropertyName + ".choices.", aspectName, (aspectValue) => onAspectFound(aspectValue, "feats", classFeaturePlayerConfig.choices));
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
    const backgroundAspectValue = getValueFromObjectAndPath(dndBackground, aspectName);
    if (backgroundAspectValue) {
        onAspectFound(backgroundAspectValue, "background", playerConfigs.background);
    }

    if (dndBackground.feat) {
        const dndfeat = feats.find(x => x.name === dndBackground.feat);
        if (dndfeat && dndfeat.aspects && dndfeat.aspects[aspectName]) {
            onAspectFound(dndfeat.aspects[aspectName], "feats", playerConfigs.background);
        }

        if (dndfeat.choices) {
            findAspectsFromChoice(playerConfigs, dndfeat, "background.choices.", aspectName, (aspectValue) => onAspectFound(aspectValue, "feats", playerConfigs.background));
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
                    onAspectFound(dndItem.aspects[aspectName], "item", item);
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
        if (isObject(valueToAdd)) {
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

    const diceObject = performCalculation(playerConfigs, calculation, doSingleCalculationForSpecialTypes, performSpecialTransformations, performAddition, {}, parameters);

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
                }
            }
        }
    }
    return diceString.length === 0 ? "0" : diceString;
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
        }
        return currentTotal + valueToAdd;
    };

    return performCalculation(playerConfigs, calculation, doSingleCalculationForSpecialTypes, performSpecialTransformations, performAddition, 0, parameters);
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

        if (singleCalculation.lessThanOrEqualTo) {
            const valueToEqual = performMathCalculation(playerConfigs, singleCalculation.lessThanOrEqualTo, parameters)
            const valueToReturn = (singleValue <= valueToEqual);
            return valueToReturn;
        }

        if (singleCalculation.lessThanOrEqualTo) {
            const valueToEqual = performMathCalculation(playerConfigs, singleCalculation.lessThanOrEqualTo, parameters)
            const valueToReturn = (singleValue < valueToEqual);
            return valueToReturn;
        }

        if (singleCalculation.includes) {
            const valueThatShouldBeIncluded = performMathCalculation(playerConfigs, singleCalculation.includes, parameters)
            const valueToReturn = singleValue.includes(valueThatShouldBeIncluded);
            return valueToReturn;
        }

        return singleValue;
    };
    const performAddition = (currentTotal, valueToAdd) => {
        return currentTotal && valueToAdd;
    };

    return performCalculation(playerConfigs, calculation, doSingleCalculationForSpecialTypes, performSpecialTransformations, performAddition, true, parameters);
}

function performCalculation(playerConfigs, calculation, doSingleCalculationForSpecialTypes, performSpecialTransformations, performAddition, defaultValue, parameters) {
    let total = defaultValue;
    for (let i = 0; i < calculation.length; i++) {
        const singleCalculation = calculation[i];
        let singleValue = doSingleCalculation(playerConfigs, singleCalculation, doSingleCalculationForSpecialTypes, parameters, (innerCalc) => performCalculation(playerConfigs, innerCalc, doSingleCalculationForSpecialTypes, performSpecialTransformations, performAddition, defaultValue, parameters));

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
            return calculateAspectCollection(playerConfigs, singleCalculation.value);
        case "parameter":
            const parameterValue = getValueFromObjectAndPath(parameters, singleCalculation.propertyPath);
            return parameterValue;
        case "config":
            const configValue = getValueFromObjectAndPath(playerConfigs, singleCalculation.propertyPath);
            return configValue;
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
            }
            // If not true, we do not return: the performCalculationForSpecialTypes() will end up getting hit and should return the default value.
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
        dndItem = {...itemName2Item[itemName]};
        dndItem.name = originalDndItem.name;
    }
    return dndItem;
}