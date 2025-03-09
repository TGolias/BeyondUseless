import { getCollection } from "../Collections";
import { removeConcentrationFromPlayerConfigs } from "./ConcentrationFunctions";
import { AddOrUpdateCondition, RemoveConditionByName } from "./ConditionFunctions";

export function CheckIfPlayerDead(playerConfigs) {
    if (playerConfigs.currentStatus?.remainingHp === 0 && playerConfigs.currentStatus?.deathSavingThrowFailures > 2) {
        // Zero HP and 3 failed death saving throws.
        return true;
    }

    if (playerConfigs.currentStatus?.conditions?.some(condition => condition.name === "Exhaustion" && condition.level === 6)) {
        // Death by exhaustion.
        return true;
    }

    return false;
}

export function SetPlayerDead(playerConfigs) {
    playerConfigs.currentStatus = playerConfigs.currentStatus ? {...playerConfigs.currentStatus} : {};
    playerConfigs.currentStatus.conditions = playerConfigs.currentStatus.conditions ? [...playerConfigs.currentStatus.conditions] : [];

    playerConfigs.currentStatus.remainingHp = 0;
    playerConfigs.currentStatus.deathSavingThrowFailures = 3;

    if (playerConfigs.currentStatus.activeEffects) {
        playerConfigs.currentStatus.activeEffects = [...playerConfigs.currentStatus.activeEffects];
        removeConcentrationFromPlayerConfigs(playerConfigs);
    }

    playerConfigs.currentStatus.conditions = RemoveConditionByName(playerConfigs.currentStatus.conditions, "Unconscious");
}

export function SetPlayerRevived(playerConfigs) {
    playerConfigs.currentStatus = playerConfigs.currentStatus ? {...playerConfigs.currentStatus} : {};

    playerConfigs.currentStatus.deathSavingThrowFailures = 0;
    if (playerConfigs.currentStatus?.remainingHp === 0) {
        playerConfigs.currentStatus.remainingHp = 1;
    }

    const exhaustionCondition = playerConfigs.currentStatus?.conditions?.find(condition => condition.name === "Exhaustion")
    if (exhaustionCondition) {
        // Remove an Exhaustion level
        if (exhaustionCondition.level > 1) {
            const newExhaustionCondition = {...exhaustionCondition};
            newExhaustionCondition.level--;
            playerConfigs.currentStatus.conditions = AddOrUpdateCondition(playerConfigs.currentStatus.conditions, newExhaustionCondition) 
        } else {
            playerConfigs.currentStatus.conditions = RemoveConditionByName(playerConfigs.currentStatus.conditions, "Exhaustion")
        }
    }
}