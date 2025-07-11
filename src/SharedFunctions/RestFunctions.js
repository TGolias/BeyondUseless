import { GetRemainingUsesForResource, HasUsedAnyOfResource, SetRemainingUsesForResource } from "./ResourcesFunctions";
import { calculateHeroicInspirationLongRestRecharge, getAllStandardResourcesForCharacter } from "./TabletopMathFunctions";

export function SetPlayerShortRested(playerConfigs) {
    // Reset pact slots.
    if (playerConfigs.currentStatus) {
        delete playerConfigs.currentStatus.remainingPactSlots;
    }

    // Check resources.
    const allResources = getAllStandardResourcesForCharacter(playerConfigs);
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

    
    if (playerConfigs.currentStatus.activeEffects && playerConfigs.currentStatus.activeEffects.length > 0) {
        const activeEffectsToKeepAfterLongRest = playerConfigs.currentStatus.activeEffects.filter(effect => {
            if (effect.allies && effect.allies.length > 0) {
                // Creature active effects.
                return true;
            }

            if (effect.indefinite) {
                // Effect is indefinite.
                return true;
            }

            return false;
        });
        if (activeEffectsToKeepAfterLongRest && activeEffectsToKeepAfterLongRest.length > 0) {
            newCurrentStatus.activeEffects = [...activeEffectsToKeepAfterLongRest];
        }
    }

    // Check resources.
    const allResources = getAllStandardResourcesForCharacter(playerConfigs);
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

    playerConfigs.currentStatus = newCurrentStatus;
}