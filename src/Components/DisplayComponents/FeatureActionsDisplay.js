import React from 'react';
import './FeatureActionsDisplay.css';
import { getCastingTimeShorthand } from '../../SharedFunctions/ComponentFunctions';
import { getNameDictionaryForCollection } from '../../Collections';
import { playAudio } from '../../SharedFunctions/Utils';
import { GetUsesForResource } from '../../SharedFunctions/ResourcesFunctions';
import { performMathCalculation } from '../../SharedFunctions/TabletopMathFunctions';

const featureActionRows = [
    {
        name: "Action Name",
        calculateValue: (playerConfigs, action) => {
            return action.name;
        },
        addClass: "firstCol"
    },
    {
        name: "Action Time",
        calculateValue: (playerConfigs, action) => {
            let actionTime = "";
            if (Array.isArray(action.actionTime)) {
                for (let singleActionTime of action.actionTime) {
                    if (actionTime.length > 0) {
                        actionTime += " or ";
                    }
                    actionTime += getCastingTimeShorthand(singleActionTime);
                }
            }
            return actionTime;
        },
        addClass: "lastCol"
    },
];

export function FeatureActionsDisplay({playerConfigs, actionFeatures, setCenterScreenMenu}) {
    const resourceName2Actions = {};
    const resourceName2Resource = {};
    for (let actionFeature of actionFeatures) {
        for (let action of actionFeature.feature.actions) {
            const featureOrigin = getFeatureOrigin(actionFeature);
            if (action.cost || action.restoreResource) {
                let resourceType;
                if (action.restoreResource) {
                    resourceType = performMathCalculation(playerConfigs, action.restoreResource.resourceName.calculation);
                } else {
                    resourceType = action.cost.resourceType;
                }

                if (resourceType) {
                    if (!resourceName2Actions[resourceType]) {
                        resourceName2Resource[resourceType] = getResourceForResourceType(playerConfigs, actionFeature, resourceType);
                        resourceName2Actions[resourceType] = [];
                    }
                    resourceName2Actions[resourceType].push({ action, feature: actionFeature.feature, origin: featureOrigin })
                } else if (action.cost && action.cost.uses) {
                    resourceName2Resource[action.name] = getResourceForUses(playerConfigs, action);
                    resourceName2Actions[action.name] = [{ action, feature: actionFeature.feature, origin: featureOrigin }];
                }
            } else {
                if (!resourceName2Resource.atWill) {
                    resourceName2Resource.atWill = getResourceForAtWill();
                    resourceName2Actions.atWill = [];
                }
                resourceName2Actions.atWill.push({ action, feature: actionFeature.feature, origin: featureOrigin });
            }
        }
    }

    const controlsToDisplay = []
    for (let resourceName of Object.keys(resourceName2Actions)) {
        const actionsForResource = resourceName2Actions[resourceName];
        const resource = resourceName2Resource[resourceName];
        controlsToDisplay.push(createSingleFeatureActionsGroup(playerConfigs, setCenterScreenMenu, resource.displayName, actionsForResource, resource));
    }

    return (
        <>
            <div className='featureActionsDisplayOutermostDiv'>{controlsToDisplay}</div>
        </>
    )
}

function createSingleFeatureActionsGroup(playerConfigs, setCenterScreenMenu, groupName, actionsForResource, resource = undefined) {
    const actionsGrouping = [];
    actionsGrouping.push(<div className='featureActionsDisplayTitle'>{groupName}</div>);

    if (resource) {
        if (resource.maxUses > 4) {
            const remainingUsesString = resource.remainingUses + "/" + resource.maxUses;
            actionsGrouping.push(<div className='featureActionsDisplayResourceUsesText'>{remainingUsesString}</div>);
        } else {
            let remainingUsesString = "";
            const expendedUses = resource.maxUses - resource.remainingUses;
            for (let i = 0; i < resource.maxUses; i++) {
                if (i > 0) {
                    remainingUsesString += " ";
                }
                if (i < expendedUses) {
                    remainingUsesString += "X";
                } else {
                    remainingUsesString += "O";
                }
            }
            actionsGrouping.push(<div className='featureActionsDisplayResourceUsesIcons'>{remainingUsesString}</div>);
        }
        
    }

    const actionRows = [];
    for (let row of featureActionRows) {
        actionRows.push(<div className={row.addClass}>{row.name}</div>);
    }

    for (let actionForResource of actionsForResource) {
        const action = actionForResource.action;
        for (let row of featureActionRows) {
            actionRows.push(<div onClick={() => openMenuForFeatureAction(action, actionForResource.feature, actionForResource.origin, resource, setCenterScreenMenu)} className={row.addClass ? "featureActionsDisplayRow " + row.addClass : "featureActionsDisplayRow"}>{row.calculateValue(playerConfigs, action)}</div>);
        }
    }

    actionsGrouping.push(<div className='featureActionsDisplayGrid'>{actionRows}</div>);
    
    return (<>
        <div className='featureActionsSingleGroup pixel-corners'>{actionsGrouping}</div>
    </>);
}

function openMenuForFeatureAction(featureActon, feature, origin, resource, setCenterScreenMenu) {
    playAudio("menuaudio");
    setCenterScreenMenu({ show: true, menuType: "FeatureActionMenu", data: { menuTitle: featureActon.name, featureAction: featureActon, feature: feature, origin: origin, resource: resource } });
}

function getResourceForResourceType(playerConfigs, actionFeature, resourceName) {
    const originName = actionFeature.playerConfigForObject.name;
    let dndClass = undefined;

    switch (actionFeature.typeFoundOn) {
        case "class":
            if (originName) {
                const allClassesMap = getNameDictionaryForCollection("classes");
                dndClass = allClassesMap[originName];
            }
            break;
        case "subclass":
            if (originName) {
                const allSubclassesMap = getNameDictionaryForCollection("subclasses");
                const dndSubclass = allSubclassesMap[originName];
                if (dndSubclass) {
                    const allClassesMap = getNameDictionaryForCollection("classes");
                    dndClass = allClassesMap[dndSubclass.class];
                }
            }
            break;
        case "feat":
            if (originName) {
                const allFeatsMap = getNameDictionaryForCollection("feats");
                const feat = allFeatsMap[originName];
                const featResource = feat.resources.find(resource => resource.name === resourceName);
                const resource = {...featResource};

                resource.maxUses = GetUsesForResource(playerConfigs, featResource, undefined, actionFeature.playerConfigForObject);

                let remainingUses;
                if (playerConfigs.currentStatus?.remainingResources && (playerConfigs.currentStatus.remainingResources[resource.name] || playerConfigs.currentStatus.remainingResources[resource.name] === 0)) {
                    remainingUses = playerConfigs.currentStatus.remainingResources[resource.name];
                } else {
                    remainingUses = resource.maxUses;
                }
                resource.remainingUses = remainingUses;
                return resource;
            }
            break;
        case "homebrew":
            if (originName) {
                const allHomebrewMap = getNameDictionaryForCollection("homebrew");
                const homebrew = allHomebrewMap[originName];
                const homwbrewResource = homebrew.resources.find(resource => resource.name === resourceName);
                const resource = {...homwbrewResource};

                resource.maxUses = GetUsesForResource(playerConfigs, homwbrewResource, undefined, actionFeature.playerConfigForObject);

                let remainingUses;
                if (playerConfigs.currentStatus?.remainingResources && (playerConfigs.currentStatus.remainingResources[resource.name] || playerConfigs.currentStatus.remainingResources[resource.name] === 0)) {
                    remainingUses = playerConfigs.currentStatus.remainingResources[resource.name];
                } else {
                    remainingUses = resource.maxUses;
                }
                resource.remainingUses = remainingUses;
                return resource;
            }
            break;
    }

    if (dndClass) {
        // TODO: Continue here next time. Need to be able to retrieve global resources and have them be their own thing as far is this is concerned here.
        const classResource = dndClass.resources.find(resource => resource.name === resourceName || resource.combineGlobalResources && (resource.name + resource.subName) === resourceName);
        const resource = {...classResource};
        if (resource.name !== resourceName && resource.combineGlobalResources) {
            resource.displayName = resource.subDisplayName + " " + resource.displayName;
        }

        const classLevel = actionFeature.playerConfigForObject.levels;
        resource.classLevel = classLevel;
        const resourcesForLevel = dndClass.resourcesPerLevel[classLevel - 1];

        resource.maxUses = GetUsesForResource(playerConfigs, classResource, resourcesForLevel);

        let remainingUses;
        if (playerConfigs.currentStatus?.remainingResources && (playerConfigs.currentStatus.remainingResources[resource.name] || playerConfigs.currentStatus.remainingResources[resource.name] === 0)) {
            remainingUses = playerConfigs.currentStatus.remainingResources[resource.name];
        } else {
            remainingUses = resource.maxUses;
        }
        resource.remainingUses = remainingUses;
        return resource;
    }

    return undefined;
}

function getResourceForUses(playerConfigs, action) {
    const resource = {};
    resource.name = action.name;
    resource.displayName = action.name;
    resource.maxUses = performMathCalculation(playerConfigs, action.cost.uses.calculation);
    let remainingUses;
    if (playerConfigs.currentStatus?.remainingResources && (playerConfigs.currentStatus.remainingResources[resource.name] || playerConfigs.currentStatus.remainingResources[resource.name] === 0)) {
        remainingUses = playerConfigs.currentStatus.remainingResources[resource.name];
    } else {
        remainingUses = resource.maxUses;
    }
    resource.remainingUses = remainingUses;
    return resource;
}

function getResourceForAtWill() {
    const resource = {};
    resource.name = "atWill";
    resource.displayName = "At Will";
    return resource;
}

function getFeatureOrigin(actionFeature) {
    switch (actionFeature.typeFoundOn) {
        case "class":
            const allClassesMap = getNameDictionaryForCollection("classes");
            const dndClass = allClassesMap[actionFeature.playerConfigForObject.name];
            return { type: "class", value: dndClass };
        case "subclass":
            const allSubclassesMap = getNameDictionaryForCollection("subclasses");
            const dndSubclass = allSubclassesMap[actionFeature.playerConfigForObject.name];
            return { type: "subclass", value: dndSubclass };
        case "species":
            const allSpeciesMap = getNameDictionaryForCollection("species");
            const dndSpecies = allSpeciesMap[actionFeature.playerConfigForObject.name];
            return { type: "species", value: dndSpecies };
        case "statblock":
            const allStatBlocksMap = getNameDictionaryForCollection("statblocks");
            const dndStatblock = allStatBlocksMap[actionFeature.playerConfigForObject.name];
            return { type: "statblock", value: dndStatblock };
        case "feat":
            const allFeatsMap = getNameDictionaryForCollection("feats");
            const dndFeat = allFeatsMap[actionFeature.playerConfigForObject.name];
            return {type: "feat", value: dndFeat };
        case "homebrew":
            const allHomebrewMap = getNameDictionaryForCollection("homebrew");
            const dndHomebrew = allHomebrewMap[actionFeature.playerConfigForObject.name];
            return { type: "homebrew", value: dndHomebrew };
    }

    if (actionFeature.typeFoundOn.startsWith("species[")) {
        const speciesName = actionFeature.typeFoundOn.substring(8, actionFeature.typeFoundOn.indexOf("]", 8));
        const allSpeciesMap = getNameDictionaryForCollection("species");
        const dndSpecies = allSpeciesMap[speciesName];
        return { type: "species", value: dndSpecies };
    }

    return undefined;
}