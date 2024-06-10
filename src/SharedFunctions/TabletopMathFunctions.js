import { classes } from "../App";

export function calculateModifierForBaseStat(baseStatValue) {
    return Math.floor((baseStatValue - 10) / 2);
}

export function calculateHPMax(playerConfigs) {
    const dndclass = classes.find(x => x.name === playerConfigs.class);
    const hpFromClassPerLevelAfter1 = (dndclass.hitDie / 2) + 1;
    const hpFromConsitutionPerLevel = calculateModifierForBaseStat(playerConfigs.baseStats.constitution);
    const hpAtLevel1 = dndclass.hitDie + hpFromConsitutionPerLevel
    
    const maxHp = hpAtLevel1 + ((playerConfigs.level - 1) * (hpFromClassPerLevelAfter1 + hpFromConsitutionPerLevel));
    return maxHp;
}