'use strict';


const { ZigBeeDevice } = require('homey-zigbeedriver');
const { CLUSTER, ZCLNode } = require('zigbee-clusters');
const CTMmbdCluster = require('../../lib/CTMSpecificMBDCluster');


class mdb extends ZigBeeDevice {

  /**
   * onInit is called when the device is initialized.
   */
  async onNodeInit({ zclNode }) {
      //this.enableDebug();
      this.setAvailable().catch(this.error);

	  

		try {
			this.readattribute = await zclNode.endpoints[1].clusters[CLUSTER.ON_OFF.NAME].readAttributes('onOff');
      		this.setCapabilityValue('onoff', this.readattribute.onOff).catch(this.error);

      		this.readattribute = await zclNode.endpoints[1].clusters[CLUSTER.ON_OFF.NAME].readAttributes('relay_state');
			this.setCapabilityValue('onoff.rele', this.readattribute.relay_state).catch(this.error);

		} catch (err) {
			this.setUnavailable('Cannot reach zigbee device').catch(this.error);
			this.error('Error in readAttributes onOff: ', err);
		}
    
/******************************************************************************* */
/*
/*      Relestatus:
/*
**********************************************************************************/ 
 


	if (this.hasCapability('onoff')) {

		zclNode.endpoints[1].clusters[CLUSTER.ON_OFF.NAME].on('attr.onOff', (attr_value) => {
			try {
				this.setAvailable().catch(this.error);
				this.log('push: attr.onOff: ', attr_value);

				this.setCapabilityValue('onoff', attr_value);

			} catch (err) {
				this.error('Error in onOff: ', err);
			}
		});

		this.registerCapabilityListener('onoff', async (onOff) => {
			try {
				
				if(onOff === false){
					this.log ('set to: Off');
					await zclNode.endpoints[1].clusters[CLUSTER.ON_OFF.NAME].setOff({},{
						waitForResponse: false,
					});
				} else {
					this.log ('set to: ON');
					await zclNode.endpoints[1].clusters[CLUSTER.ON_OFF.NAME].setOn({},{
						waitForResponse: false,
					});
				}
				
				this.setCapabilityValue('onoff', onOff);

				this.log ('onoff.rele set to:', onOff);
			
			} catch (err) {
				this.error('Error in setting onoff: ', err)
			}

		});




	}



/******************************************************************************* */
/*
/*      Relestatus:
/*
**********************************************************************************/ 


	if (this.hasCapability('onoff.rele')) {

	
		zclNode.endpoints[1].clusters[CLUSTER.ON_OFF.NAME].on('attr.relay_state', (attr_value) => {
			try {
						
				this.log('push relay_state: ', attr_value);
				//this.enableDebug();
				this.setAvailable().catch(this.error);
				this.setCapabilityValue('onoff.rele', attr_value).catch(this.error);
			
			} catch (err) {
				this.error('Error in rele: ', err);
			}
		});
	


		
		this.registerCapabilityListener('onoff.rele', async (relay_state) => {
			try {
				await zclNode.endpoints[1].clusters.onOff.writeAttributes({ relay_state: relay_state });
				this.log ('relay_state set to:', relay_state)
				this.setCapabilityValue('onoff.rele', relay_state).catch(this.error);
        
			} catch (err) {
				this.error('Error in setting relay_state: ', err)
			}
		
		});

	}


/******************************************************************************* */
/*
/*      runtime:
/*
**********************************************************************************/ 
 
      
      if (this.hasCapability('runtime')) {
        try {
          
          
          this.registerCapability('runtime', CLUSTER.OCCUPANCY_SENSING, {
            get: 'pirOccupiedToUnoccupiedDelay',
            getOpts: {
              getOnStart: true,
            },
            report: 'pirOccupiedToUnoccupiedDelay',
            reportParser(data) {
				
              this.log('pirOccupiedToUnoccupiedDelay sek : ', data);
              if(data < 60){

				if(this.data_format != 1){
					this.log("Change CapabilityOptions runtime");
					this.setCapabilityOptions("runtime", {
							title: {
							  en: "Time on in seconds",
							  no: "Påtid i sekunder"
							}

					});
					
					this.data_format = 1
				}
				
                return data
              } else {

				if(this.data_format != 2){
					this.log("Change CapabilityOptions runtime");
					this.setCapabilityOptions("runtime", {
							title: {
								en: "Time on in minutes",
								no: "Påtid i minutter"
							}
					
					});
					this.data_format = 2
				}
				
                return data/60;
              }
            
            },
            endpoint: this.getClusterEndpoint(CLUSTER.OCCUPANCY_SENSING),
          });
          
        } catch (err) {
          this.error('Error in registering or getting capability value (runtime): ', err)
        } 
      }

/******************************************************************************* */
/*
/*      alarm_motion:
/*
**********************************************************************************/ 


      if (this.hasCapability('alarm_motion')) {
        try {
   
          this.registerCapability('alarm_motion', CLUSTER.OCCUPANCY_SENSING, {
            get: 'occupancy',
            getOpts: {
              getOnStart: true,
            },
            report: 'occupancy',
            reportParser(data) {
              this.log('occupancy : ', (data));
              if(data.occupied) return true; else return false;
            },
            endpoint: this.getClusterEndpoint(CLUSTER.OCCUPANCY_SENSING),
          });
          
        } catch (err) {
          this.error('Error in registering or getting capability value (alarm_motion): ', err)
        } 
      }

 /******************************************************************************* */
/*
/*      measure_luminance:
/*
**********************************************************************************/ 

      if (this.hasCapability('measure_luminance')) {
        try {
   
          this.registerCapability('measure_luminance', CLUSTER.ILLUMINANCE_MEASUREMENT, {
            get: 'measuredValue',
            getOpts: {
              getOnStart: true,
            },
            report: 'measuredValue',
            reportParser(data) {
              //this.log('pirOccupiedToUnoccupiedDelay min : ', (data/60));
              //return data/60;
              this.setAvailable().catch(this.error);
              
              this.illuminanceLux = data === 0 ? 0 : Math.pow(10, (data - 1) / 10000);
              return this.illuminanceLux;
            },
            endpoint: this.getClusterEndpoint(CLUSTER.ILLUMINANCE_MEASUREMENT),
          });
          
        } catch (err) {
          this.error('Error in registering or getting capability value (measuredValue): ', err)
        } 
      }



      

  }

  	/********************************************************************************/
	/*
	/*      FLOWCARD - RELE
	/*      
	**********************************************************************************/ 
	async flowEnableRelay(args){
		try {

			await this.zclNode.endpoints[1].clusters.onOff.writeAttributes({ relay_state: args.flow_relay });
			this.setCapabilityValue('onoff.rele', args.flow_relay).catch(this.error);
			this.log ('Flow relay_state set to:', args.flow_relay)

		} catch (err) {
			this.log('flowEnableRelay: ', err);
			throw new Error('Error! Uanble to enable relay');
		}
	}

 	 /********************************************************************************/
	/*
	/*      FLOWCARD - IS RELE
	/*      
	**********************************************************************************/ 
	async flowIs_Rele(args){
		try {

			if (this.getCapabilityValue('onoff.rele') === true){
				return true;
			} else{
				return false;
			}

		} catch (err) {
			this.log('flowIs_Rele: ', err);
			throw new Error('Error! Uanble to get CapabilityValue');
		}
	}



  	/**
	 * onAdded is called when the user adds the device, called just after pairing.
	 */
	async onAdded() {
		this.log('MyDevice has been added');
	}

  	async onEndDeviceAnnounce(){
		this.setAvailable().catch(this.error);
	}
  /**
   * onSettings is called when the user updates the device's settings.
   * @param {object} event the onSettings event data
   * @param {object} event.oldSettings The old settings object
   * @param {object} event.newSettings The new settings object
   * @param {string[]} event.changedKeys An array of keys changed since the previous version
   * @returns {Promise<string|void>} return a custom message that will be displayed
   */
  async onSettings(event) {


  }

  /**
   * onRenamed is called when the user updates the device's name.
   * This method can be used this to synchronise the name to the device.
   * @param {string} name The new name
   */
  async onRenamed(name) {
    this.log('MyDevice was renamed');
  }

  /**
   * onDeleted is called when the user deleted the device.
   */
  async onDeleted() {
    this.log('MyDevice has been deleted');
  }

}

module.exports = mdb;
