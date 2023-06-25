'use strict';


const { Cluster, ZCLDataTypes } = require('zigbee-clusters');

const ATTRIBUTES = {
  alarm_status: { id: 1, type: ZCLDataTypes.uint8, manufacturerId: 0x1337 },
  change_battery: { id: 2, type: ZCLDataTypes.uint8, manufacturerId: 0x1337 },
  active: { id: 5, type: ZCLDataTypes.uint8, manufacturerId: 0x1337 },
  runtime: { id: 6, type: ZCLDataTypes.uint16, manufacturerId: 0x1337 },
  runtime_timeout: { id: 7, type: ZCLDataTypes.uint16, manufacturerId: 0x1337 },
  dip_sw: { id: 9, type: ZCLDataTypes.uint8, manufacturerId: 0x1337 },

};
const COMMANDS = {};


class CookerGuardCluster extends Cluster {

  static get ID() {
    return 65481; // The cluster id 0xFFC9
  }

  static get NAME() {
    return 'CookerGuard'; // The cluster name
  }
  
  
  static get ATTRIBUTES() {
    return ATTRIBUTES; // Returns the defined attributes

  }
  

  static get COMMANDS() {
    return COMMANDS; // Returns the defined commands
  }

}

Cluster.addCluster(CookerGuardCluster);



module.exports = CookerGuardCluster;