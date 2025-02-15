import React from "react";
import './MasteryPageComponent.css';
import { parseStringForBoldMarkup } from "../../SharedFunctions/ComponentFunctions";
import { getHomePageUrl } from "../../SharedFunctions/Utils";

export function MasteryPageComponent({mastery, data, copyLinkToItem}) {
    let description = parseStringForBoldMarkup(mastery.description);

    if (copyLinkToItem) {
        copyLinkToItem.onExecute = () => {
            copyToClipboard(mastery, data);
        };
    }

    return <>
        <div className="masteryPageContainer">
            <div className="masteryPageDescription">{description}</div>
        </div>
    </>
}

function copyToClipboard(mastery, data) {
    const stringifiedJson = JSON.stringify(data);
    navigator.clipboard.writeText(mastery.name + "\n" + getHomePageUrl() + "?view=mastery&name=" + encodeURI(mastery.name) + "&data=" + encodeURI(stringifiedJson));
}