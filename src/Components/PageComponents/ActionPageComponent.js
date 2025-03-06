import React from "react";
import './ActionPageComponent.css';
import { parseStringForBoldMarkup } from "../../SharedFunctions/ComponentFunctions";
import { addLeadingPlusIfNumericAndPositive, convertArrayToDictionary, getHomePageUrl } from "../../SharedFunctions/Utils";
import { calculateOtherFeatureActionAspect, calculateSkillProficiency } from "../../SharedFunctions/TabletopMathFunctions";
import { getCollection } from "../../Collections";

export function ActionPageComponent({action, copyLinkToItem, data, playerConfigs}) {
    let description = parseStringForBoldMarkup(action.description);

    let conditionsDescription = "";
    if (action.conditions) {
        const allConditions = getCollection("conditions");
        const allConditionsMap = convertArrayToDictionary(allConditions, "name");
        for (let conditionName of action.conditions) {
            const condition = allConditionsMap[conditionName];
            if (condition) {
                if (conditionsDescription.length > 0) {
                    conditionsDescription += "\n\n";
                }

                conditionsDescription += "<b>" + conditionName + ".</b> " + condition.description;
            }
        }
    }

    const conditionsRows = parseStringForBoldMarkup(conditionsDescription);

    if (copyLinkToItem) {
        copyLinkToItem.onExecute = () => {
            copyToClipboard(action, data, playerConfigs);
        };
    }

    let showActionSummary = false;
    let buffAmount = undefined;
    let buffDescription = undefined;
    let skillsDescription = "";
    if (data && playerConfigs) {
        if (action.showSkills) {
            for (let skillName of action.showSkills) {
                if (skillsDescription.length > 0) {
                    skillsDescription += "\n\n";
                }
                const skillValue = calculateSkillProficiency(playerConfigs, skillName);
                skillsDescription += "<b>" + skillName + ":</b> " + (addLeadingPlusIfNumericAndPositive(skillValue));
            }
        }

        if (action.type.includes("buff")) {
            if (action.buff.calculation) {
                buffAmount = calculateOtherFeatureActionAspect(playerConfigs, action, "buff", "buffBonus", { userInput: data.userInput });
            }
            buffDescription = action.buff.description;
            showActionSummary = true;
        }
    }

    const skillDescriptionRows = parseStringForBoldMarkup(skillsDescription);

    return <>
        <div className="actionPageContainer">
            <div className="actionPageDescription">{description}</div>
            <div className="actionPageDescription" style={{display: (skillDescriptionRows.length ? "block" : "none")}}>{skillDescriptionRows}</div>
            <div className="actionPageDescription" style={{display: (conditionsRows.length ? "block" : "none")}}>{conditionsRows}</div>
            <br style={{display: (showActionSummary ? "block" : "none")}}></br>
            <div className="spellPageDescription" style={{display: (showActionSummary ? "block" : "none")}}>
                <div><b>Action Summary</b></div>
            </div>
            <div className="spellPageDescription" style={{display: (buffAmount || buffDescription ? "block" : "none")}}>
                <div><b>Buff:</b> {parseStringForBoldMarkup(buffAmount)}{(buffAmount ? " " : "")}{parseStringForBoldMarkup(buffDescription)}</div>
            </div>
        </div>
    </>
}

function copyToClipboard(action, data, playerConfigs) {
    const stringifiedJson = JSON.stringify(data);
    navigator.clipboard.writeText(action.name + "\n" + getHomePageUrl() + "?view=action&name=" + encodeURI(action.name) + "&data=" + encodeURIComponent(stringifiedJson) + (playerConfigs ? "&playerName=" + encodeURIComponent(playerConfigs.name) : ""));
}