import React from "react";
import './FeatureActionPageComponent.css';
import { getCapitalizedAbilityScoreName, parseStringForBoldMarkup } from "../../SharedFunctions/ComponentFunctions";
import { getHomePageUrl } from "../../SharedFunctions/Utils";
import { calculateOtherFeatureActionAspect, performMathCalculation } from "../../SharedFunctions/TabletopMathFunctions";

export function FeatureActionPageComponent({featureAction, feature, origin, data, copyLinkToItem}) {
    let description = parseStringForBoldMarkup(featureAction.description);

    if (copyLinkToItem) {
        copyLinkToItem.onExecute = () => {
            copyToClipboard(featureAction, feature, origin, data);
        };
    }

    let showActionSummary = false;
    let attackRoll = undefined;
    let attackRollAddendum = undefined
    let savingThrowType = undefined;
    let savingThrowDc = undefined;
    let savingThrowDcAddendum = undefined;
    let damage = undefined;
    let healing = undefined;
    let restore = undefined
    let buffAmount = undefined;
    let buffDescription = undefined;
    let debuffAmount = undefined;
    let debuffDescription = undefined;
    if (data) {
        if (featureAction.type.includes("healing")) {
            healing = calculateOtherFeatureActionAspect(data.playerConfigs, featureAction, "healing", "healingBonus", { userInput: data.userInput });
            if (healing.length === 0) {
                healing = "0";
            }
        }

        if (featureAction.type.includes("restore")) {
            restore = calculateOtherFeatureActionAspect(data.playerConfigs, featureAction, "restore", "restoreBonus", { userInput: data.userInput });
            if (restore.length === 0) {
                restore = "(none)";
            }
        }
    }

    return <>
        <div className="featureActionPageContainer">
            <div className="featureActionPageDescription">{description}</div>
            <div className="featureActionPageDescription" style={{display: (feature ? "block" : "none")}}>
                <div><b>Learned from:</b> {origin.value.name} - {feature.name}</div>
            </div>
            <br style={{display: (showActionSummary ? "block" : "none")}}></br>
            <div className="featureActionPageDescription" style={{display: (showActionSummary ? "block" : "none")}}>
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
            <div className="featureActionPageDescription" style={{display: (restore ? "block" : "none")}}>
                <div><b>Conditions Removed:</b> {restore}</div>
            </div>
            <div className="featureActionPageDescription" style={{display: (buffDescription ? "block" : "none")}}>
                <div><b>Buff:</b> {(buffAmount ? buffAmount + " " : "")}{buffDescription}</div>
            </div>
            <div className="featureActionPageDescription" style={{display: (debuffDescription ? "block" : "none")}}>
                <div><b>Debuff:</b> {debuffAmount ? debuffAmount + " " : ""}{debuffDescription}</div>
            </div>
        </div>
    </>
}

function copyToClipboard(featureAction, feature, origin, data) {
    const stringifiedJson = JSON.stringify(data);
    navigator.clipboard.writeText(featureAction.name + "\n" + getHomePageUrl() + "?view=featureaction&name=" + encodeURI(featureAction.name) + "&featurename=" + encodeURI(feature.name) + "&origintype=" + encodeURI(origin.type) + "&originname=" + encodeURI(origin.value.name) + "&data=" + encodeURIComponent(stringifiedJson));
}