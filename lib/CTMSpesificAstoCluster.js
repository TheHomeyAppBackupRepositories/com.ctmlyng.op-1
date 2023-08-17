'use strict';

const { Cluster, OnOffCluster , ZCLDataTypes } = require('zigbee-clusters');

class CTMspecificAstroCluster extends OnOffCluster  {

  static get ATTRIBUTES() {
    return {
      ...super.ATTRIBUTES,
      device_mode: { id: 0x2200, type: ZCLDataTypes.uint8,},
      device_enable: { id: 0x2201, type: ZCLDataTypes.bool,},
      tamper_lock: { id: 0x2202, type: ZCLDataTypes.bool,},
      on_time: { id: 0x4001, type: ZCLDataTypes.uint16,}
    };
  }

}

Cluster.addCluster(CTMspecificAstroCluster);

module.exports = CTMspecificAstroCluster;
