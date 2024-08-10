'use strict';

const { Cluster, OnOffCluster , ZCLDataTypes } = require('zigbee-clusters');

class CTMSpesificOnOffCluster extends OnOffCluster  {

  static get ATTRIBUTES() {
    return {
      ...super.ATTRIBUTES,
      device_mode: { id: 0x2200, type: ZCLDataTypes.uint8,},
      device_enable: { id: 0x2201, type: ZCLDataTypes.bool,},
      tamper_lock: { id: 0x2202, type: ZCLDataTypes.bool,},
      on_time: { id: 0x4001, type: ZCLDataTypes.uint16,},
      relay_state: { id: 0x5001, type: ZCLDataTypes.bool, manufacturerId: 0x1337}
    };
  }

}

Cluster.addCluster(CTMSpesificOnOffCluster);

module.exports = CTMSpesificOnOffCluster;
