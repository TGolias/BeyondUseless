export function GetVariableDisplayName(dndObject, variableName) {
    if (dndObject.variables) {
        const variableDefinition = dndObject.variables.find(x => x.name === variableName);
        if (variableDefinition) {
            return variableDefinition.displayName;
        }
    }
    return undefined;
}

export function GetCurrentVariableValue(objectConfig, dndObject, variableName) {
    if (dndObject.variables) {
        const variableDefinition = dndObject.find(x => x.name === variableName);
        if (variableDefinition) {
            const valueFromConfig = objectConfig[variableName]
            if (valueFromConfig) {
                return valueFromConfig;
            } else {
                return variableDefinition.initialValue;
            }
        }
    }
    return undefined;
}

export function SetVariableValueInConfig() {
    
}