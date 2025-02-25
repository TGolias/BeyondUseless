import { performMathCalculation } from "./TabletopMathFunctions";

export function GetUsesForResource(playerConfigs, resource, resourcesForLevel) {
    if (resource.uses && resource.uses.calculation) {
        const uses = performMathCalculation(playerConfigs, resource.uses.calculation);
        return uses;
    } else {
        const uses = resourcesForLevel[resource.name];
        return uses;
    }
}