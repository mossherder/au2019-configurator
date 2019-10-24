/* global console */
/* global window */
/* global sessionStorage */
/* global Event */
/* global Autodesk */

/**
 */
class Configurator extends Autodesk.Viewing.Extension {
  constructor(viewer, options) {
    super(viewer, options);
    this.viewer = viewer;
    this.createToolbarButton;
    this.panel = null;
  }

  load() {
    if (this.viewer.toolbar) {
      // Toolbar is already available, create the UI
      this.createUI();
    } else {
      // Toolbar hasn't been created yet, wait until we get notification of its creation
      this.onToolbarCreatedBinded = this.onToolbarCreated.bind(this);
      this.viewer.addEventListener(this.viewer.TOOLBAR_CREATED_EVENT, this.onToolbarCreatedBinded);
    }
    window.addEventListener('configuratorData', (event) => {
      this.setConfiguratorDB(event);
    });
    console.log('Configurator Loaded!')
    return true;
  }

  unload() {
    this.viewer.toolbar.removeControl(this.subToolbar);
    return true;
  }

  static get ExtensionId() {
    return 'Configurator.Extension.Configurator';
  }

  setConfiguratorDB(event) {
    sessionStorage.setItem('configuratorData', JSON.stringify(event.detail));
    window.dispatchEvent(new Event('configuratorDataChanged'));
  }

  createUI() {
    const buttonName = 'configurator-configuration-button';
    const button1 = new Autodesk.Viewing.UI.Button(buttonName);
    button1.onClick = () => {
      this.showDockingPanel();
    };
    button1.addClass('configurator-configuration-button');
    button1.setToolTip('Configure the Model');

    const toolbarName = 'configurator-toolbar';
    this.subToolbar = new Autodesk.Viewing.UI.ControlGroup(toolbarName);
    this.subToolbar.addControl(button1);

    this.viewer.toolbar.addControl(this.subToolbar);
  }

  onToolbarCreated() {
    this.viewer.removeEventListener(this.viewer.TOOLBAR_CREATED_EVENT, this.onToolbarCreatedBinded);
    this.onToolbarCreatedBinded = null;
    this.createUI();
  }

  showDockingPanel() {
    if (this.panel == null) {
      this.panel = new ConfiguratorConfigurationPanel(
          this.viewer.container,
          'configuratorConfigurationPanel',
          'Configuration Browser',
          null,
          null,
          this.viewer,
          this
      );
    }

    // show/hide docking panel
    this.panel.setVisible(!this.panel.isVisible());
  }
}

class ConfiguratorConfigurationPanel extends Autodesk.Viewing.UI.DockingPanel {
  constructor(viewerContainer, container, id, title, options, viewer, modelBrowser) {
    super(viewerContainer, container, id, title, options);
    this.modelBrowser = modelBrowser;
    this.viewer = viewer;
    this.create();
  }

  create() {
    // the style of the docking panel
    // use this built-in style to support Themes on Viewer 4+
    this.container.classList.add('docking-panel-container-solid-color-a');
    this.container.style.top = '10px';
    this.container.style.left = '10px';
    this.container.style.width = '350';
    this.container.style.height = '400';
    this.container.style.resize = 'auto';

    this.createConfiguratorControlsArea();
    this.updateControls();

    window.addEventListener('configuratorDataChanged', () => {
      this.updateControls();
    });
  }

  createConfiguratorControlsArea() {
    const $controlsTable = $('<table>', {
      id: 'configurator-configuration-area',
      class: 'docking-panel-scroll',
    });
    const $controlsList = $('<tbody>', {
      id: 'overall-controls-body',
    });

    $controlsList.appendTo($controlsTable);

    // Add controls area to the Forge UI Panel
    this.container.appendChild($controlsTable[0]);
  }

  updateControls() {
    const configuratorDataDB = sessionStorage.getItem('configuratorData');
    if (!configuratorDataDB) {
      return;
    } else {
      const configuratorData = JSON.parse(configuratorDataDB);
      const controlsData = configuratorData.controls;
      const controls = this.createControls(controlsData);
      this.setPanelControls(controls);
    }
  }

  createControls(controlsData) {
    return controlsData.map((controlData) => {
      const name = controlData.name;
      const options = controlData.options;
      const controlRow = this.createControlRow(name);
      this.addDropdownToControl(controlRow, options);
      return controlRow;
    });
  }

  createControlRow(name) {
    const controlRow = $('<tr>', {
      class: 'control-row'
    });
    const controlLabel = $('<td>', {
      class: 'control-label',
      text: name + ': '
    });
    controlLabel.appendTo(controlRow);
    return controlRow;
  }

  addDropdownToControl(controlRow, options) {
    const controlDropdownData = $('<td>', {
      class: 'control-row-data'
    });
    const controlDropdown = $('<select>', {
      class: 'configurator-control'
    });
    options.forEach((option) => {
      const optionElement = $('<option>', {
        value: option.value,
        text: option.text
      });
      optionElement.appendTo(controlDropdown);
    });

    controlDropdown.appendTo(controlDropdownData);
    controlDropdownData.appendTo(controlRow);
  }

  setPanelControls(controls) {
    const currentControlsArea = $('#overall-controls-body')
    currentControlsArea.children().remove();
    controls.forEach((control) => {
      const controlRow = $('<tr>', {
        class: 'control-row'
      });
      const controlRowData = $('<td>', {
        class: 'control-row-data'
      });
      control.appendTo(controlRowData);
      controlRowData.appendTo(controlRow);
      controlRow.appendTo(currentControlsArea);
    });
  }
}

Autodesk.Viewing.theExtensionManager.registerExtension(
    Configurator.ExtensionId,
    Configurator
);
