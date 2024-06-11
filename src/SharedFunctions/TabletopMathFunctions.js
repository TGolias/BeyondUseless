import { classes } from "../App";

export function calculateModifierForBaseStat(baseStatValue) {
    return Math.floor((baseStatValue - 10) / 2);
}

export function calculateHPMax(playerConfigs) {
    const dndClasses = []
    for (let i = 0; i < playerConfigs.classes.length; i++) {
        const dndClass = classes.find(x => x.name === playerConfigs.classes[i].name);
        dndClasses.push(dndClass);
    }

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