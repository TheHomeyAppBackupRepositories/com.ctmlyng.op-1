'use strict';

const Homey = require('homey');
const { ZigBeeLightDevice, Util  } = require('homey-zigbeedriver');
const { ZCLNode, CLUSTER } = require('zigbee-clusters');





class mTouchDim extends ZigBeeLightDevice {

	async	onNodeInit({ zclNode }) {

		this.print_log = 0;
		//this.enableDebug();
		//this.printNode();
		this.setAvailable().catch(err => { this.error(err);});

		if(this.isFirstInit()){
			try{
				
				await this.configureAttributeReporting([
					{
						endpointId: this.getClusterEndpoint(CLUSTER.BALLAST_CONFIGURATION),
						cluster: CLUSTER.BALLAST_CONFIGURATION,
						attributeName: 'maxLevel',
						minInterval: 1,
						maxInterval: 65534, // once per ~18 hour
						minChange: 1,
					},
					{
						endpointId: this.getClusterEndpoint(CLUSTER.BALLAST_CONFIGURATION),
						cluster: CLUSTER.BALLAST_CONFIGURATION,
						attributeName: 'minLevel',
						minInterval: 1,
						maxInterval: 65534, // once per ~18 hour
						minChange: 1,
					},
					{
						endpointId: this.getClusterEndpoint(CLUSTER.BALLAST_CONFIGURATION),
						cluster: CLUSTER.BALLAST_CONFIGURATION,
						attributeName: 'powerOnLevel',
						minInterval: 1,
						maxInterval: 65534, // once per ~18 hour
						minChange: 1,
					},
					
				]).catch(err => { this.error(err);});

			} catch (err) {
				//this.setUnavailable().catch(err => { this.error(err);});
				this.error('Error in configureAttributeReporting: ', err);
			}
		}




		try {
			this.readattribute = await zclNode.endpoints[1].clusters[CLUSTER.ON_OFF.NAME].readAttributes('onOff').catch(err => { this.error(err);});
			this.setCapabilityValue('onoff', this.readattribute.onOff).catch(err => { this.error(err);});
		} catch (err) {
			this.error('Error in readAttributes onOff: ', err);
		}

		try {
			this.readattribute = await zclNode.endpoints[1].clusters[CLUSTER.LEVEL_CONTROL.NAME].readAttributes('currentLevel').catch(err => { this.error(err);});
			this.setCapabilityValue('dim', (this.readattribute.currentLevel / 254)).catch(err => { this.error(err);});
		} catch (err) {
			this.error('Error in readAttributes currentLevel: ', err);
		}

		try {
	
			this.readattribute = await zclNode.endpoints[1].clusters[CLUSTER.BALLAST_CONFIGURATION.NAME].readAttributes('maxLevel', 'minLevel', 'powerOnLevel').catch(err => { this.error(err);});
			
			if(this.print_log === 1)  this.log("'maxLevel', 'minLevel', 'powerOnLevel'", this.readattribute);

			this.settings = this.getSettings();

			if((this.readattribute.maxLevel) > 99 || (this.readattribute.maxLevel < 10)) this.readattribute.maxLevel = this.settings.setting_max_dim;
			if((this.readattribute.minLevel) > 80 || (this.readattribute.minLevel < 1)) this.readattribute.minLevel = this.settings.setting_min_dim;
			if((this.readattribute.powerOnLevel) > 99 || (this.readattribute.powerOnLevel < 1)) this.readattribute.powerOnLevel = this.settings.setting_on_dim;
			
			this.setSettings({
				setting_max_dim: this.readattribute.maxLevel,
				setting_min_dim: this.readattribute.minLevel,
				setting_on_dim: this.readattribute.powerOnLevel
			}).catch(err => { this.error(err);});

		} catch (err) {
			this.error('Error in readAttributes maxLevel, minLevel, powerOnLevel: ', err);
		}


/******************************************************************************* */
/*
/*      ON/OFF
/*
**********************************************************************************/ 


		if (this.hasCapability('onoff')) {
			try {
	



				zclNode.endpoints[1].clusters[CLUSTER.ON_OFF.NAME].on('attr.onOff', (attr_value) => {
					try {
								
						if(this.print_log === 1)  this.log('attr.onOff: ', attr_value);

						this.setCapabilityValue('onoff', attr_value).catch(err => { this.error(err);});
	
					} catch (err) {
						this.error('Error in onoff: ', err);
					}
				});
				
		
				this.registerCapabilityListener('onoff', async (onOff) => {
					try {
						
					
						if(onOff === false){
							if(this.print_log === 1)  this.log ('set to: Off');
							await zclNode.endpoints[1].clusters[CLUSTER.ON_OFF.NAME].setOff({},{
								waitForResponse: false,
							}).catch(err => { this.error(err);});
						} else {
							if(this.print_log === 1)  this.log ('set to: ON');
							await zclNode.endpoints[1].clusters[CLUSTER.ON_OFF.NAME].setOn({},{
								waitForResponse: false,
							}).catch(err => { this.error(err);});
						}
						
						this.setCapabilityValue('onoff', onOff).catch(err => { this.error(err);});

						if(this.print_log === 1)  this.log ('onoff set to:', onOff);
					
					} catch (err) {
						this.error('Error in setting onoff: ', err)
					}

				});
			} catch (err) {
				this.error('Error in registering or getting capability value (on/off): ', err)
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
						this.setAvailable().catch(err => { this.error(err);});

						this.setCapabilityValue('dim', (attr_value / 254)).catch(err => { this.error(err);});
	
					} catch (err) {
						this.error('Error in currentLevel: ', err);
					}
				});
				

								
				this.registerCapabilityListener('dim', async (currentLevel) => {
					try {
						
						this.setCapabilityValue('dim', currentLevel).catch(err => { this.error(err);});

						if(currentLevel >= 1){
							this.setCapabilityValue('onoff', true).catch(err => { this.error(err);});
						}
						
						await zclNode.endpoints[1].clusters.levelControl.moveToLevelWithOnOff(
							{
								level: Math.round(currentLevel * 254),
								transitionTime: 0,
							},
							{
								waitForResponse: false,
							}
						).catch(err => { this.error(err);});

					if(this.print_log === 1)  this.log ('dim currentLevel set to:', currentLevel);
					
				} catch (err) {
						//this.setUnavailable().catch(err => { this.error(err);});
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

					if((attr_value) > 99 || (attr_value < 10)) attr_value = this.getSeting(setting_max_dim);
					this.setSettings({
						setting_max_dim: attr_value,
					}).catch(err => { this.error(err);});

		
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
					if((attr_value) > 80 || (attr_value < 1)) attr_value = this.getSeting(setting_min_dim);
					this.setSettings({
						setting_min_dim: attr_value,
					}).catch(err => { this.error(err);});

		
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

					if((attr_value) > 99 || (attr_value < 1)) attr_value = this.getSeting(setting_on_dim);

					this.setSettings({
						setting_on_dim: attr_value,
					}).catch(err => { this.error(err);});

				} catch (err) {
					this.error('Error in powerOnLevel: ', err);
				}
			});


		} catch (err) {
			this.error('Error in readAttributes powerOnLevel: ', err);
		}


	}
	
	
	async onEndDeviceAnnounce(){

		this.setAvailable().catch(err => { this.error(err);});
	}

	/********************************************************************************/
	/*
	/*      INNSTILLINGER - 
	/*      
	/*      
	**********************************************************************************/ 
  /**
   * onSettings is called when the user updates the device's settings.
   * @param {object} event the onSettings event data
   * @param {object} event.oldSettings The old settings object
   * @param {object} event.newSettings The new settings object
   * @param {string[]} event.changedKeys An array of keys changed since the previous version
   * @returns {Promise<string|void>} return a custom message that will be displayed
   */

	async onSettings(event) {
		try {
			//if(this.print_log === 1)  this.log('onSettings', event);


			/********************************************************************************/
			/*
			/*      setting_max_dim - 
			/*      
			**********************************************************************************/ 
			
			if (event.changedKeys.includes('setting_min_dim')) {
				
				if(this.print_log === 1)  this.log('setting_min_dim: ', event.newSettings.setting_min_dim);
				
				try{
					this.zclNode.endpoints[1].clusters.ballastConfiguration.writeAttributes({ minLevel: event.newSettings.setting_min_dim}).catch(err => { this.error(err);});
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
				if(this.print_log === 1)  if(this.print_log === 1)  this.log('setting_max_dim: ', event.newSettings.setting_max_dim);
				
				try{
					this.zclNode.endpoints[1].clusters.ballastConfiguration.writeAttributes({ maxLevel: event.newSettings.setting_max_dim}).catch(err => { this.error(err);});
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
				if(this.print_log === 1)  this.log('setting_on_dim: ', event.newSettings.setting_on_dim);
				
				try {
					this.zclNode.endpoints[1].clusters.ballastConfiguration.writeAttributes({ powerOnLevel: event.newSettings.setting_on_dim}).catch(err => { this.error(err);});
				} catch (err) {
					this.error('Error in writeAttributes powerOnLevel: ', err);
					throw new Error('Something went wrong');
				}
				
			};
		
		
		
		
		
		
		
		
		
		} catch (err) {
			this.error('Error  in settings', err);
			throw new Error('Something went wrong');
		}

	}

	/**
	 * onRenamed is called when the user updates the device's name.
	 * This method can be used this to synchronise the name to the device.
	 * @param {string} name The new name
	 */
	async onRenamed(name) {
		this.log('MyDevice was renamed', name);
		try {
			await this.zclNode.endpoints[1].clusters.basic.writeAttributes({ locationDesc: name}).catch(err => { this.error(err);});
		} catch (err) {
			this.error('Error in writeAttributes locationDesc: ', err);
		}
		
	}


		  

}


module.exports = mTouchDim;