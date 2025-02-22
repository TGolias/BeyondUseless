import { performMathCalculation } from "./TabletopMathFunctions";

export function GetUsesForResource(playerConfigs, resource, resourcesForLevel) {
    if (resource.uses && resource.uses.calcuation) {
        const uses = performMathCalculation(playerConfigs, resource.uses.calcuation);
        return uses;
    } else {
        resource.maxUses = resourcesForLevel[resource.name];
    }
}