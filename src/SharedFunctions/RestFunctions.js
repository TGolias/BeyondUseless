import { getNameDictionaryForCollection } from "../Collections";
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

    // conditions to reduce on long rest.
    const conditions = playerConfigs.currentStatus?.conditions;
    if (conditions && conditions.length) {
        const newConditions = [];
        const dndConditionsMap = getNameDictionaryForCollection("conditions");
        for (let i = 0; i < conditions.length; i++) {
            const condition = conditions[i];
            const dndCondition = dndConditionsMap[condition.name];
            if (dndCondition && dndCondition.type && dndCondition.type.includes('level')) {
                if (dndCondition.levelsToReduceOnLongRest) {
                    const newLevelCondition = {...condition};
                    newLevelCondition.level--;
                    newConditions.push(newLevelCondition);
                }
            }
        }

        if (newConditions.length) {
            newCurrentStatus.conditions = newConditions;
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