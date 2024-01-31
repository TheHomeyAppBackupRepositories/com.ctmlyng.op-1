const { Cluster, OnOffCluster, ZCLDataTypes } = require('zigbee-clusters');


class CTMmbdCluster extends OnOffCluster  {


	static get ATTRIBUTES() {
		return {
		  ...super.ATTRIBUTES,
		  relay_state: { id: 0x5001, type: ZCLDataTypes.bool, manufacturerId: 0x1337},
		};
	}
    

  }
  
  Cluster.addCluster(CTMmbdCluster);

  module.exports = CTMmbdCluster;