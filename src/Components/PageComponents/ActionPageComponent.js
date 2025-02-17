import React from "react";
import './ActionPageComponent.css';
import { parseStringForBoldMarkup } from "../../SharedFunctions/ComponentFunctions";
import { getHomePageUrl } from "../../SharedFunctions/Utils";

export function ActionPageComponent({action, copyLinkToItem}) {
    let description = parseStringForBoldMarkup(action.description);

    if (copyLinkToItem) {
        copyLinkToItem.onExecute = () => {
            copyToClipboard(action);
        };
    }

    return <>
        <div className="actionPageContainer">
            <div className="actionPageDescription">{description}</div>
        </div>
    </>
}

function copyToClipboard(action) {
    navigator.clipboard.writeText(action.name + "\n" + getHomePageUrl() + "?view=action&name=" + encodeURI(action.name));
}