/* Fix focus on workspace switch
 * 
 * *********** Author ***********
 * Hidden <hidden@undernet.org>
 *
 * ********* Description ********
 * When a workspace switch occurs, this extension ensures the focus
 * is on a window located on the new workspace.
 */

/*
MIT License

Copyright (c) 2023 Hidden

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/


'use strict';

import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';
import GLib from 'gi://GLib';
import overview from 'resource:///org/gnome/shell/ui/main.js';


const __DEBUG__ = false;
const FOCUS_DELAY_MS = 100; // Delay in milliseconds
let idleFocusHandler = null;

export default class WorkspaceFocusExtension extends Extension {
    enable() {
        this._workspaceSwitchedSignal = global.workspace_manager.connect('workspace-switched', _setFocus);
        if (__DEBUG__) {
            console.log(`WorkspaceFocus enabled`)
        }
    }

    disable() {
        global.workspace_manager.disconnect(this._workspaceSwitchedSignal);
        if (idleFocusHandler) {
            GLib.Source.remove(idleFocusHandler);  // Clear the previous idle focus handler
        }
        if (__DEBUG__) {
            console.log(`WorkspaceFocus disabled`)
        }
    }
}

function isWindowInNonWorkspace(window) {
    const ret = window.is_on_all_workspaces();
    if (__DEBUG__) {
        if (ret) {
            let workspace = window.get_workspace();
            let windowTitle = "";
            // Get the window actor for the given window
            const windowActor = global.get_window_actors().find(actor => actor.metaWindow === window);

            if (windowActor) {
                // Get the window title from the window actor
                windowTitle = windowActor.get_meta_window().get_title();
            }
            const timestamp = GLib.DateTime.new_now_local().format('%Y-%m-%d %H:%M:%S');
            console.debug(`[${timestamp}] isWindowInNonWorkspace() is true for [${workspace.index()}] ${window.get_id()} - ${windowTitle}`);
        }
    }
    return ret;
}


function _setFocus() {
    const workspace = global.workspace_manager.get_active_workspace();
    const windowList = workspace.list_windows();

    const display = global.display;
    const windowList2 = display.sort_windows_by_stacking(windowList);

    for (let i = windowList2.length - 1; i >= 0; i--) {
        let window = windowList2[i];
        if (window.minimized || isWindowInNonWorkspace(window)) {
            continue;
        }

        if (__DEBUG__) {
            let windowTitle = "";
            const windowActor = global.get_window_actors().find(actor => actor.metaWindow === window);
            if (windowActor) {
                windowTitle = windowActor.get_meta_window().get_title();
            }
            const timestamp = GLib.DateTime.new_now_local().format('%Y-%m-%d %H:%M:%S');
            console.debug(`[${timestamp}] Most recent window: [${workspace.index()}] ${window.get_id()} - ${windowTitle}`);
        }

        // Clear any existing idle focus handler
        if (idleFocusHandler) {
            GLib.Source.remove(idleFocusHandler);
        }

        // Wait for ongoing animations to complete before focusing
        idleFocusHandler = GLib.idle_add(GLib.PRIORITY_DEFAULT, () => {
            if (overview.animation_in_progress) {
                if (__DEBUG__) {
                    console.debug(`Animation in progress, waiting...`);
                }
                return true; // Keep waiting
            }

            if (__DEBUG__) {
                console.debug(`Animation finished, activating window.`);
            }

            window.activate(global.get_current_time());
            idleFocusHandler = null; // Clear the reference
            return false; // Stop the idle handler
        });
        break;
    }
}

