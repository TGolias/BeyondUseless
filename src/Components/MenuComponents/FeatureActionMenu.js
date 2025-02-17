import React from "react";
import './FeatureActionMenu.css';
import { RetroButton } from "../SimpleComponents/RetroButton";
import { FeatureActionPageComponent } from "../PageComponents/FeatureActionPageComponent";
import { calculateHPMax, calculateOtherFeatureActionAspect, performMathCalculation } from "../../SharedFunctions/TabletopMathFunctions";
import { HPandLVLDisplay } from "../DisplayComponents/HPandLVLDisplay";
import { TextInput } from "../SimpleComponents/TextInput";
import { isNumeric } from "../../SharedFunctions/Utils";
import { CheckboxInput } from "../SimpleComponents/CheckboxInput";

const userInputTypes = {
    numberField: {
        generateControl: (playerConfigs, menuConfig, singleUserInput, menuStateChangeHandler) => {
            const min = singleUserInput.min ? performMathCalculation(playerConfigs, singleUserInput.min, { userInput: menuConfig.userInput, resource: menuConfig.resource }) : undefined;
            const max = singleUserInput.max ? performMathCalculation(playerConfigs, singleUserInput.max, { userInput: menuConfig.userInput, resource: menuConfig.resource }) : undefined;
            return (<>
                <div className="featureActionConfiguringHorizontal">
                    <div className="featureActionConfiguringVertical">
                        <div>{singleUserInput.displayName}</div>
                        <TextInput isNumberValue={true} baseStateObject={menuConfig} pathToProperty={"userInput." + singleUserInput.name} inputHandler={menuStateChangeHandler} minimum={min} maxiumum={max}></TextInput>
                    </div>
                </div>
            </>);
        }
    },
    checkboxList: {
        generateControl: (playerConfigs, menuConfig, singleUserInput, menuStateChangeHandler) => {
            const checkBoxControls = []
            const allCheckboxValues = performMathCalculation(playerConfigs, singleUserInput.values, { userInput: menuConfig.userInput, resource: menuConfig.resource });

            if (!menuConfig.userInput[singleUserInput.name]) {
                menuConfig.userInput[singleUserInput.name] = []
            }

            const checkBoxInputsValueHolder = {};
            for (let i = 0; i < allCheckboxValues.length; i++) {
                const singleCheckboxValue = allCheckboxValues[i];
                checkBoxInputsValueHolder[singleCheckboxValue] = menuConfig.userInput[singleUserInput.name].includes(singleCheckboxValue);
                checkBoxControls.push(<>
                    <div className="featureActionSingleCheckboxInput">
                        <CheckboxInput baseStateObject={checkBoxInputsValueHolder} pathToProperty={singleCheckboxValue} inputHandler={(baseStateObject, pathToProperty, newValue) => {
                            baseStateObject[pathToProperty] = newValue;
                            const newArrayValue = [];
                            for (let key of Object.keys(checkBoxInputsValueHolder)) {
                                if (checkBoxInputsValueHolder[key]) {
                                    newArrayValue.push(key);
                                }
                            }
                            menuStateChangeHandler(menuConfig, "userInput." + singleUserInput.name, newArrayValue);
                        }}></CheckboxInput>
                        <span className="featureActionConfiguringVertical">{singleCheckboxValue}</span>
                    </div>
                </>);
            }
            const min = singleUserInput.min ? performMathCalculation(playerConfigs, singleUserInput.min, { userInput: menuConfig.userInput, resource: menuConfig.resource }) : undefined;
            const max = singleUserInput.max ? performMathCalculation(playerConfigs, singleUserInput.max, { userInput: menuConfig.userInput, resource: menuConfig.resource }) : undefined;
            return (<>
                <div className="featureActionConfiguringHorizontal">
                    <div className="featureActionConfiguringVertical">
                        <div>{singleUserInput.displayName}</div>
                        <div className="featureActionCheckboxInputs">{checkBoxControls}</div>
                    </div>
                </div>
            </>);
        }
    }
}

export function FeatureActionMenu({playerConfigs, setCenterScreenMenu, menuConfig, menuStateChangeHandler, inputChangeHandler}) {
    const playerConfigsClone = {...playerConfigs};
    playerConfigsClone.currentStatus = {...playerConfigsClone.currentStatus};

    if (playerConfigsClone.currentStatus.remainingResources) {
        playerConfigsClone.currentStatus.remainingResources = {...playerConfigsClone.currentStatus.remainingResources}
    } else {
        playerConfigsClone.currentStatus.remainingResources = {};
    }
    
    const data = {};
    data.playerConfigs = playerConfigs;
    data.userInput = menuConfig.userInput;

    let userInput = [];
    if (menuConfig.featureAction.userInput) {
        for (let singleUserInput of menuConfig.featureAction.userInput) {
            userInput.push(userInputTypes[singleUserInput.type].generateControl(playerConfigs, menuConfig, singleUserInput, menuStateChangeHandler));
        }
    }

    let resourceDisplay = []
    const cost = performMathCalculation(playerConfigs, menuConfig.featureAction.cost.calcuation, { userInput: menuConfig.userInput, resource: menuConfig.resource }) ?? 0;
    const newRemainingUses = menuConfig.resource.remainingUses - cost;
    let canUseAction = newRemainingUses >= 0 && cost !== 0;

    playerConfigsClone.currentStatus.remainingResources[menuConfig.resource.name] = newRemainingUses;

    resourceDisplay.push(<>
        <div className="featureActionConfiguringHorizontal">
            <div className="featureActionConfiguringVertical">
                <div>{menuConfig.resource.displayName}</div>
                <div>Cost: {cost}</div>
                <div>Remaining: {newRemainingUses} / {menuConfig.resource.maxUses}</div>
            </div>
        </div>
    </>);

    let hpControls = [];
    if (menuConfig.hpIsChanging) {
        const maxHp = calculateHPMax(playerConfigsClone);
        if (playerConfigsClone.currentStatus.remainingHp === undefined) {
            playerConfigsClone.currentStatus.remainingHp = maxHp;
        }
    
        const healAmountString = calculateOtherFeatureActionAspect(data.playerConfigs, menuConfig.featureAction, "healing", "healingBonus", data.userInput);
        if (isNumeric(healAmountString)) {
            menuConfig.healAmount = parseInt(healAmountString);
        } else {
            hpControls.push(<>
                <div className="featureActionConfiguringHorizontal">
                    <div className="featureActionConfiguringVertical">
                        <div>Heal Amount</div>
                        <TextInput isNumberValue={true} baseStateObject={menuConfig} pathToProperty={"healAmount"} inputHandler={menuStateChangeHandler} minimum={0}/>
                    </div>
                </div>
            </>);
        }
        let newRemainingHp = playerConfigsClone.currentStatus.remainingHp + menuConfig.healAmount;
        if (newRemainingHp > maxHp) {
            newRemainingHp = maxHp;
        }
    
        playerConfigsClone.currentStatus.remainingHp = newRemainingHp;

        hpControls.push(<>
            <HPandLVLDisplay playerConfigs={playerConfigsClone} playLowHpAudio={false}></HPandLVLDisplay>
            <div className="featureActionConfiguringVertical">
                <RetroButton text={"Not Healing Self?"} onClickHandler={() => {menuStateChangeHandler(menuConfig, "hpIsChanging", false)}} showTriangle={false} disabled={false}></RetroButton>
            </div>
        </>);
    } else {
        menuConfig.healAmount = 0;
        if (menuConfig.featureAction.type.includes("healing")) {
            hpControls.push(<><div className="featureActionConfiguringHorizontal">
                <div className="featureActionConfiguringVertical">
                    <RetroButton text={"Heal Self?"} onClickHandler={() => {menuStateChangeHandler(menuConfig, "hpIsChanging", true)}} showTriangle={false} disabled={false}></RetroButton>
                </div>
            </div></>);
        }
    }

    return (<>
        <div className="featureActionMenuWrapperDiv">
            <FeatureActionPageComponent featureAction={menuConfig.featureAction} feature={menuConfig.feature} origin={menuConfig.origin} data={data} copyLinkToItem={menuConfig.copyLinkToItem}></FeatureActionPageComponent>
        </div>
        <div className="centerMenuSeperator"></div>
        <div style={{display: (userInput.length > 0 ? "flex" : "none")}} className="featureActionUserInputs">{userInput}</div>
        <div style={{display: (resourceDisplay.length > 0 ? "flex" : "none")}} className="featureActionResourceDisplay">{resourceDisplay}</div>
        <div style={{display: (hpControls.length > 0 ? "flex" : "none")}} className="featureActionHealingInputs">{hpControls}</div>
        <div className="centerMenuSeperator"></div>
        <div className="featureActionMenuHorizontal">
            <RetroButton text={"Use"} onClickHandler={() => {useActionClicked(playerConfigs, playerConfigsClone, inputChangeHandler, setCenterScreenMenu)}} showTriangle={false} disabled={!canUseAction} buttonSound={menuConfig.hpIsChanging ? "healaudio" : "selectionaudio"}></RetroButton>
            <RetroButton text={"Cancel"} onClickHandler={() => {setCenterScreenMenu({ show: false, menuType: undefined, data: undefined })}} showTriangle={false} disabled={false}></RetroButton>
        </div>
    </>);
}

function useActionClicked(playerConfigs, playerConfigsClone, inputChangeHandler, setCenterScreenMenu) {
    inputChangeHandler(playerConfigs, "currentStatus", playerConfigsClone.currentStatus);
    setCenterScreenMenu({ show: false, menuType: undefined, data: undefined });
}