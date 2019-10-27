/* global Autodesk */
/* global THREE */

class PinchZoomFixExtension extends Autodesk.Viewing.Extension {
  constructor(viewer, options) {
    super(viewer, options);
    this.viewer = viewer;
    this.options = options;
  }

  load() {
    const pinchZoomFixTool = new PinchZoomTool();
    const toolRegistered = this.viewer.toolController.registerTool(pinchZoomFixTool);
    const toolActivated = this.viewer.toolController.activateTool(pinchZoomFixTool.getNames()[0]);
    if (toolRegistered && toolActivated) {
      return true;
    } else {
      return false;
    }
  }

  unload() {
    return true;
  }

  static get ExtensionId() {
    return 'Configurator.Extension.PinchZoomFix';
  }
}

class PinchZoomTool extends Autodesk.Viewing.ToolInterface {
  constructor() {
    super()
    this.names = ['PinchZoomTool'];
  }

  getNames() {
    return this.names;
  }

  handleGesture(event) {
    // We don't care about drag gestures - leave these to another handler
    if (event.type.indexOf('drag') === 0) {
      return false;
    } else if (event.type.indexOf('pinch') === 0 || event.type.indexOf('rotate') === 0) {

      // Pinch or rotate gestures should result in a zoom (with no rotation)
      let target = this._viewer.navigation.getTarget();
      if (event.type === 'pinchstart' || event.type === 'rotatestart') {
        // When the gesture starts, we'll store the view direction
        // and initial distance between the camera and target
        let position = this._viewer.navigation.getPosition();

        this._direction = new THREE.Vector3();

        this._direction.subVectors(position, target);

        this._dist = this._direction.length();
      }
      // Then we normalize the direction vector and multiply it by the
      // scale factor of the gesture, adding this to the target to get
      // the new camera position
      this._direction.normalize();

      this._direction.multiplyScalar(this._dist / event.scale);

      let newPos = target.add(this._direction);

      this._viewer.navigation.setPosition(newPos);
      return true;
    }
    return false;
  }
}

Autodesk.Viewing.theExtensionManager.registerExtension(
    PinchZoomFixExtension.ExtensionId,
    PinchZoomFixExtension
);
