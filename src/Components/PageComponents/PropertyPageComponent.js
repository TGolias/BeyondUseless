import React from "react";
import './PropertyPageComponent.css';
import { parseStringForBoldMarkup } from "../../SharedFunctions/ComponentFunctions";
import { getHomePageUrl } from "../../SharedFunctions/Utils";

export function PropertyPageComponent({property, playerConfigs, copyLinkToItem}) {
    let description = parseStringForBoldMarkup(property.description);

    if (copyLinkToItem) {
        copyLinkToItem.onExecute = () => {
            copyToClipboard(property, playerConfigs);
        };
    }

    return <>
        <div className="propertyPageContainer">
            <div className="propertyPageDescription">{description}</div>
        </div>
    </>
}

function copyToClipboard(property, playerConfigs) {
    navigator.clipboard.writeText(property.name + "\n" + getHomePageUrl() + "?view=property&name=" + encodeURI(property.name) + (playerConfigs ? "&playerName=" + encodeURIComponent(playerConfigs.name) : ""));
}