import React from 'react';
import './FeatureActionsDisplay.css';
import { getCastingTimeShorthand } from '../../SharedFunctions/ComponentFunctions';
import { getCollection } from '../../Collections';
import { playAudio } from '../../SharedFunctions/Utils';

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
    const resourcelessActions = [];
    const resourceName2Actions = {};
    const resourceName2Resource = {};
    for (let actionFeature of actionFeatures) {
        for (let action of actionFeature.feature.actions) {
            if (action.cost.resourceType) {
                const featureOrigin = getFeatureOrigin(actionFeature);
                if (!resourceName2Actions[action.cost.resourceType]) {
                    resourceName2Resource[action.cost.resourceType] = getResource(playerConfigs, actionFeature, action.cost.resourceType);
                    resourceName2Actions[action.cost.resourceType] = [];
                }
                resourceName2Actions[action.cost.resourceType].push({ action, feature: actionFeature.feature, origin: featureOrigin })
            } else {
                resourcelessActions.push(action);
            }
        }
    }

    const controlsToDisplay = []
    for (let resourceName of Object.keys(resourceName2Actions)) {
        const actionsForResource = resourceName2Actions[resourceName];
        const resource = resourceName2Resource[resourceName];
        controlsToDisplay.push(createSingleFeatureActionsGroup(playerConfigs, setCenterScreenMenu, resource.displayName, actionsForResource, resource));
    }

    if (resourcelessActions.length > 0) {
        controlsToDisplay.push(createSingleFeatureActionsGroup(playerConfigs, setCenterScreenMenu, "Feature Actions", resourcelessActions));
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
        let remainingUsesString;
        if (resource.maxUses > 4) {
            remainingUsesString = resource.remainingUses + "/" + resource.maxUses;
        } else {
            remainingUsesString = "";
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
        }
        actionsGrouping.push(<div className='featureActionsDisplayResourceUses'>Remaining: {remainingUsesString}</div>);
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

function getResource(playerConfigs, actionFeature, resourceName) {
    switch (actionFeature.typeFoundOn) {
        case "class":
            const allClasses = getCollection("classes");
            const dndClass = allClasses.find(dndClass => dndClass.name === actionFeature.playerConfigForObject.name);
            const classResource = dndClass.resources.find(resource => resource.name === resourceName);
            const resource = {...classResource};

            const classLevel = actionFeature.playerConfigForObject.levels;
            resource.classLevel = classLevel;

            const resourcesForLevel = dndClass.resourcesPerLevel[classLevel - 1];
            resource.maxUses = resourcesForLevel[resourceName];

            let remainingUses;
            if (playerConfigs.currentStatus?.remainingResources && playerConfigs.currentStatus.remainingResources[resource.name]) {
                remainingUses = playerConfigs.currentStatus.remainingResources[resource.name];
            } else {
                remainingUses = resource.maxUses;
            }
            resource.remainingUses = remainingUses;
            return resource;
    }

    return undefined;
}

function getFeatureOrigin(actionFeature) {
    switch (actionFeature.typeFoundOn) {
        case "class":
            const allClasses = getCollection("classes");
            const dndClass = allClasses.find(dndClass => dndClass.name === actionFeature.playerConfigForObject.name);
            return { type: "class", value: dndClass };
    }

    return undefined;
}