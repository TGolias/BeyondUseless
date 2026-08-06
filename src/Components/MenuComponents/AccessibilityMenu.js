import React from 'react';
import './AccessibilityMenu.css';
import { RetroButton } from '../SimpleComponents/RetroButton';

export function AccessibilityMenu({setCenterScreenMenu}) {
    return (<>
            <div>Font Type:</div>
            <div className="accessibilityMenuFormVsFunctionWrapper">
                <RetroButton text="Form" onClickHandler={() => {
                    setCenterScreenMenu({ show: false, menuType: undefined, data: undefined });
                }} showTriangle={false} disabled={false}></RetroButton>
                <div>or</div>
                <RetroButton text="Function" onClickHandler={() => {
                    setCenterScreenMenu({ show: false, menuType: undefined, data: undefined });
                }} showTriangle={false} disabled={false}></RetroButton>
            </div>
            <div className="accessibilityMenuButtonsWrapper">
                <RetroButton text="OK" onClickHandler={() => {
                    setCenterScreenMenu({ show: false, menuType: undefined, data: undefined });
                }} showTriangle={false} disabled={false}></RetroButton>
            </div>
        </>);
}