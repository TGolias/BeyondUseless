import { classes } from "../App";

export function calculateModifierForBaseStat(baseStatValue) {
    return Math.floor((baseStatValue - 10) / 2);
}

export function calculateHPMax(playerConfigs) {
    const dndclass = classes.find(x => x.name === playerConfigs.classes[0].name); // TODO: FOR NOW WE'RE JUST DOING THE FIRST CLASS, WE'LL FIX THIS LATER
    const hpFromClassPerLevelAfter1 = (dndclass.hitDie / 2) + 1;
    const hpFromConsitutionPerLevel = calculateModifierForBaseStat(playerConfigs.baseStats.constitution);
    const hpAtLevel1 = dndclass.hitDie + hpFromConsitutionPerLevel
    
    const maxHp = hpAtLevel1 + ((playerConfigs.level - 1) * (hpFromClassPerLevelAfter1 + hpFromConsitutionPerLevel));
    return maxHp;
}