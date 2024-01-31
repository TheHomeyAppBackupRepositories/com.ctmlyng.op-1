'use strict';


const { ZigBeeLightDevice } = require('homey-zigbeedriver');
const { CLUSTER, ZCLNode } = require('zigbee-clusters');
const CTMmbdCluster = require('../../lib/CTMSpecificMBDCluster');


class mdb_dim extends ZigBeeLightDevice {

  /**
   * onInit is called when the device is initialized.
   */
  async onNodeInit({ zclNode }) {
      //this.enableDebug();
      this.setAvailable().catch(this.error);


	  try{
			
		await this.configureAttributeReporting([
			{
				endpointId: this.getClusterEndpoint(CLUSTER.ON_OFF),
				cluster: CLUSTER.ON_OFF,
				attributeName: 'relay_state',
				minInterval: 1,
				maxInterval: 65534, // once per ~18 hour
				minChange: 1,
			}
			
		]);

		} catch (err) {
			//this.setUnavailable().catch(this.error);
			this.error('Error in configureAttributeReporting: ', err);
		}	



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


	/******************************************************************************* */
	/*
	/*      DIM
	/*
	**********************************************************************************/ 
	if (this.hasCapability('dim')) {
		try {
			
			zclNode.endpoints[1].clusters[CLUSTER.LEVEL_CONTROL.NAME].on('attr.currentLevel', (attr_value) => {
				try {
							
					this.log('attr.currentLevel: ', attr_value);

					/*
					if(this.getCapabilityValue('onoff') === false){
						this.setCapabilityValue('dim', (attr_value / 254));
					} else {
						this.setCapabilityValue('dim', 0);
					}
					*/
					this.setAvailable().catch(this.error);

					this.setCapabilityValue('dim', (attr_value / 254));

				} catch (err) {
					this.error('Error in currentLevel: ', err);
				}
			});
			

							
			this.registerCapabilityListener('dim', async (currentLevel) => {
				try {
					
					this.setCapabilityValue('dim', currentLevel);

					if(currentLevel >= 1){
						this.setCapabilityValue('onoff', true).catch(this.error);
					}
					
					await zclNode.endpoints[1].clusters.levelControl.moveToLevelWithOnOff(
						{
							level: Math.round(currentLevel * 254),
							transitionTime: 0,
						},
						{
							waitForResponse: false,
						}
					);

				this.log ('dim currentLevel set to:', currentLevel);
				
			} catch (err) {
					//this.setUnavailable().catch(this.error);
					this.error('Error in setting currentLevel: ', err)
				}

			});



		} catch (err) {
			this.error('Error in registering or getting capability value (dim): ', err)
		}
	}

	/********************************************************************************/
	/*
	/*      maxLevel
	/*
	**********************************************************************************/ 
	try {

		zclNode.endpoints[1].clusters[CLUSTER.BALLAST_CONFIGURATION.NAME].on('attr.maxLevel', (attr_value) => {
			try {

				this.log('maxLevel: ', attr_value);
				this.setSettings({
					setting_max_dim: attr_value,
				});


			} catch (err) {
				this.error('Error in maxLevel: ', err);
			}
		});

	} catch (err) {
		this.error('Error in readAttributes maxLevel: ', err);
	}

	/********************************************************************************/
	/*
	/*      minLevel
	/*
	**********************************************************************************/ 

	try {

		zclNode.endpoints[1].clusters[CLUSTER.BALLAST_CONFIGURATION.NAME].on('attr.minLevel', (attr_value) => {
			try {

				this.log('minLevel: ', attr_value);
				this.setSettings({
					setting_min_dim: attr_value,
				});


			} catch (err) {
				this.error('Error in minLevel: ', err);
			}
		});


	} catch (err) {
		this.error('Error in readAttributes minLevel: ', err);
	}

	/********************************************************************************/
	/*
	/*      powerOnLevel
	/*
	**********************************************************************************/ 


	try {

		zclNode.endpoints[1].clusters[CLUSTER.BALLAST_CONFIGURATION.NAME].on('attr.powerOnLevel', (attr_value) => {
			try {

				this.log('powerOnLevel: ', attr_value);
				this.setSettings({
					setting_on_dim: attr_value,
				});

			} catch (err) {
				this.error('Error in powerOnLevel: ', err);
			}
		});


	} catch (err) {
		this.error('Error in readAttributes powerOnLevel: ', err);
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

			/********************************************************************************/
			/*
			/*      setting_max_dim - 
			/*      
			**********************************************************************************/ 
			
			if (event.changedKeys.includes('setting_max_dim')) {
				
				this.log('setting_min_dim: ', event.newSettings.setting_min_dim);
				
				try{
					this.zclNode.endpoints[1].clusters.ballastConfiguration.writeAttributes({ minLevel: event.newSettings.setting_min_dim});
				} catch (err) {
					this.error('Error in writeAttributes minLevel: ', err);
					throw new Error('Something went wrong');
				}
				
			};
			
			/********************************************************************************/
			/*
			/*      setting_min_dim - 
			/*      
			**********************************************************************************/ 
			
			if (event.changedKeys.includes('setting_max_dim')) {
				this.log('setting_max_dim: ', event.newSettings.setting_max_dim);
				
				try{
					this.zclNode.endpoints[1].clusters.ballastConfiguration.writeAttributes({ maxLevel: event.newSettings.setting_max_dim});
				} catch (err) {
					this.error('Error in writeAttributes maxLevel: ', err);
					throw new Error('Something went wrong');
				}

			};
			
			/********************************************************************************/
			/*
			/*      setting_on_dim - 
			/*      
			**********************************************************************************/ 
			
			if (event.changedKeys.includes('setting_on_dim')) {
				this.log('setting_on_dim: ', event.newSettings.setting_on_dim);
				
				try {
					this.zclNode.endpoints[1].clusters.ballastConfiguration.writeAttributes({ powerOnLevel: event.newSettings.setting_on_dim});
				} catch (err) {
					this.error('Error in writeAttributes powerOnLevel: ', err);
					throw new Error('Something went wrong');
				}
				
			};


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

module.exports = mdb_dim;
