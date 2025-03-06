import React from "react";
import './MasteryPageComponent.css';
import { parseStringForBoldMarkup } from "../../SharedFunctions/ComponentFunctions";
import { getHomePageUrl } from "../../SharedFunctions/Utils";

export function MasteryPageComponent({mastery, playerConfigs, copyLinkToItem}) {
    let description = parseStringForBoldMarkup(mastery.description);

    if (copyLinkToItem) {
        copyLinkToItem.onExecute = () => {
            copyToClipboard(mastery, playerConfigs);
        };
    }

    return <>
        <div className="masteryPageContainer">
            <div className="masteryPageDescription">{description}</div>
        </div>
    </>
}

function copyToClipboard(mastery, playerConfigs) {
    navigator.clipboard.writeText(mastery.name + "\n" + getHomePageUrl() + "?view=mastery&name=" + encodeURI(mastery.name) + (playerConfigs ? "&playerName=" + encodeURIComponent(playerConfigs.name) : ""));
}