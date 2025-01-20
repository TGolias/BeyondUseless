import React from "react";
import './CenterMenu.css';
import { RetroButton } from "../SimpleComponents/RetroButton";

const menuCollection = {
    HealthMenu: {
        title: "Health Menu",
        createMenuLayout: () => {
            return (<><div>HELLO!</div></>)
        }
    }
}

export function CenterMenu({menuType, setCenterScreenMenu}) {
    const menu = menuCollection[menuType];
    let title = "";
    const menuLayout = [];

    if (menu) {
        title = menu.title;
        menuLayout.push(menu.createMenuLayout());
    }

    return (<>
        <div className="centerMenuOuterDiv">
            <div className="menuTitleBar">
                <div className="menuTitleBarTitle">{title}</div>
                <RetroButton text={"X"} onClickHandler={() => setCenterScreenMenu({ show: false, menuType: undefined })} showTriangle={false} disabled={false}></RetroButton>
            </div>
            {menuLayout}
        </div>
    </>);
}