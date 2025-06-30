import { getItemFromId } from "./ItemFunctions";

export function GetVariableDisplayName(origin, variableName) {
    if (origin.value.variables) {
        const variableDefinition = origin.value.variables.find(x => x.name === variableName);
        if (variableDefinition) {
            return variableDefinition.displayName;
        }
    }
    return undefined;
}

export function GetCurrentVariableValue(playerConfigs, origin, variableName) {
    switch (origin.type) {
        case "item":
            const objectConfig = getItemFromId(playerConfigs.items, origin.id);
            if (objectConfig) {
                return GetCurrentVariableValueFromObjectConfig(objectConfig, origin.value, variableName)
            }
            break;
    }
    return undefined;
}

function GetCurrentVariableValueFromObjectConfig(objectConfig, dndObject, variableName) {
    if (dndObject.variables) {
        const variableDefinition = dndObject.variables.find(x => x.name === variableName);
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

export function SetCurrentVariableValue(playerConfigs, origin, variableName, newValue) {
    switch (origin.type) {
        case "item":
            const objectConfig = getItemFromId(playerConfigs.items, origin.id);
            if (objectConfig) {
                return SetCurrentVariableValueInObjectConfig(objectConfig, origin.value, variableName, newValue)
            }
            break;
    }
    return undefined;
}

function SetCurrentVariableValueInObjectConfig(objectConfig, dndObject, variableName, newValue) {
    if (dndObject.variables) {
        const variableDefinition = dndObject.variables.find(x => x.name === variableName);
        if (variableDefinition) {
            objectConfig[variableName] = newValue;
        }
    }
    return undefined;
}