import { getCollection } from "../Collections";
import { computeAverageDiceRoll, performDiceRollCalculation, performMathCalculation } from "./TabletopMathFunctions";
import { convertArrayToDictionary } from "./Utils";

export function createStatBlockMap() {
    const allStatBlocks = getCollection("statblocks");
    const statBlockMap = convertArrayToDictionary(allStatBlocks, "name");
    return statBlockMap;
}

export function createNewAlliedCreatureFromStatBlock(playerConfigs, statBlock, creatureName, activeEffect) {
    const hpDice = performDiceRollCalculation(playerConfigs, statBlock.hp.calculation, { activeEffect })
    const averageHp = computeAverageDiceRoll(hpDice);

    const alliedCreature = {
        name: creatureName,
        title: statBlock.name + " - " + statBlock.creatureType + ", " + statBlock.alignment,
        level: statBlock.cr,
        size: statBlock.size,
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
            alliedCreature[aspectName] = performMathCalculation(playerConfigs, statBlock.aspects[aspectName], { activeEffect });
        }
    }

    return alliedCreature;
}