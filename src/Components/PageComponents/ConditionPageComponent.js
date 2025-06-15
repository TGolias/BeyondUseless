import React from "react";
import './ConditionPageComponent.css';
import { parseStringForBoldMarkup } from "../../SharedFunctions/ComponentFunctions";
import { addLeadingPlusIfNumericAndPositive, getHomePageUrl } from "../../SharedFunctions/Utils";
import { calculateSkillProficiency } from "../../SharedFunctions/TabletopMathFunctions";
import { getNameDictionaryForCollection } from "../../Collections";

export function ConditionPageComponent({condition, copyLinkToItem, playerConfigs}) {
    let description = parseStringForBoldMarkup(condition.description);

    let additionalConditionsDescription = "";
    if (condition.additionalConditions) {
        const allConditionsMap = getNameDictionaryForCollection("conditions");
        for (let additionalConditionName of condition.additionalConditions) {
            const additionalCondition = allConditionsMap[additionalConditionName];
            if (additionalCondition) {
                if (additionalConditionsDescription.length > 0) {
                    additionalConditionsDescription += "\n\n";
                }

                additionalConditionsDescription += "<b>" + additionalConditionName + ".</b> " + additionalCondition.description;
            }
        }
    }

    const additionalConditionsRows = parseStringForBoldMarkup(additionalConditionsDescription);

    if (copyLinkToItem) {
        copyLinkToItem.onExecute = () => {
            copyToClipboard(condition, playerConfigs);
        };
    }

    let skillsDescription = "";
    if (playerConfigs) {
        if (condition.showSkills) {
            for (let skillName of condition.showSkills) {
                if (skillsDescription.length > 0) {
                    skillsDescription += "\n\n";
                }
                const skillValue = calculateSkillProficiency(playerConfigs, skillName);
                skillsDescription += "<b>" + skillName + ":</b> " + (addLeadingPlusIfNumericAndPositive(skillValue));
            }
        }
    }

    const skillDescriptionRows = parseStringForBoldMarkup(skillsDescription);

    return <>
        <div className="conditionPageContainer">
            <div className="conditionPageDescription">{description}</div>
            <div className="conditionPageDescription" style={{display: (additionalConditionsRows ? "block" : "none")}}>{additionalConditionsRows}</div>
            <div className="conditionPageDescription" style={{display: (skillDescriptionRows ? "block" : "none")}}>{skillDescriptionRows}</div>
        </div>
    </>
}

function copyToClipboard(condition, playerConfigs) {
    navigator.clipboard.writeText(condition.name + "\n" + getHomePageUrl() + "?view=condition&name=" + encodeURI(condition.name) + (playerConfigs ? "&playerName=" + encodeURIComponent(playerConfigs.name) : ""));
}