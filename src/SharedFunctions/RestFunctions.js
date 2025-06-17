import { getNameDictionaryForCollection } from "../Collections";
import { GetRemainingUsesForResource, HasUsedAnyOfResource, SetRemainingUsesForResource } from "./ResourcesFunctions";
import { calculateHeroicInspirationLongRestRecharge, getAllPlayerDNDClasses, getAllResourcesForObject } from "./TabletopMathFunctions";

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
                const allResources = getAllResourcesForObject(playerConfigs, dndClass, "class", classConfig);
                for (let resource of allResources) {
                    const shortRestRecharge = resource.shortRestRecharge;
                    if (shortRestRecharge) {
                        const canBeRecharged = HasUsedAnyOfResource(playerConfigs, resource);
                        if (canBeRecharged) {
                            const remainingResources = GetRemainingUsesForResource(playerConfigs, resource);
                            let newResourceAmount = remainingResources + shortRestRecharge;
                            SetRemainingUsesForResource(playerConfigs, playerConfigs.currentStatus, resource, newResourceAmount);
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
            newCurrentStatus.conditions = [newExhaustionCondition];
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
                const allResources = getAllResourcesForObject(playerConfigs, dndHomebrew, "homebrew", homebrew);
                for (let resource of allResources) {
                    const longRestRecharge = resource.longRestRecharge;
                    if (longRestRecharge || longRestRecharge === 0) {
                        const canBeRecharged = HasUsedAnyOfResource(playerConfigs, resource);
                        if (canBeRecharged) {
                            const remainingResources = GetRemainingUsesForResource(playerConfigs, resource);
                            let newResourceAmount = remainingResources + longRestRecharge;
                            SetRemainingUsesForResource(playerConfigs, newCurrentStatus, resource, newResourceAmount);
                        }
                    }
                }
            }
        }
    }

    playerConfigs.currentStatus = newCurrentStatus;
}