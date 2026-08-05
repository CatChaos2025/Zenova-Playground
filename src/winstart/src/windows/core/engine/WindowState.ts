/* prettier-ignore */
/** 
 * <<--------------------------------------------------------------------------------->>
 *              _      _
 *             / \    / \      @package WinStart
 *            /  _\__/ ^ \     @file WindowState.ts
 *           /   __    __ \    @autor CatChaos2025 <https://github.com/CatChaos2025>
 *     ____  \______^_____/    @license Apache-2.0
 *    (___ \   /        |      @copyright 2025-2026 CatChaos2025
 *        \ \ /         |
 * <<--------------------------------------------------------------------------------->>
 * */

export type WindowStateEnum = 
    | 'NORMAL'
    | 'MINIMIZED'
    | 'MAXIMIZED'
    | 'DRAGGING'
    | 'RESIZING';

export class WindowStateMachine {
    private currentState: WindowStateEnum = 'NORMAL';

    public getState(): WindowStateEnum {
        return this.currentState;
    }

    public canTrasitionTo(newState: WindowStateEnum) : boolean {
        switch (this.currentState) {
            case 'MINIMIZED':
                return newState === 'NORMAL'; 
                
            case 'MAXIMIZED':
                return newState === 'NORMAL' || newState === 'MINIMIZED';  

            case 'DRAGGING':
            case 'RESIZING':
                return newState === 'NORMAL' || newState === 'MAXIMIZED'; 

            case 'RESIZING':
                return newState === 'NORMAL' || newState === 'MAXIMIZED';

            case 'NORMAL':
                return true;

            default:
                return false
        }
    }

    public transition(newState: WindowStateEnum): boolean {
        if (this.canTrasitionTo(newState)) {
            this.currentState = newState;
            return true;
        }
        return false;
    }
}