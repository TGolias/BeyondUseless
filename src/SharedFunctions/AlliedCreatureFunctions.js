import { getCollection } from "../Collections";
import { calculateSpellAttack, computeAverageDiceRoll, performDiceRollCalculation, performMathCalculation } from "./TabletopMathFunctions";
import { convertArrayToDictionary } from "./Utils";

export function createStatBlockMap() {
    const allStatBlocks = getCollection("statblocks");
    const statBlockMap = convertArrayToDictionary(allStatBlocks, "name");
    return statBlockMap;
}

export function createNewAlliedCreatureFromStatBlock(playerConfigs, statBlock, creatureName, creatureCalculationParams) {
    const hpDice = performDiceRollCalculation(playerConfigs, statBlock.hp.calculation, creatureCalculationParams)
    const averageHp = computeAverageDiceRoll(hpDice);
    const creatureType = getCalculationOrValue(playerConfigs, statBlock.creatureType, creatureCalculationParams);

    const alliedCreature = {
        name: getCalculationOrValue(playerConfigs, creatureName, creatureCalculationParams),
        creatureType: creatureType,
        title: getCalculationOrValue(playerConfigs, statBlock.name, creatureCalculationParams) + " - " + creatureType + ", " + getCalculationOrValue(playerConfigs, statBlock.alignment, creatureCalculationParams),
        level: getCalculationOrValue(playerConfigs, statBlock.cr, creatureCalculationParams),
        size: getCalculationOrValue(playerConfigs, statBlock.size, creatureCalculationParams),
        maxHpOverride: averageHp,
        abilityScores: {...statBlock.abilityScores},
        background: {},
        species: {},
        languages: [],
        classes: [],
        items: [],
        statBlocks: [statBlock.name],
        currentStatus: {}
    }

    if (statBlock.precomputedAspects) {
        for (let aspectName of Object.keys(statBlock.precomputedAspects)) {
            const precomputedAspect = statBlock.precomputedAspects[aspectName];
            alliedCreature[aspectName] = performMathCalculation(playerConfigs, precomputedAspect.calculation, creatureCalculationParams);
        }
    }

    return alliedCreature;
}

function getCalculationOrValue(playerConfigs, value, creatureCalculationParams) {
    if (value && value.calculation) {
        return performMathCalculation(playerConfigs, value.calculation, creatureCalculationParams);
    } else {
        return value;
    }
}