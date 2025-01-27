import React, { useState } from "react";
import './CenterMenu.css';
import { RetroButton } from "../SimpleComponents/RetroButton";
import { HealthMenu } from "./HealthMenu";
import { getTotalPath } from "../../SharedFunctions/ComponentFunctions";
import { calculateHPMax } from "../../SharedFunctions/TabletopMathFunctions";
import { ConfirmationMenu } from "./ConfirmationMenu";

const menuCollection = {
    HealthMenu: {
        createMenuTitle: (playerConfigs) => {
            const playerFirstName = playerConfigs.name.split(' ')[0];
            return "Manage " + playerFirstName + "'s HP";
        },
        createDefaultMenuConfig: (playerConfigs, data) => {
            const newHealthMenuConfig = {};
            newHealthMenuConfig.newTempHp = playerConfigs.currentStatus.tempHp ?? 0;
            newHealthMenuConfig.newMaxHpModifier = playerConfigs.currentStatus.maxHpModifier ?? 0; 
            newHealthMenuConfig.newRemainingHp = playerConfigs.currentStatus.remainingHp ?? calculateHPMax(playerConfigs); 
            newHealthMenuConfig.changeHpAmount = 0;
            return newHealthMenuConfig;
        },
        createMenuLayout: (playerConfigs, setCenterScreenMenu, inputChangeHandler, menuConfig, menuStateChangeHandler) => {
            return (<><HealthMenu playerConfigs={playerConfigs} setCenterScreenMenu={setCenterScreenMenu} menuConfig={menuConfig} menuStateChangeHandler={menuStateChangeHandler} inputChangeHandler={inputChangeHandler}></HealthMenu></>)
        }
    },
    ConfirmationMenu: {
        createMenuTitle: (playerConfigs, data) => {
            return data.menuTitle;
        },
        createDefaultMenuConfig: (playerConfigs, data) => {
            const newConfirmationMenuConfig = {};
            newConfirmationMenuConfig.menuText = data.menuText;
            newConfirmationMenuConfig.buttons = data.buttons;
            return newConfirmationMenuConfig;
        },
        createMenuLayout: (playerConfigs, setCenterScreenMenu, inputChangeHandler, menuConfig, menuStateChangeHandler) => {
            return (<><ConfirmationMenu playerConfigs={playerConfigs} setCenterScreenMenu={setCenterScreenMenu} menuConfig={menuConfig} menuStateChangeHandler={menuStateChangeHandler} inputChangeHandler={inputChangeHandler}></ConfirmationMenu></>)
        }
    }
}

const defaultMenuConfig = {
    type: undefined,
    opened: false
}

export function CenterMenu({playerConfigs, menuType, data, setCenterScreenMenu, inputChangeHandler}) {
    const [menuConfig, setMenuConfig] = useState(defaultMenuConfig);

    const menu = menuCollection[menuType];
    let title = "";
    const menuLayout = [];

    if (menu) {
        title = menu.createMenuTitle(playerConfigs, data);

        if (!menuConfig.opened || menuConfig.type !== menuType) {
            const newMenuConfig = menu.createDefaultMenuConfig(playerConfigs, data);
            newMenuConfig.type = menuType;
            newMenuConfig.opened = true;
            setMenuConfig(newMenuConfig);
        }

        menuLayout.push(menu.createMenuLayout(playerConfigs, 
            (centerScreenConfigs) => {
                if (!centerScreenConfigs.show) {
                    // They're closing out of the menu. Reset menu configs as well for next time.
                    const resetMenuConfig = {...defaultMenuConfig};
                    setMenuConfig(resetMenuConfig);
                }
                setCenterScreenMenu(centerScreenConfigs);
            }, 
            inputChangeHandler, 
            menuConfig, 
            (baseStateObject, pathToProperty, newValue) => {
                const totalPath = getTotalPath(pathToProperty);
                
                // We are traversing the path, but also making shallow copies all the way down for the new version of the state as we go.
                let newBaseStateObject = Object.assign({}, baseStateObject);
                let newPropertyObject = newBaseStateObject;
            
                // We do - 1 to the length because we don't want to end up with the actual property at the end, just right before.
                for (let i = 0; i < totalPath.length - 1; i++) {
                    let pathSegment = totalPath[i];
                    const nextPropertyObject = newPropertyObject[pathSegment];
            
                    let newNextPropertyObject
                    // Sometimes some slippery arrays make their way in here... those get cloned differently.
                    if (Array.isArray(nextPropertyObject)) {
                    newNextPropertyObject = [...nextPropertyObject]
                    } else {
                    newNextPropertyObject = Object.assign({}, nextPropertyObject);
                    }
                    
                    newPropertyObject[pathSegment] = newNextPropertyObject;
                    newPropertyObject = newNextPropertyObject
                }
            
                // Now we have the property object right at the end of the path and have done our shallow clones all the way to it.
                if (totalPath.length === 0) {
                    newPropertyObject = newValue;
                } else {
                    newPropertyObject[totalPath[totalPath.length - 1]] = newValue;
                }
                setMenuConfig(newBaseStateObject);
                return newBaseStateObject;
            }
        ));
    }

    return (<>
        <div className="centerMenuOuterDiv">
            <div className="menuTitleBar">
                <div className="menuTitleBarTitle">{title}</div>
                <RetroButton text={"X"} onClickHandler={() => {
                    const resetMenuConfig = {...defaultMenuConfig};
                    setMenuConfig(resetMenuConfig);
                    setCenterScreenMenu({ show: false, menuType: undefined, data: undefined });
                }} showTriangle={false} disabled={false}></RetroButton>
            </div>
            {menuLayout}
        </div>
    </>);
}