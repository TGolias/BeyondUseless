import React from "react";
import './FeatureActionPageComponent.css';
import { parseStringForBoldMarkup } from "../../SharedFunctions/ComponentFunctions";
import { getHomePageUrl } from "../../SharedFunctions/Utils";

export function FeatureActionPageComponent({featureAction, feature, origin, copyLinkToItem}) {
    let description = parseStringForBoldMarkup(featureAction.description);

    if (copyLinkToItem) {
        copyLinkToItem.onExecute = () => {
            copyToClipboard(featureAction, feature, origin);
        };
    }

    return <>
        <div className="featureActionPageContainer">
            <div className="featureActionPageDescription">{description}</div>
            <div>From {origin.value.name} Feature: {feature.name}</div>
        </div>
    </>
}

function copyToClipboard(featureAction, feature, origin) {
    navigator.clipboard.writeText(featureAction.name + "\n" + getHomePageUrl() + "?view=featureaction&name=" + encodeURI(featureAction.name) + "&featurename=" + encodeURI(feature.name) + "&origintype=" + encodeURI(origin.type) + "&originname=" + encodeURI(origin.value.name));
}