/* global window */
/* global console */
import ForgeViewer from './ForgeViewer.js';

const forgeViewerDivId = 'forge-viewer'; // HTML Element Id

const viewerConfig = {
  'extensions': [
    'Configurator.Extension.Configurator',
    // 'Configurator.Extension.DefaultDimension',
    // 'Configurator.Extension.PacksOfProduct',
    // 'Configurator.Extension.Properties'
  ],
};

const getModelData = $.ajax({
  url: '/model',
  type: 'POST',
});

getModelData.done(function(data) {
  const viewer = new ForgeViewer(
      data['documentId'],
      data['accessToken'],
      forgeViewerDivId,
      false,
      viewerConfig
  );
  window.addEventListener(viewer.VIEWER_READY, () => {
    console.log('Viewer Ready - Model Loaded');
  },
  {
    'once': true,
  }
  );
});
