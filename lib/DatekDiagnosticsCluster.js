'use strict';


const { Cluster, ZCLDataTypes } = require('zigbee-clusters');

const ATTRIBUTES = {
  last_reset_info: { id: 0, type: ZCLDataTypes.uint8, manufacturerId: 0x1337 },
  last_extended_reset_info: { id: 1, type: ZCLDataTypes.uint16, manufacturerId: 0x1337 },
  reboot_counter: { id: 2, type: ZCLDataTypes.uint16, manufacturerId: 0x1337 },
  last_hop_lqi: { id: 3, type: ZCLDataTypes.uint8, manufacturerId: 0x1337 },
  last_hop_rssi: { id: 4, type: ZCLDataTypes.int8, manufacturerId: 0x1337 },
  tx_power: { id: 5, type: ZCLDataTypes.int8, manufacturerId: 0x1337 },
  parent_node_id: { id: 6, type: ZCLDataTypes.uint16, manufacturerId: 0x1337 },

};
const COMMANDS = {};


class DatekDiagnosticsCluster extends Cluster {

  static get ID() {
    return 65261; // The cluster id 0xFEED
  }

  static get NAME() {
    return 'DatekDiagnosticsCluster'; // The cluster name
  }
  
  
  static get ATTRIBUTES() {
    return ATTRIBUTES; // Returns the defined attributes

  }
  

  static get COMMANDS() {
    return COMMANDS; // Returns the defined commands
  }

}

Cluster.addCluster(DatekDiagnosticsCluster);



module.exports = DatekDiagnosticsCluster;