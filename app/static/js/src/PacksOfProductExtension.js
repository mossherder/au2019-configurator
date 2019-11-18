/* global Autodesk */
/* global THREE */

class PacksOfProductExtension extends Autodesk.Viewing.Extension {
    constructor(viewer, options) {
      super(viewer, options);
      this.viewer = viewer;
      this.options = options;
      this.currentIsolatedElement = null;
      this.clones = [];
      this.forgeViewerId = 'forge-viewer';
    }
  
    load() {
        this.viewer.addEventListener(Autodesk.Viewing.ISOLATE_EVENT, (event) => {
          this.handleIsolationChange(event);
        });
        return true;
    }
  
    unload() {
      return true;
    }
  
    handleIsolationChange(event) {
      const currentIsolatedDbIds = event.nodeIdArray;
      this.createPackByDbId(currentIsolatedDbIds, 2);
    }

    async createPackByDbId(dbIds, qty) {
        this.removeCurrentPack();
        const fragIds = await this.getFragIds(dbIds);
        const overallWidth = this.getWidthOfMesh(fragIds);
        fragIds.forEach((fragId) => {
            for (let i = 0; i < qty - 1; i++) {
              this.cloneFragment(fragId, overallWidth, i);
            }
        });
        this.viewer.impl.sceneUpdated(); 
    }
    
    getFragIds(dbIds) {
      return new Promise((resolve) => {
        let fragIds = [];
        const instanceTree = this.viewer.model.getInstanceTree();
        const forgeElements = dbIds.map((dbId) => {
            return new Promise((resolve) => {
                this.viewer.model.getProperties(dbId, resolve);
            });
        });
        Promise.all(forgeElements).then((elements) => {
          elements.forEach((element) => {
              const properties = element.properties;
              for (let i=0; i<properties.length; i++) {
                  if (properties[i].displayCategory == '__child__') {
                      instanceTree.enumNodeFragments(properties[i].displayValue, (fragId) => {
                          fragIds.push(fragId);
                      });
                  }
              }
          });
          resolve(fragIds);
        });
      });
    }

    cloneFragment(fragId, overallWidth, offset) {
      const currentMesh = this.viewer.impl.getRenderProxy(this.viewer.model, fragId);
      let newMesh = currentMesh.clone();
      newMesh.applyMatrix(currentMesh.matrixWorld);
      newMesh.translateY((overallWidth + 2.0/12.0) * (offset + 1)); // buffer of 2"
      this.viewer.impl.scene.add(newMesh);
      this.clones.push(newMesh);
    }
  
    getWidthOfMesh(fragIds) {
      let fragBox = new THREE.Box3();
      let totalBox = new THREE.Box3();
      const fragList = this.viewer.model.getFragmentList();
      fragIds.forEach((fragId) => {
        fragList.getWorldBounds(fragId, fragBox);
        totalBox.union(fragBox);
      });
      return totalBox.max.y - totalBox.min.y;
    }

    removeCurrentPack() {
      this.clones.forEach((clone) => {
        this.viewer.impl.scene.remove(clone);
      });
      this.viewer.impl.sceneUpdated();
    }
  
    static get ExtensionId() {
      return 'Configurator.Extension.PacksOfProduct';
    }
  }
  
  Autodesk.Viewing.theExtensionManager.registerExtension(
        PacksOfProductExtension.ExtensionId,
        PacksOfProductExtension
  );
  