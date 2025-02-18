import React from "react";
import './ConditionPageComponent.css';
import { parseStringForBoldMarkup } from "../../SharedFunctions/ComponentFunctions";
import { getHomePageUrl } from "../../SharedFunctions/Utils";

export function ConditionPageComponent({condition, copyLinkToItem}) {
    let description = parseStringForBoldMarkup(condition.description);

    if (copyLinkToItem) {
        copyLinkToItem.onExecute = () => {
            copyToClipboard(condition);
        };
    }

    return <>
        <div className="conditonPageContainer">
            <div className="conditonPageDescription">{description}</div>
        </div>
    </>
}

function copyToClipboard(condition) {
    navigator.clipboard.writeText(condition.name + "\n" + getHomePageUrl() + "?view=condition&name=" + encodeURI(condition.name));
}