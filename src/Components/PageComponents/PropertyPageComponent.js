import React from "react";
import './PropertyPageComponent.css';
import { parseStringForBoldMarkup } from "../../SharedFunctions/ComponentFunctions";
import { getHomePageUrl } from "../../SharedFunctions/Utils";

export function PropertyPageComponent({property, data, copyLinkToItem}) {
    let description = parseStringForBoldMarkup(property.description);

    if (copyLinkToItem) {
        copyLinkToItem.onExecute = () => {
            copyToClipboard(property, data);
        };
    }

    return <>
        <div className="propertyPageContainer">
            <div className="propertyPageDescription">{description}</div>
        </div>
    </>
}

function copyToClipboard(property, data) {
    const stringifiedJson = JSON.stringify(data);
    navigator.clipboard.writeText(property.name + "\n" + getHomePageUrl() + "?view=property&name=" + encodeURI(property.name) + "&data=" + encodeURI(stringifiedJson));
}