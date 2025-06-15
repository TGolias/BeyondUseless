import { getNameDictionaryForCollection } from "../Collections";
import { GetUsesForResource } from "./ResourcesFunctions";
import { calculateHeroicInspirationLongRestRecharge, getAllPlayerDNDClasses } from "./TabletopMathFunctions";

export function SetPlayerShortRested(playerConfigs) {
    // Reset pact slots.
    if (playerConfigs.currentStatus) {
        delete playerConfigs.currentStatus.remainingPactSlots;
    }

    // Check class resources.
    const allPlayerClasses = getAllPlayerDNDClasses(playerConfigs);
    if (allPlayerClasses) {
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
                            const maxResourcesForThisLevel = GetUsesForResource(playerConfigs, resource, resourcesForThisLevel, classConfig);
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
    newCurrentStatus.heroicInspiration = playerConfigs.currentStatus?.heroicInspiration || calculateHeroicInspirationLongRestRecharge(playerConfigs);

    // Check if we had the exhaustion condition.
    const exhaustionCondition = playerConfigs.currentStatus?.conditions?.find(condition => condition.name === "Exhaustion");
    if (exhaustionCondition) {
        // Remove an Exhaustion level
        if (exhaustionCondition.level > 1) {
            const newExhaustionCondition = {...exhaustionCondition};
            newExhaustionCondition.level--;
            newCurrentStatus.conditions = [newExhaustionCondition] 
        }
    }

    // Creature active effects.
    if (playerConfigs.currentStatus.activeEffects && playerConfigs.currentStatus.activeEffects.length > 0) {
        const creatureActiveEffects = playerConfigs.currentStatus.activeEffects.filter(effect => effect.allies && effect.allies.length > 0);
        if (creatureActiveEffects && creatureActiveEffects.length > 0) {
            newCurrentStatus.activeEffects = [...creatureActiveEffects];
        }
    }

    if (playerConfigs.homebrew && playerConfigs.homebrew.length > 0) {
        const homebrewMap = getNameDictionaryForCollection("homebrew");
        for (let homebrew of playerConfigs.homebrew) {
            const dndHomebrew = homebrewMap[homebrew.name];
            if (dndHomebrew && dndHomebrew.resources && dndHomebrew.resources.length > 0) {
                for (let resource of dndHomebrew.resources) {
                    const longRestRecharge = resource.longRestRecharge;
                    if (longRestRecharge || longRestRecharge === 0) {
                        const remainingResources = playerConfigs?.currentStatus?.remainingResources ? playerConfigs?.currentStatus?.remainingResources[resource.name] : undefined;
                        if (remainingResources || remainingResources === 0) {
                            const maxResourcesForThisLevel = GetUsesForResource(playerConfigs, resource, undefined, homebrew);
                            let newResourceAmount = remainingResources + longRestRecharge;
                            if (newResourceAmount > maxResourcesForThisLevel) {
                                newResourceAmount = maxResourcesForThisLevel;
                            }

                            if (!newCurrentStatus.remainingResources) {
                                newCurrentStatus.remainingResources = {};
                            }
                            newCurrentStatus.remainingResources[resource.name] = newResourceAmount;
                        }
                    }
                }
            }
        }
    }

    playerConfigs.currentStatus = newCurrentStatus;
}