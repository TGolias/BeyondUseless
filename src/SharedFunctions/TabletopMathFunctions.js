import { classes } from "../App";

export function calculateModifierForBaseStat(baseStatValue) {
    return Math.floor((baseStatValue - 10) / 2);
}

export function calculateHPMax(playerConfigs) {
    const dndclass = classes.find(x => x.name === playerConfigs.class);
    const hpFromClassPerLevelAfter1 = (dndclass.hitDie / 2) + 1;
    const hpFromConsitutionPerLevelAfter1 = calculateModifierForBaseStat(playerConfigs.baseStats.constitution);
    const maxHp = dndclass.hitDie + ((playerConfigs.level - 1) * (hpFromClassPerLevelAfter1 + hpFromConsitutionPerLevelAfter1));
    return maxHp;
}