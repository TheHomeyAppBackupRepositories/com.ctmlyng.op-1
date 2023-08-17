'use strict';


const { Cluster, ZCLDataTypes } = require('zigbee-clusters');

const ATTRIBUTES = {
  group_id: { id: 0, type: ZCLDataTypes.uint16, manufacturerId: 0x1337 },
  scene_id: { id: 257, type: ZCLDataTypes.uint8, manufacturerId: 0x1337 },
};
const COMMANDS = {};


class CTMGroupScenesConfigCluster extends Cluster {

  static get ID() {
    return 65191; // The cluster id 0xFEA7
  }

  static get NAME() {
    return 'GroupScenesConfig'; // The cluster name
  }
  
  
  static get ATTRIBUTES() {
    return ATTRIBUTES; // Returns the defined attributes

  }
  

  static get COMMANDS() {
    return COMMANDS; // Returns the defined commands
  }

}

Cluster.addCluster(CTMGroupScenesConfigCluster);



module.exports = CTMGroupScenesConfigCluster;