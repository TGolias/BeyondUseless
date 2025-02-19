export function AddOrUpdateCondition(conditions, newCondition) {
    const newConditions = [...(conditions ?? [])];
    const existingCurrentCondition = newConditions.find(condition => condition.name === newCondition.name);
    if (existingCurrentCondition) {
        const indexToReplace = newConditions.indexOf(existingCurrentCondition);
        newConditions[indexToReplace] = newCondition;
    } else {
        newConditions.push(newCondition);
    }
    return newConditions;
}

export function RemoveConditionByName(conditions, conditionNameToRemove) {
    let newConditions = undefined
    if (conditions) {
        const existingCondition = conditions.find(condition => condition.name === conditionNameToRemove);
        if (existingCondition) {
            const indexToRemove = conditions.indexOf(existingCondition);
            newConditions = [...conditions];
            newConditions.splice(indexToRemove, 1);
        }
    }
    return newConditions;
}