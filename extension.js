/*
 * This file is part of the Forge GNOME extension
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 */

// Gnome imports
import { Extension } from "resource:///org/gnome/shell/extensions/extension.js";
import * as SessionMode from "resource:///org/gnome/shell/ui/main/sessionMode.js";

import { PACKAGE_VERSION } from "resource:///org/gnome/shell/misc/config.js";

import { gettext as _ } from "resource:///org/gnome/shell/extensions/extension.js";

// Application imports
import { ConfigManager } from "./settings.js";
import { Logger } from "./logger.js";
import { Keybindings } from "./keybindings.js";
import { ThemeManager } from "./theme.js";
import { WindowManager } from "./window.js";
import { FeatureIndicator } from "./indicator.js";

import { production } from "./settings.js";

export default class ForgeExtension extends Extension {
  settings = this.getSettings();

  kbdSettings = this.getSettings("org.gnome.shell.extensions.forge.keybindings");

  logger = new Logger(this.settings);

  /** @type {ConfigManager} */
  configMgr;

  /** @type {ThemeManager} */
  theme;

  /** @type {WindowManager} */
  extWm;

  /** @type {Keybindings} */
  keybindings;

  /** @type {FeatureIndicator|null} */
  indicator = null;

  /** @type {string} */
  prefsTitle;

  sameSession = false;

  constructor(metadata) {
    this.logger.info("init");
    super(metadata);
    this.prefsTitle = `Forge ${_("Settings")} - ${
      !production ? "DEV" : `${PACKAGE_VERSION}-${this.metadata.version}`
    }`;
  }

  enable() {
    this.logger.info("enable");
    this.configMgr = new ConfigManager(this);
    this.theme = new ThemeManager(this);
    this.theme.patchCss();
    this.theme.reloadStylesheet();

    if (this.sameSession) {
      this.logger.debug(`enable: still in same session`);
      this.sameSession = false;
      return;
    }

    this.extWm ||= new WindowManager(this);
    this.keybindings ||= new Keybindings(this);
    this.indicator ||= new FeatureIndicator(this);

    this.extWm.enable();
    this.keybindings.enable();
    this.logger.info(`enable: finalized vars`);
  }

  disable() {
    this.logger.info("disable");

    if (SessionMode.isLocked) {
      this.sameSession = true;
      this.logger.debug(`disable: still in same session`);
      return;
    }

    this.extWm?.disable();

    this.keybindings?.disable();

    if (this.indicator) {
      this.indicator.destroy();
      this.indicator = null;
    }

    this.logger.info(`disable: cleaning up vars`);
    this.extWm = null;
    this.keybindings = null;
    this.settings = null;
    this.indicator = null;
    this.configMgr = null;
    this.theme = null;
  }
}
