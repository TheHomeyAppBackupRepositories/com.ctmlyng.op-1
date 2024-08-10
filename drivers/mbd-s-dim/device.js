'use strict';


const { ZigBeeLightDevice } = require('homey-zigbeedriver');
const { CLUSTER, ZCLNode } = require('zigbee-clusters');
const CTMSpesificOnOffCluster = require('../../lib/CTMSpesificOnOffCluster');


class mdb_dim extends ZigBeeLightDevice {

  /**
   * onInit is called when the device is initialized.
   */
  async onNodeInit({ zclNode }) {
      //this.enableDebug();
	  this.print_log = 0;
      this.setAvailable().catch(this.error);


		try {
			if(this.hasCapability('onoff.rele') === true){
				await this.removeCapability('onoff.rele');
			}
		} catch (err) {}
		
		try {
			if(this.hasCapability('onoff.bevegelse') === false){
				await this.addCapability('onoff.bevegelse');
			}
		} catch (err) {}
		

	  if(this.isFirstInit()){
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
					
				]).catch(this.error);

			} catch (err) {
				//this.setUnavailable().catch(this.error);
				this.error('Error in configureAttributeReporting: ', err);
			}	
	  	}



		try {
			this.readattribute = await zclNode.endpoints[1].clusters[CLUSTER.ON_OFF.NAME].readAttributes('onOff').catch(this.error);
      		this.setCapabilityValue('onoff.bevegelse', this.readattribute.onOff).catch(this.error);

      		this.readattribute = await zclNode.endpoints[1].clusters[CLUSTER.ON_OFF.NAME].readAttributes('relay_state').catch(this.error);
			this.setCapabilityValue('onoff', this.readattribute.relay_state).catch(this.error);

		} catch (err) {
			this.setUnavailable('Cannot reach zigbee device').catch(this.error);
			this.error('Error in readAttributes onOff: ', err);
		}

		try {
	
			this.readattribute = await zclNode.endpoints[1].clusters[CLUSTER.BALLAST_CONFIGURATION.NAME].readAttributes('maxLevel', 'minLevel', 'powerOnLevel').catch(this.error);
			
			if(this.print_log === 1)  this.log("'maxLevel', 'minLevel', 'powerOnLevel'", this.readattribute);

			this.settings = this.getSettings();

			if((this.readattribute.maxLevel) > 99 || (this.readattribute.maxLevel < 10)) this.readattribute.maxLevel = this.settings.setting_max_dim;
			if((this.readattribute.minLevel) > 80 || (this.readattribute.minLevel < 1)) this.readattribute.minLevel = this.settings.setting_min_dim;
			if((this.readattribute.powerOnLevel) > 99 || (this.readattribute.powerOnLevel < 1)) this.readattribute.powerOnLevel = this.settings.setting_on_dim;
			
			this.setSettings({
				setting_max_dim: this.readattribute.maxLevel,
				setting_min_dim: this.readattribute.minLevel,
				setting_on_dim: this.readattribute.powerOnLevel
			}).catch(this.error);

		} catch (err) {
			this.error('Error in readAttributes maxLevel, minLevel, powerOnLevel: ', err);
		}

    
/******************************************************************************* */
/*
/*      Relestatus:
/*
**********************************************************************************/ 
 


	if (this.hasCapability('onoff.bevegelse')) {

		zclNode.endpoints[1].clusters[CLUSTER.ON_OFF.NAME].on('attr.onOff', (attr_value) => {
			try {
				this.setAvailable().catch(this.error);
				if(this.print_log === 1)  this.log('push: attr.onOff: ', attr_value);

				this.setCapabilityValue('onoff.bevegelse', attr_value).catch(this.error);

			} catch (err) {
				this.error('Error in onOff: ', err);
			}
		});

		this.registerCapabilityListener('onoff.bevegelse', async (onOff) => {
			try {
				
				if(onOff === false){
					if(this.print_log === 1)  this.log ('set to: Off');
					await zclNode.endpoints[1].clusters[CLUSTER.ON_OFF.NAME].setOff({},{
						waitForResponse: false,
					}).catch(this.error);
				} else {
					if(this.print_log === 1)  this.log ('set to: ON');
					await zclNode.endpoints[1].clusters[CLUSTER.ON_OFF.NAME].setOn({},{
						waitForResponse: false,
					}).catch(this.error);
				}
				
				this.setCapabilityValue('onoff.bevegelse', onOff).catch(this.error);

				if(this.print_log === 1)  this.log ('onoff.bevegelse set to:', onOff);
			
			} catch (err) {
				this.error('Error in setting onoff.bevegelse: ', err)
			}

		});




	}



/******************************************************************************* */
/*
/*      Relestatus:
/*
**********************************************************************************/ 


	if (this.hasCapability('onoff')) {

	
		zclNode.endpoints[1].clusters[CLUSTER.ON_OFF.NAME].on('attr.relay_state', (attr_value) => {
			try {
						
				if(this.print_log === 1)  this.log('push relay_state: ', attr_value);
				//this.enableDebug();
				this.setAvailable().catch(this.error);
				this.setCapabilityValue('onoff', attr_value).catch(this.error);
			
			} catch (err) {
				this.error('Error in rele: ', err);
			}
		});
	


		
		this.registerCapabilityListener('onoff', async (relay_state) => {
			try {
				await zclNode.endpoints[1].clusters.onOff.writeAttributes({ relay_state: relay_state });
				if(this.print_log === 1)  this.log ('relay_state set to:', relay_state)
				this.setCapabilityValue('onoff', relay_state).catch(this.error);
        
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
				
              if(this.print_log === 1)  this.log('pirOccupiedToUnoccupiedDelay sek : ', data);
              if(data < 60){

				if(this.data_format != 1){
					if(this.print_log === 1)  this.log("Change CapabilityOptions runtime");
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
					if(this.print_log === 1)  this.log("Change CapabilityOptions runtime");
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
              if(this.print_log === 1)  this.log('occupancy : ', (data));
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
              //if(this.print_log === 1)  this.log('pirOccupiedToUnoccupiedDelay min : ', (data/60));
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
							
					if(this.print_log === 1)  this.log('attr.currentLevel: ', attr_value);

					/*
					if(this.getCapabilityValue('onoff') === false){
						this.setCapabilityValue('dim', (attr_value / 254));
					} else {
						this.setCapabilityValue('dim', 0);
					}
					*/
					this.setAvailable().catch(this.error);

					this.setCapabilityValue('dim', (attr_value / 254)).catch(this.error);

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

				if(this.print_log === 1)  this.log ('dim currentLevel set to:', currentLevel);
				
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

				if(this.print_log === 1)  this.log('maxLevel: ', attr_value);
				this.setSettings({
					setting_max_dim: attr_value,
				}).catch(this.error);


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

				if(this.print_log === 1)  this.log('minLevel: ', attr_value);
				this.setSettings({
					setting_min_dim: attr_value,
				}).catch(this.error);


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

				if(this.print_log === 1)  this.log('powerOnLevel: ', attr_value);
				this.setSettings({
					setting_on_dim: attr_value,
				}).catch(this.error);

			} catch (err) {
				this.error('Error in powerOnLevel: ', err);
			}
		});


	} catch (err) {
		this.error('Error in readAttributes powerOnLevel: ', err);
	}





      

  }

  	/********************************************************************************/
	/*
	/*      FLOWCARD - Change Dimlevel WithoutOn
	/*      Gir oss muligheten til å endre dimmernivå uten at lyset slåes på. 
	/*           
	**********************************************************************************/ 

	async flowChangeDimlevelWithoutOn(args){

		try {
			this.dim_level = (args.dim_level / 100);

			this.zclNode.endpoints[1].clusters.levelControl.moveToLevel(
				{
					level: Math.round(this.dim_level * 254),
					transitionTime: 0,
				},
				{
					waitForResponse: false,
				}
			);


			this.setCapabilityValue('dim', this.dim_level);
		} catch (err) {
			this.error('Error in flowChangeDimlevelWithoutOn: ', err);
			throw new Error('Error: Something went wrong');
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
			/*      setting_min_dim - 
			/*      
			**********************************************************************************/ 
			
			if (event.changedKeys.includes('setting_min_dim')) {
				
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
			/*      setting_max_dim - 
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
