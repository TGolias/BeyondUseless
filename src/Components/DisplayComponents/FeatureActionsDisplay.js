import React from 'react';
import './FeatureActionsDisplay.css';
import { getCastingTimeShorthand } from '../../SharedFunctions/ComponentFunctions';
import { getCollection } from '../../Collections';
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
                    // We skip Ritual in this view, because it's already on the next column.
                    if (singleActionTime !== "Ritual") {
                        if (actionTime.length > 0) {
                            actionTime += " or ";
                        }
                        actionTime += getCastingTimeShorthand(singleActionTime);
                    }
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
            if (action.cost) {
                if (action.cost.resourceType) {
                    if (!resourceName2Actions[action.cost.resourceType]) {
                        resourceName2Resource[action.cost.resourceType] = getResourceForResourceType(playerConfigs, actionFeature, action.cost.resourceType);
                        resourceName2Actions[action.cost.resourceType] = [];
                    }
                    resourceName2Actions[action.cost.resourceType].push({ action, feature: actionFeature.feature, origin: featureOrigin })
                } else if (action.cost.uses) {
                    resourceName2Resource[action.name] = getResourceForUses(playerConfigs, action);
                    resourceName2Actions[action.name] = [{ action, feature: actionFeature.feature, origin: featureOrigin }];
                }
            } else {
                if (!resourceName2Resource.freeActions) {
                    resourceName2Resource.freeActions = getResourceForFreeActions();
                    resourceName2Actions.freeActions = [];
                }
                resourceName2Actions.freeActions.push({ action, feature: actionFeature.feature, origin: featureOrigin });
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
                const allClasses = getCollection("classes");
                dndClass = allClasses.find(dndClass => dndClass.name === originName);
            }
            
        case "subclass":
            if (originName) {
                const allSubclasses = getCollection("subclasses");
                const dndSubclass = allSubclasses.find(dndSubclass => dndSubclass.name === originName);
                if (dndSubclass) {
                    const allClasses = getCollection("classes");
                    dndClass = allClasses.find(dndClass => dndClass.name === dndSubclass.class);
                }
            }
    }

    if (dndClass) {
        const classResource = dndClass.resources.find(resource => resource.name === resourceName);
        const resource = {...classResource};

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

function getResourceForFreeActions() {
    const resource = {};
    resource.name = "freeActions";
    resource.displayName = "Free Actions";
    return resource;
}

function getFeatureOrigin(actionFeature) {
    switch (actionFeature.typeFoundOn) {
        case "class":
            const allClasses = getCollection("classes");
            const dndClass = allClasses.find(dndClass => dndClass.name === actionFeature.playerConfigForObject.name);
            return { type: "class", value: dndClass };
        case "subclass":
            const allSubclasses = getCollection("subclasses");
            const dndSubclass = allSubclasses.find(dndSubclass => dndSubclass.name === actionFeature.playerConfigForObject.name);
            return { type: "subclass", value: dndSubclass };
        case "species":
            const allSpecies = getCollection("species");
            const dndSpecies = allSpecies.find(singleDndSpecies => singleDndSpecies.name === actionFeature.playerConfigForObject.name);
            return { type: "species", value: dndSpecies };
        case "statblock":
            const allStatBlocks = getCollection("statblocks");
            const dndStatblock = allStatBlocks.find(singleDndStatblock => singleDndStatblock.name === actionFeature.playerConfigForObject.name);
            return { type: "statblock", value: dndStatblock };
    }

    if (actionFeature.typeFoundOn.startsWith("species[")) {
        const speciesName = actionFeature.typeFoundOn.substring(8, actionFeature.typeFoundOn.indexOf("]", 8));
        const allSpecies = getCollection("species");
        const dndSpecies = allSpecies.find(singleDndSpecies => singleDndSpecies.name === speciesName);
        return { type: "species", value: dndSpecies };
    }

    return undefined;
}