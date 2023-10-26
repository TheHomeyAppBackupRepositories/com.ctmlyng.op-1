'use strict';

const { Cluster, TimeCluster, ZCLDataTypes  } = require('zigbee-clusters');



class CTMSpecificTimeCluster extends TimeCluster{
    
    static get COMMANDS() {
      return {
        ...super.COMMANDS,
        setTime: {
          id: 253,
          // Optional property that can be used to implement two commands with the same id but different directions. Both commands must have a direction property in that case. See lib/clusters/iasZone.js as example.
          // direction: Cluster.DIRECTION_SERVER_TO_CLIENT
          args: {
            Data: ZCLDataTypes.data56, // Use the `ZCLDataTypes` object to specify types
          },
        },  
      }
    }
  
  
    static get ATTRIBUTES() {
        return {
          ...super.ATTRIBUTES,
          //time: { id: 0x000, type: ZCLDataTypes.UTC },
          //timeStatus: { id: 0x0001, type: ZCLDataTypes.map8('master', 'synchronized', 'masterZoneDst', 'superseding') },
          //timeZone: { id: 0x0002, type: ZCLDataTypes.int32},
          //dstStart: { id: 0x0003, type: ZCLDataTypes.uint32},
          //dstEnd: { id: 0x0004, type: ZCLDataTypes.uint32},
          //dstShift: { id: 0x0005, type: ZCLDataTypes.int32},
          //standardTime: { id: 0x0006, type: ZCLDataTypes.uint32},
          //localTime: { id: 0x0007, type: ZCLDataTypes.uint32},
          //lastSetTime: { id: 0x0007, type: ZCLDataTypes.UTC},
          //validUntilTime: { id: 0x0007, type: ZCLDataTypes.UTC},
        };
      }
}



Cluster.addCluster(CTMSpecificTimeCluster);

module.exports = CTMSpecificTimeCluster;


