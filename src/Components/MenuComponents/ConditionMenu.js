import React from "react";
import './ConditionMenu.css';
import { RetroButton } from "../SimpleComponents/RetroButton";
import { ConditionPageComponent } from "../PageComponents/ConditionPageComponent";
import { getCollection } from "../../Collections";
import { CheckListInput } from "../SimpleComponents/CheckListInput";

const rightTriangleUnicode = '\u25B6';
const downTriangleUnicode = '\u25BC';

export function ConditionMenu({setCenterScreenMenu, menuConfig, menuStateChangeHandler}) {

    const adjustConditionControls = [];
    if (menuConfig.condition.type) {
        if (menuConfig.condition.type.includes("damagetypes")) {
            const allDamageTypes = getCollection("damagetypes");
            adjustConditionControls.push(<div onClick={() => expandSection(menuConfig, menuStateChangeHandler, "expandDamageTypesSection")}>{menuConfig.expandDamageTypesSection ? downTriangleUnicode : rightTriangleUnicode}Damage Types</div>);
            if (menuConfig.expandDamageTypesSection) {
                adjustConditionControls.push(<>
                    <CheckListInput baseStateObject={menuConfig} pathToProperty={"conditionConfig.damagetypes"} inputHandler={menuStateChangeHandler} values={allDamageTypes}></CheckListInput>
                </>);
            }
        }
        if (menuConfig.condition.type.includes("conditions")) {
            const allConditions = getCollection("conditions");
            adjustConditionControls.push(<div onClick={() => expandSection(menuConfig, menuStateChangeHandler, "expandConditionsSection")}>{menuConfig.expandConditionsSection ? downTriangleUnicode : rightTriangleUnicode}Conditions</div>);
            if (menuConfig.expandConditionsSection) {
                const filteredConditions = allConditions.filter(condition => !condition.type || !condition.type.includes("conditions")).map(condition => condition.name);
                adjustConditionControls.push(<>
                    <CheckListInput baseStateObject={menuConfig} pathToProperty={"conditionConfig.conditions"} inputHandler={menuStateChangeHandler} values={filteredConditions}></CheckListInput>
                </>);
            }
        }
        if (menuConfig.condition.type.includes("level")) {
            const levelControls = [];
            for (let i = 1; i <= menuConfig.condition.levels; i++) {
                levelControls.push(<>
                    <div onClick={() => { menuStateChangeHandler(menuConfig, "conditionConfig.level", i) }} className={menuConfig.conditionConfig.level === i ? "pixel-corners" : ""}>{i}</div>
                </>);
            }
            adjustConditionControls.push(<>
                <div className="conditionMenuLevelControls">{levelControls}</div>
            </>);
        }
    }

    let didConfigChange = false;
    if (menuConfig.startingConditionConfig) {
        if (JSON.stringify(menuConfig.startingConditionConfig?.damagetypes ?? []) !== JSON.stringify(menuConfig.conditionConfig?.damagetypes ?? [])) {
            didConfigChange = true;
        }
        if (JSON.stringify(menuConfig.startingConditionConfig?.conditions ?? []) !== JSON.stringify(menuConfig.conditionConfig?.conditions ?? [])) {
            didConfigChange = true;
        }
        if (menuConfig.startingConditionConfig?.level !== menuConfig.conditionConfig?.level) {
            didConfigChange = true;
        }
    } else {
        didConfigChange = true;
    }

    let isOkValid = false;
    if (menuConfig.condition.type && (menuConfig.condition.type.includes("damagetypes") || menuConfig.condition.type.includes("conditions"))) {
        if (menuConfig.conditionConfig.conditions.length > 0 || menuConfig.conditionConfig.damagetypes.length) {
            isOkValid = true;
        }
    } else if (menuConfig.condition.type && menuConfig.condition.type.includes("damagetypes")) {
        if (menuConfig.conditionConfig.level) {
            isOkValid = true;
        }
    } else {
        isOkValid = true;
    }

    return (<>
        <div className="conditionMenuWrapperDiv">
            <ConditionPageComponent condition={menuConfig.condition} copyLinkToItem={menuConfig.copyLinkToItem}></ConditionPageComponent>
        </div>
        <div style={{display: (adjustConditionControls.length > 0 ? "block" : "none")}} className="centerMenuSeperator"></div>
        <div style={{display: (adjustConditionControls.length > 0 ? "flex" : "none")}} className="conditionMenuAdjustControls">{adjustConditionControls}</div>
        <div className="centerMenuSeperator"></div>
        <div className="conditionMenuHorizontal">
            <RetroButton text={"OK"} onClickHandler={() => {
                setCenterScreenMenu({ show: false, menuType: undefined, data: undefined })
                if (menuConfig.onOkClicked) {
                    menuConfig.onOkClicked(menuConfig.conditionConfig, didConfigChange);
                }
            }} showTriangle={false} disabled={!isOkValid}></RetroButton>
            <RetroButton text={"Remove"} onClickHandler={() => {
                setCenterScreenMenu({ show: false, menuType: undefined, data: undefined });
                if (menuConfig.onRemoveClicked) {
                    menuConfig.onRemoveClicked(menuConfig.condition.name);
                }
            }} showTriangle={false} disabled={false}></RetroButton>
            <RetroButton text={"Cancel"} onClickHandler={() => {setCenterScreenMenu({ show: false, menuType: undefined, data: undefined })}} showTriangle={false} disabled={false}></RetroButton>
        </div>
    </>);
}

function expandSection(menuConfig, menuStateChangeHandler, sectionToExpand) {
    const currentValue = menuConfig[sectionToExpand];
    menuStateChangeHandler(menuConfig, sectionToExpand, !currentValue);
}