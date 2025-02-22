import { GetUsesForResource } from "./ResourcesFunctions";
import { getAllPlayerDNDClasses } from "./TabletopMathFunctions";

export function SetPlayerShortRested(playerConfigs) {
    const allPlayerClasses = getAllPlayerDNDClasses(playerConfigs);
    if (allPlayerClasses) {
        // See if any of the class resources get restored.
        for (let i = 0; i < allPlayerClasses.length; i++) {
            const dndClass = allPlayerClasses[i];
            const classConfig = playerConfigs.classes[i];
            if (dndClass.resources) {
                for (let resource of dndClass.resources) {
                    const shortRestRecharge = resource.shortRestRecharge;
                    if (shortRestRecharge) {
                        const remainingResources = playerConfigs?.currentStatus?.remainingResources ? playerConfigs?.currentStatus?.remainingResources[resource.name] : undefined;
                        if (remainingResources || remainingResources === 0) {
                            const resourcesForThisLevel = dndClass.resourcesPerLevel[classConfig.levels - 1];
                            const maxResourcesForThisLevel = GetUsesForResource(playerConfigs, resource, resourcesForThisLevel);
                            let newResourceAmount = remainingResources + shortRestRecharge;
                            if (newResourceAmount > maxResourcesForThisLevel) {
                                newResourceAmount = maxResourcesForThisLevel;
                            }
                            playerConfigs.currentStatus.remainingResources[resource.name] = newResourceAmount;
                        }
                    }
                }
            }
        }
    }
}

export function SetPlayerLongRested(playerConfigs) {
    // Clear out most of current status. There will be a couple things the stick around after a long rest, but most are cleared.
    const newCurrentStatus = {};

    // Heroic inspiration sticks around.
    newCurrentStatus.heroicInspiration = playerConfigs.currentStatus?.heroicInspiration;

    // Check if we had the exhaustion condition.
    const exhaustionCondition = playerConfigs.currentStatus?.conditions?.find(condition => condition.name === "Exhaustion")
    if (exhaustionCondition) {
        // Remove an Exhaustion level
        if (exhaustionCondition.level > 1) {
            const newExhaustionCondition = {...exhaustionCondition};
            newExhaustionCondition.level--;
            newCurrentStatus.conditions = [newExhaustionCondition] 
        }
    }

    playerConfigs.currentStatus = newCurrentStatus;
}