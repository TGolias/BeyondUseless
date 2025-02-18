import React from "react";
import './ConditionsDisplay.css';
import { getCollection } from "../../Collections";
import { convertArrayToDictionary, playAudio } from "../../SharedFunctions/Utils";
import { RetroButton } from "../SimpleComponents/RetroButton";

export function ConditionsDisplay({conditions, setCenterScreenMenu, onAddOrUpdate, onRemove, addConditionClicked = undefined}) {
    const allConditions = getCollection("conditions");
    const conditionName2Condition = convertArrayToDictionary(allConditions, "name");

    const allConditionDisplays = [];
    for (let conditionConfig of conditions) {
        const dndCondition = conditionName2Condition[conditionConfig.name];
        const highlightColorClass = dndCondition.highlightColor === "Terrrible" ? "conditionsDisplayTerrible" : (dndCondition.highlightColor === "Good" ? "conditionsDisplayGood" : "conditionsDisplayBad");
        if (dndCondition.type) {
            if (dndCondition.type.includes("damagetypes")) {
                if (conditionConfig.damagetypes) {
                    for (let damageType of conditionConfig.damagetypes) {
                        allConditionDisplays.push(createSingleConditionDisplay(dndCondition, conditionConfig, damageType + " " + dndCondition.name, highlightColorClass, setCenterScreenMenu, onAddOrUpdate, onRemove));
                    }
                }
            }
            if (dndCondition.type.includes("conditions")) {
                if (conditionConfig.conditions) {
                    for (let singleCondition of conditionConfig.conditions) {
                        allConditionDisplays.push(createSingleConditionDisplay(dndCondition, conditionConfig, singleCondition + " " + dndCondition.name, highlightColorClass, setCenterScreenMenu, onAddOrUpdate, onRemove));
                    }
                }
            }
            if (dndCondition.type.includes("level")) {
                if (conditionConfig.level) {
                    allConditionDisplays.push(createSingleConditionDisplay(dndCondition, conditionConfig, dndCondition.name + " " + conditionConfig.level, highlightColorClass, setCenterScreenMenu, onAddOrUpdate, onRemove));
                }
            }
        }
        else {
            allConditionDisplays.push(createSingleConditionDisplay(dndCondition, conditionConfig, dndCondition.name, highlightColorClass, setCenterScreenMenu, onAddOrUpdate, onRemove));
        }
    }

    if (addConditionClicked) {
        allConditionDisplays.push(<>
            <div className="conditionsDisplaySingleCondition">
                <RetroButton text={"Add Condition"} onClickHandler={() => addConditionClicked()} showTriangle={false} disabled={false}></RetroButton>
            </div>
        </>)
    }

    return (<>
        <div className="conditionsDisplayWrapper">{allConditionDisplays}</div>
    </>)
}

function createSingleConditionDisplay(dndCondition, conditionConfig, displayText, highlightColorClass, setCenterScreenMenu, onAddOrUpdate, onRemove) {
    return (<>
        <div onClick={() => openConditionScreen(dndCondition, conditionConfig, setCenterScreenMenu, onAddOrUpdate, onRemove)} className={"conditionsDisplaySingleCondition pixel-corners " + highlightColorClass}>{displayText}</div>
    </>)
}

function openConditionScreen(dndCondition, conditionConfig, setCenterScreenMenu, onAddOrUpdate, onRemove) {
    playAudio("menuaudio");
    setCenterScreenMenu({ show: true, menuType: "ConditionMenu", data: { menuTitle: dndCondition.name, condition: dndCondition, conditionConfig: conditionConfig,
        onOkClicked: (newCondition) => {
            onAddOrUpdate(newCondition);
        }, onRemoveClicked: (conditionNameToRemove) => {
            onRemove(conditionNameToRemove);
        } 
    } });
}