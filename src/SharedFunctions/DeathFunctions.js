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
    if (!playerConfigs.currentStatus) {
        playerConfigs.currentStatus = {}
    } else {
        playerConfigs.currentStatus = {...playerConfigs.currentStatus}
    }

    playerConfigs.currentStatus.remainingHp = 0;
    playerConfigs.currentStatus.deathSavingThrowFailures = 3;
}

export function SetPlayerRevived(playerConfigs) {
    if (!playerConfigs.currentStatus) {
        playerConfigs.currentStatus = {}
    } else {
        playerConfigs.currentStatus = {...playerConfigs.currentStatus}
    }

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