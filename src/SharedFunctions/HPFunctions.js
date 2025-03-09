import { calculateHPMax } from "./TabletopMathFunctions";

export function calculateCurrentHp(playerConfigs, hpMax = undefined) {
    let maxHp = hpMax;
    if (!maxHp) {
        maxHp = calculateHPMax(playerConfigs);
    }

    const currentHp = (!!playerConfigs.currentStatus.remainingHp || playerConfigs.currentStatus.remainingHp === 0) ? playerConfigs.currentStatus.remainingHp : maxHp;
    return currentHp;
}