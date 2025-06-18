import { performMathCalculation } from "./TabletopMathFunctions";

export function GetMaxUsesForResource(playerConfigs, resource, playerConfigsForResource) {
    if (resource.combineGlobalResources) {
        let uses = 0;
        for (let i = 0; i < resource.subResources.length; i++) {
            const maxCalculation = resource.subResources[i].maxCalculation;
            const usesFromSource = performMathCalculation(playerConfigs, maxCalculation, playerConfigsForResource);
            uses += usesFromSource;
        }
        return uses;
    } else {
        const uses = performMathCalculation(playerConfigs, resource.uses.calculation, playerConfigsForResource);
        return uses;
    }
}

export function HasUsedAnyOfResource(playerConfigs, resource) {
    if (resource.combineGlobalResources) {
        if (playerConfigs?.currentStatus?.remainingResources) {
            for (let i = 0; i < resource.subResources.length; i++) {
                const subName = resource.subResources[i].subName;
                const amountRemaining = playerConfigs.currentStatus.remainingResources[resource.name + subName];
                if (amountRemaining !== undefined) {
                    return true;
                }
            }
        }

        return false;
    } else {
        return playerConfigs?.currentStatus?.remainingResources && playerConfigs?.currentStatus?.remainingResources[resource.name] !== undefined;
    }
}

export function GetRemainingUsesForResource(playerConfigs, resource) {
    if (resource.combineGlobalResources) {
        let remainingUses = 0;

        for (let i = 0; i < resource.subResources.length; i++) {
            const subName = resource.subResources[i].subName;
            let amountRemaining = playerConfigs?.currentStatus?.remainingResources ? playerConfigs.currentStatus.remainingResources[resource.name + subName] : undefined;
            if (amountRemaining === undefined) {
                const maxCalculation = resource.subResources[i].maxCalculation;
                const maxUsesFromSource = performMathCalculation(playerConfigs, maxCalculation);
                amountRemaining = maxUsesFromSource;
            }

            remainingUses += amountRemaining;
        }

        return remainingUses;
    } else {
        let amountRemaining = playerConfigs?.currentStatus?.remainingResources ? playerConfigs?.currentStatus?.remainingResources[resource.name] : undefined;
        if (amountRemaining === undefined) {
            amountRemaining = resource.maxUses;
        }
        return amountRemaining;
    }
}

export function SetRemainingUsesForResource(playerConfigs, newCurrentStatus, resource, newResourceAmount) {
    newCurrentStatus.remainingResources = newCurrentStatus.remainingResources ? {...newCurrentStatus.remainingResources} : {};

    if (resource.combineGlobalResources) {
        let currentTotal = resource.remainingUses;
        let newTotal = newResourceAmount;

        if (newTotal > currentTotal) {
            let totalToAdd = newTotal - currentTotal;
            for (let i = 0; i < resource.subResources.length; i++) {
                const subName = resource.subResources[i].subName;
                const maxCalculation = resource.subResources[i].maxCalculation;
                const maxUsesFromSource = performMathCalculation(playerConfigs, maxCalculation);
                let currentAmount = playerConfigs?.currentStatus?.remainingResources[resource.name + subName];
                if (currentAmount !== undefined) {
                    const targetRestoreAmount = maxUsesFromSource - currentAmount;
                    if (targetRestoreAmount > 0) {
                        if (totalToAdd >= targetRestoreAmount) {
                            // We had enough to restore the full restore.
                            delete newCurrentStatus.remainingResources[resource.name + subName];
                            totalToAdd -= targetRestoreAmount;
                            
                        } else {
                            // We could only partially restore the resource.
                            newCurrentStatus.remainingResources[resource.name + subName] = (currentAmount + totalToAdd);
                            totalToAdd = 0;
                        }

                        if (totalToAdd <= 0) {
                            // We can't restore any more of this resource. Time to quit out.
                            break;
                        }
                    }
                }
            }
        }

        if (newTotal < currentTotal) {
            let totalToSubtract = currentTotal - newTotal;
            for (let i = resource.subResources.length - 1; i >= 0; i--) {
                const subName = resource.subResources[i].subName;
                const maxCalculation = resource.subResources[i].maxCalculation;
                const maxUsesFromSource = performMathCalculation(playerConfigs, maxCalculation);
                let currentAmount = playerConfigs?.currentStatus?.remainingResources[resource.name + subName];
                if (currentAmount === undefined) {
                    currentAmount = maxUsesFromSource;
                }

                const targetSubtractAmount = currentAmount;
                if (targetSubtractAmount > 0) {
                    if (totalToSubtract >= targetSubtractAmount) {
                        // We fully used up this resource.
                        newCurrentStatus.remainingResources[resource.name + subName] = 0;
                        totalToSubtract -= targetSubtractAmount;
                        
                    } else {
                        // We only used part of this resource.
                        newCurrentStatus.remainingResources[resource.name + subName] = (currentAmount - totalToSubtract);
                        totalToSubtract = 0;
                    }

                    if (totalToSubtract <= 0) {
                        // We don't have any more of this resource to remove any of.
                        break;
                    }
                }
            }
        }

        if (currentTotal > newTotal) {

        }
    } else {
        if (newResourceAmount > resource.maxUses) {
            newResourceAmount = resource.maxUses;
        }
        newCurrentStatus.remainingResources[resource.name] = newResourceAmount;
    }
}