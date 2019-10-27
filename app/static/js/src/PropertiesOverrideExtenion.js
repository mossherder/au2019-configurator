/* global Autodesk */

class ConfiguratorPropertiesExtension extends Autodesk.Viewing.Extension {
  constructor(viewer, options) {
    super(viewer, options);
    this.viewer = viewer;
    this.options = options;
  }

  load() {
    this.panel = new ConfiguratorPropertiesPanel(this.viewer, this.options);
    this.viewer.setPropertyPanel(this.panel);
    return true;
  }

  unload() {
    this.viewer.setPropertyPanel(null);
    this.panel = null;
    return true;
  }

  static get ExtensionId() {
    return 'Configurator.Extension.Properties';
  }
}

class ConfiguratorPropertiesPanel extends Autodesk.Viewing.Extensions.ViewerPropertyPanel {
  constructor(viewer, options) {
    super(viewer);
    this.viewer = viewer;
    this.options = options;
  }

  /**
   *
   * This setProperties method is overriding super and is called on
   * selectionchange
   * events.
   *
   */
  setProperties(properties, options) {
    this.properties = properties;
    this.options = options;
    this.updateProperties();
    this.updateTitle();
  }

  updateTitle() {
    this.setTitle('Properties');
  }

  updateProperties() {
    this.removeAllProperties();
    this.addCustomPropertiesToPanel();
  }

  addCustomPropertiesToPanel() {
    const customProperties = this.findProperties();
    this.setCustomProperties(customProperties);
  }

  findProperties() {
    const customProperties = [];
    this.properties.forEach((property) => {
      if (this.isCustomProperty(property)) {
        customProperties.push(property);
      }
    });
    return customProperties;
  }

  isCustomProperty(property) {
    return this.customPropertyNames().includes(property.displayName);
  }

  customPropertyNames() {
    return [
      'Manufacturer',
      'Description',
    ];
  }

  setCustomProperties(properties) {
    const additionPropertiesGroupName = 'Manufacturing Information';
    properties.forEach((property) => {
      this.addProperty(
          property.displayName,
          property.displayValue,
          additionPropertiesGroupName
      );
    });
  }
}

Autodesk.Viewing.theExtensionManager.registerExtension(
    ConfiguratorPropertiesExtension.ExtensionId,
    ConfiguratorPropertiesExtension
);
