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