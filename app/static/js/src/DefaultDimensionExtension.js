/* global Autodesk */
/* global THREE */

class DefaultDimensionExtension extends Autodesk.Viewing.Extension {
  constructor(viewer, options) {
    super(viewer, options);
    this.viewer = viewer;
    this.options = options;
    this.currentIsolatedElement = null;
    this.defaultDimensionElementName = 'EX_Sub-Unistrut';
    this.defaultDimensionParameterName = 'Strut Width'
    this.configuratorTagId = 'configurator-tag';
    this.configuratorTagClass = 'configurator-tag-item';
    this.configuratorTagEndClass = 'configurator-tag-end';
    this.configuratorTagEndOneId = 'configurator-tag-end-one';
    this.configuratorTagEndTwoId = 'configurator-tag-end-two';
    this.configuratorTagLineId = 'configurator-tag-line';
    this.forgeViewerId = 'forge-viewer';
  }

  load() {
      this.viewer.addEventListener(Autodesk.Viewing.ISOLATE_EVENT, (event) => {
        this.handleIsolationChange(event);
      });
      this.viewer.addEventListener(Autodesk.Viewing.CAMERA_CHANGE_EVENT, (event) => {
        this.handleCameraChange(event);
      });
      return true;
  }

  unload() {
    return true;
  }

  handleIsolationChange(event) {
    const currentIsolatedDbId = event.nodeIdArray[0];
    this.updateDimensionByParentDbId(currentIsolatedDbId);
  }

  handleCameraChange() {
    if (!this.viewer.model) {
      return;
    }
    const currentIsolatedNodes = this.viewer.getIsolatedNodes();
    if (currentIsolatedNodes.length != 1) {
      return;
    }
    this.updateDimensionByParentDbId(currentIsolatedNodes[0]);
  }

  async updateDimensionByParentDbId(dbId) {
    this.removeCurrentTags();
    this.createTags();
    const childDbIds = await this.getChildDbIds(dbId);
    const defaultElementDbId = await this.getDbIdByDbIdsAndName(childDbIds, this.defaultDimensionElementName);
    this.updateTagPositions([defaultElementDbId]);

    const defaultParameterValue = await this.getDefaultParameterValue(dbId);
    this.updateTagLabelText(defaultParameterValue);
  }

  getChildDbIds(dbId) {
    return new Promise((resolve) => {
      this.viewer.getProperties(dbId, (element) => {
        const childDbIds = [];
        element.properties.forEach((property) => {
          if (property.displayCategory == '__child__') {
            childDbIds.push(property.displayValue);
          }
        });
        resolve(childDbIds);
      });
    });
  }

  getDbIdByDbIdsAndName(dbIds, name) {
    return new Promise((resolve) => {
      dbIds.forEach((dbId) => {
        this.viewer.getProperties(dbId, (element) => {
          if (element.name.includes(name)) {
            resolve(element.dbId);
          }
        });
      });
    });
  }

  removeCurrentTags() {
    this.currentTag().remove();
    this.currentTagEndOne().remove();
    this.currentTagEndTwo().remove();
    this.currentTagLine().remove();
  }

  currentTag() {
    return $('#' + this.configuratorTagId);
  }

  currentTagEndOne() {
    return $('#' + this.configuratorTagEndOneId);
  }

  currentTagEndTwo() {
    return $('#' + this.configuratorTagEndTwoId);
  }

  currentTagLine() {
    return $('#' + this.configuratorTagLineId);
  }

  createTags() {
    const configuratorTagEndClasses = [
      this.configuratorTagEndClass,
      this.configuratorTagClass,
      'measure-label-icon'
    ].join(' ');

    const tag = $('<div>', {
      id: this.configuratorTagId,
      class: this.configuratorTagClass
    });
    const tagEnd1 = $('<div>', {
      class: configuratorTagEndClasses,
      id: this.configuratorTagEndOneId
    });
    const tagEnd2 = $('<div>', {
      class: configuratorTagEndClasses,
      id: this.configuratorTagEndTwoId
    });
    const tagLine = $('<div>', {
      id: this.configuratorTagLineId,
      class: 'measurement-selection-area ' + this.configuratorTagClass
    });
    tag.appendTo($('#' + this.forgeViewerId).children());
    tagEnd1.appendTo($('#' + this.forgeViewerId).children());
    tagEnd2.appendTo($('#' + this.forgeViewerId).children());
    tagLine.appendTo($('#' + this.forgeViewerId).children());
  }

  updateTagPositions(dbIds) {
    const tagOne = this.currentTagEndOne();
    const tagTwo = this.currentTagEndTwo();
    const tagLabel = this.currentTag();
    const tagLine = this.currentTagLine();

    const tagEndLocations = this.getElementEndsByDbIds(dbIds);
    const locationCenter = this.vectorMidpoint(tagEndLocations[0], tagEndLocations[1]);

    const centerCanvasCoordinates = this.viewer.worldToClient(locationCenter);
    const locationOneCanvasCoordinates = this.viewer.worldToClient(tagEndLocations[0]);
    const locationTwoCanvasCoordinates = this.viewer.worldToClient(tagEndLocations[1]);

    const lineLength = Math.hypot(locationTwoCanvasCoordinates.y - locationOneCanvasCoordinates.y, locationTwoCanvasCoordinates.x - locationOneCanvasCoordinates.x);
    const lineDegrees = Math.atan2(locationTwoCanvasCoordinates.y - locationOneCanvasCoordinates.y, locationTwoCanvasCoordinates.x - locationOneCanvasCoordinates.x) * (180 / Math.PI);

    tagLabel.css('top', centerCanvasCoordinates.y);
    tagLabel.css('left', centerCanvasCoordinates.x);
    tagOne.css('top', locationOneCanvasCoordinates.y);
    tagOne.css('left', locationOneCanvasCoordinates.x);
    tagTwo.css('top', locationTwoCanvasCoordinates.y);
    tagTwo.css('left', locationTwoCanvasCoordinates.x);
    tagLine.css('top', locationOneCanvasCoordinates.y);
    tagLine.css('left', locationOneCanvasCoordinates.x);
    tagLine.css('transform', 'rotate(' + lineDegrees + 'deg)');
    tagLine.css('transform-origin', '0 7.5px');
    tagLine.css('width', lineLength + 'px');
    tagLine.css('height', '3px');
    return true;
  }

  getElementBoundingBoxCenterByDbIds(dbIds) {
    const elementBoundingBox = this.getBoundingBox(dbIds);
    const boxCenter = new THREE.Vector3();
    elementBoundingBox.center(boxCenter);

    return boxCenter;
  }

  getElementEndsByDbIds(dbIds) {
    const fragIds = this.getFirstFragIdsByDbIds(dbIds);
    const elementEndVertices = fragIds.map((fragId) => {return this.getVerticesByFragId(fragId);})[0];
    let vertexEndOne;
    let vertexEndTwo;
    elementEndVertices.forEach((vertex, index) => {
      if (vertex.equals(new THREE.Vector3())) {
        return;
      } else {
        if (index == 0) {
          vertexEndOne = vertex;
          vertexEndTwo = vertex;
        } else {
          if (vertex.distanceTo(vertexEndOne) > vertexEndTwo.distanceTo(vertexEndOne)) {
            vertexEndTwo = vertex;
          }
        }
      }
    });
    return [
      vertexEndOne,
      new THREE.Vector3(vertexEndTwo.x, vertexEndTwo.y, vertexEndOne.z)
    ];
  }

  vectorMidpoint(v1, v2) {
    const tagCenterVector = new THREE.Vector3();
    tagCenterVector.addVectors(v1, v2);
    tagCenterVector.divideScalar(2.0);
    return tagCenterVector;
  }

  getDefaultParameterValue(dbId) {
    return new Promise((resolve) => {
      this.viewer.getProperties(dbId, (element) => {
        const defaultParameter = element.properties.find((property) => {return property.attributeName == this.defaultDimensionParameterName});
        resolve(defaultParameter.displayValue);
      });
    })
  }

  updateTagLabelText(text) {
    this.currentTag().text(text);
  }

  /**
   * Uses dbId element fragments to build boundingbox of element
   * @param {Array<number>} dbIds dbIds of element to find boundingBox
   * @return {THREE.Box3} dbId elements bounding box
   */
  getBoundingBox(dbIds) {
    const totalBox = new THREE.Box3();
    const instanceTree = this.viewer.model.getInstanceTree();
    dbIds.forEach((dbId) => {
      const fragBox = new THREE.Box3();
      const fragIds = [];
      instanceTree.enumNodeFragments(dbId, function(fragId) {
        fragIds.push(fragId);
      });
      const fragList = this.viewer.model.getFragmentList();
      fragIds.forEach(function(fragId) {
        fragList.getWorldBounds(fragId, fragBox);
        totalBox.union(fragBox);
      });
    });
    return totalBox;
  }

  getFirstFragIdsByDbIds(dbIds) {
    const allFragIds = [];
    const instanceTree = this.viewer.model.getInstanceTree();
    dbIds.forEach((dbId) => {
      const fragIds = []
      instanceTree.enumNodeFragments(dbId, (fragId) => {
        fragIds.push(fragId);
      });
      allFragIds.push(fragIds[0]);
    });
    return allFragIds;
  }

  getVerticesByFragId(fragId) {
    const fragProxy = this.viewer.impl.getFragmentProxy(this.viewer.model, fragId);
    fragProxy.updateAnimTransform();
    const renderProxy = this.viewer.impl.getRenderProxy(this.viewer.model, fragId);

    const matrix = new THREE.Matrix4();
    fragProxy.getWorldMatrix(matrix);

    const geometry = renderProxy.geometry;

    const attributes = geometry.attributes;

    const vA = new THREE.Vector3();
    const vB = new THREE.Vector3();
    const vC = new THREE.Vector3();

    const vertices = [];
    if (attributes.index !== undefined) {
      const indices = attributes.index.array || geometry.ib;
      const positions = geometry.vb ? geometry.vb : attributes.position.array;
      const stride = geometry.vb ? geometry.vbstride : 3;

      let offsets = geometry.offsets;
      if (!offsets || offsets.length === 0) {
        offsets = [{start: 0, count: indices.length, index: 0}];
      }

      for (let oi = 0, ol = offsets.length; oi < ol; ++oi) {

        const start = offsets[oi].start;
        const count = offsets[oi].count;
        const index = offsets[oi].index;

        for (let i = start, il = start + count; i < il; i += 3) {

          const a = index + indices[i];
          const b = index + indices[i + 1];
          const c = index + indices[i + 2];

          vA.fromArray(positions, a * stride);
          vB.fromArray(positions, b * stride);
          vC.fromArray(positions, c * stride);

          vA.applyMatrix4(matrix);
          vB.applyMatrix4(matrix);
          vC.applyMatrix4(matrix);

          vertices.push(vA.clone());
          vertices.push(vB.clone());
          vertices.push(vC.clone());
        }
      }

    }
    else {
      const positions = geometry.vb ? geometry.vb : attributes.position.array;
      const stride = geometry.vb ? geometry.vbstride : 3;

      for (let i = 0, j = 0, il = positions.length; i < il; i += 3, j += 9) {

        const a = i;
        const b = i + 1;
        const c = i + 2;

        vA.fromArray(positions, a * stride);
        vB.fromArray(positions, b * stride);
        vC.fromArray(positions, c * stride);

        vA.applyMatrix4(matrix);
        vB.applyMatrix4(matrix);
        vC.applyMatrix4(matrix);

        vertices.push(vA.clone());
        vertices.push(vB.clone());
        vertices.push(vC.clone());
      }
    }
    return vertices;
  }

  static get ExtensionId() {
    return 'Configurator.Extension.DefaultDimension';
  }
}

Autodesk.Viewing.theExtensionManager.registerExtension(
    DefaultDimensionExtension.ExtensionId,
    DefaultDimensionExtension
);
