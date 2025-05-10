import React from "react";
import './FeatureActionPageComponent.css';
import { getCapitalizedAbilityScoreName, parseStringForBoldMarkup } from "../../SharedFunctions/ComponentFunctions";
import { concatStringArrayToAndStringWithCommas, convertArrayToDictionary, convertHashMapToArrayOfStrings, getHomePageUrl } from "../../SharedFunctions/Utils";
import { calculateAddendumAspect, calculateAddendumAspects, calculateAttackRollForAttackRollType, calculateOtherFeatureActionAspect, calculateRange, calculateSpellSaveDC } from "../../SharedFunctions/TabletopMathFunctions";
import { getCollection } from "../../Collections";
import { GetAllPossibleFeaturesFromObject } from "../../SharedFunctions/FeatureFunctions";

export function FeatureActionPageComponent({featureAction, feature, origin, data, playerConfigs, copyLinkToItem}) {
    let actionTime = "";
    if (Array.isArray(featureAction.actionTime)) {
        for (let singleActionTime of featureAction.actionTime) {
            if (actionTime.length > 0) {
                actionTime += " or "
            }
            actionTime += singleActionTime;
        }
    } else {
        actionTime = featureAction.castingTime;
    }
    const range = calculateRange(playerConfigs, featureAction.range);
    let description = parseStringForBoldMarkup(featureAction.description);

    if (copyLinkToItem) {
        copyLinkToItem.onExecute = () => {
            copyToClipboard(featureAction, feature, origin, data, playerConfigs);
        };
    }

    let featureActionDescriptionAddendum = undefined;
    let attackRoll = undefined;
    let attackRollAddendum = undefined
    let savingThrowType = undefined;
    let savingThrowDc = undefined;
    let savingThrowDcAddendum = undefined;
    let damage = undefined;
    let healing = undefined;
    let healingAddendum = undefined;
    let restore = undefined
    let buffAmount = undefined;
    let buffDescription = undefined;
    let debuffAmount = undefined;
    let debuffDescription = undefined;
    let creatures = undefined;
    let targetNames = undefined;
    if (data && playerConfigs) {
        const featureActionDescriptionAddendumString = calculateAddendumAspect(playerConfigs, "featureActionDescriptionAddendum", { featureAction });
        if (featureActionDescriptionAddendumString) {
            featureActionDescriptionAddendum = parseStringForBoldMarkup(featureActionDescriptionAddendumString);
        }

        // This works for now... We probably will need something better to get the associated spellcasting ability eventually.
        const allPossibleFeatures = GetAllPossibleFeaturesFromObject(origin.value);
        featureAction.feature = allPossibleFeatures.find(feature => feature.spellcasting);

        if (featureAction.challengeType === "attackRoll") {
            const attack = calculateAttackRollForAttackRollType(playerConfigs, featureAction, undefined, featureAction.attackRollType);
            attackRoll = attack.amount;
            if (attack.addendum) {
                attackRollAddendum = parseStringForBoldMarkup(attack.addendum);
            }
        }

        if (featureAction.challengeType === "savingThrow") {
            savingThrowType = featureAction.savingThrowType;

            const savingThrowCalc = calculateSpellSaveDC(playerConfigs, featureAction, undefined);
            savingThrowDc = savingThrowCalc.dc;
            if (savingThrowCalc.addendum) {
                savingThrowDcAddendum = parseStringForBoldMarkup(savingThrowCalc.addendum);
            }
        }

        if (featureAction.type.includes("damage")) {
            damage = calculateOtherFeatureActionAspect(playerConfigs, featureAction, "damage", "spellDamageBonus", { userInput: data.userInput });
        }

        if (featureAction.type.includes("buff")) {
            if (featureAction.buff.calculation) {
                buffAmount = calculateOtherFeatureActionAspect(playerConfigs, featureAction, "buff", "buffBonus", { userInput: data.userInput });
            }
            buffDescription = featureAction.buff.description;
        }

        if (featureAction.type.includes("debuff")) {
            if (featureAction.debuff.calculation) {
                debuffAmount = calculateOtherFeatureActionAspect(playerConfigs, featureAction, "debuff", "debuffBonus", { userInput: data.userInput });
            }
            debuffDescription = featureAction.debuff.description;
            if (featureAction.debuff.conditions) {
                if (!debuffDescription) {
                    debuffDescription = "";
                }
                const allConditions = getCollection("conditions");
                const allConditionsMap = convertArrayToDictionary(allConditions, "name");
                for (let condition of featureAction.debuff.conditions) {
                    const dndCondition = allConditionsMap[condition];
                    if (debuffDescription.length > 0) {
                        debuffDescription += "\n\n";
                    }
                    debuffDescription += "<b>" + dndCondition.name + ".</b> " + dndCondition.description;
                }
            }
        }

        if (featureAction.type.includes("healing")) {
            healing = calculateOtherFeatureActionAspect(playerConfigs, featureAction, "healing", "healingBonus", { userInput: data.userInput });
            if (healing) {
                healingAddendum = calculateAddendumAspects(playerConfigs, ["healingAddendum"], { userInput: data.userInput });
            }
        }

        if (featureAction.type.includes("restore")) {
            restore = calculateOtherFeatureActionAspect(playerConfigs, featureAction, "restore", "restoreBonus", { userInput: data.userInput });
        }

        if (featureAction.type.includes("creatures")) {
            creatures = calculateOtherFeatureActionAspect(playerConfigs, featureAction, "creatures", undefined, { userInput: data.userInput });
        }

        if (data.targetNamesMap) {
            const targetNameStrings = convertHashMapToArrayOfStrings(data.targetNamesMap);
            targetNames = concatStringArrayToAndStringWithCommas(targetNameStrings);
        }
    }

    return <>
        <div className="featureActionPageContainer">
            <div><b>Action Time:</b> {actionTime}</div>
            <div><b>Range:</b> {range}</div>
            <div><b>Duration:</b> {featureAction.duration}</div>
            <div className="featureActionPageDescription" style={{display: (description.length ? "block" : "none")}}>{description}</div>
            <div className="featureActionPageDescription" style={{display: (featureActionDescriptionAddendum ? "block" : "none")}}>{featureActionDescriptionAddendum}</div>
            <br></br>
            <div className="featureActionPageDescription">
                <div><b>Action Summary</b></div>
            </div>
            <div className="featureActionPageDescription" style={{display: (attackRoll ? "block" : "none")}}>
                <div><b>Attack Roll:</b> +{attackRoll}</div>
            </div>
            <div className="featureActionPageDescription" style={{display: (attackRollAddendum ? "block" : "none")}}>
                <div>{attackRollAddendum}</div>
            </div>
            <div className="featureActionPageDescription" style={{display: (savingThrowType ? "block" : "none")}}>
                <div><b>DC{savingThrowDc}</b> {getCapitalizedAbilityScoreName(savingThrowType)}</div>
            </div>
            <div className="featureActionPageDescription" style={{display: (savingThrowDcAddendum ? "block" : "none")}}>
                <div>{savingThrowDcAddendum}</div>
            </div>
            <div className="featureActionPageDescription" style={{display: (damage ? "block" : "none")}}>
                <div><b>Damage:</b> {damage}</div>
            </div>
            <div className="featureActionPageDescription" style={{display: (healing ? "block" : "none")}}>
                <div><b>Healing:</b> {healing}</div>
            </div>
            <div className="spellPageDescription" style={{display: (healingAddendum ? "block" : "none")}}>
                <div>{parseStringForBoldMarkup(healingAddendum)}</div>
            </div>
            <div className="featureActionPageDescription" style={{display: (restore ? "block" : "none")}}>
                <div><b>Conditions Removed:</b> {restore}</div>
            </div>
            <div className="featureActionPageDescription" style={{display: ((buffAmount || buffDescription) ? "block" : "none")}}>
                <div><b>Buff:</b> {(buffAmount ? buffAmount + " " : "")}{buffDescription}</div>
            </div>
            <div className="featureActionPageDescription" style={{display: ((debuffAmount || debuffDescription) ? "block" : "none")}}>
                <div><b>Debuff:</b> {debuffAmount ? debuffAmount + " " : ""}{parseStringForBoldMarkup(debuffDescription)}</div>
            </div>
            <div className="featureActionPageDescription" style={{display: ((creatures) ? "block" : "none")}}>
                <div><b>Allied Creatures:</b> {creatures}</div>
            </div>
            <div className="featureActionPageDescription" style={{display: (targetNames ? "block" : "none")}}>
                <div><b>Targets:</b> {targetNames}</div>
            </div>
            <div className="featureActionPageDescription" style={{display: (feature ? "block" : "none")}}>
                <div><b>Learned from:</b> {origin.value.name} - {feature.name}</div>
            </div>
        </div>
    </>
}

function copyToClipboard(featureAction, feature, origin, data, playerConfigs) {
    const stringifiedJson = JSON.stringify(data);
    navigator.clipboard.writeText(featureAction.name + "\n" + getHomePageUrl() + "?view=featureaction&name=" + encodeURI(featureAction.name) + "&featurename=" + encodeURI(feature.name) + "&origintype=" + encodeURI(origin.type) + "&originname=" + encodeURI(origin.value.name) + "&data=" + encodeURIComponent(stringifiedJson) + (playerConfigs ? "&playerName=" + encodeURIComponent(playerConfigs.name) : ""));
}