'use strict';

const Homey = require('homey');
const { Util, ZigBeeDevice } = require("homey-zigbeedriver");
const { zclNode, CLUSTER, debug } = require('zigbee-clusters');

const CTMFunction = require('../../lib/CTMFunc');


class luftfoler extends CTMFunction {

  /**
   * onInit is called when the device is initialized.
   */
	async onNodeInit({zclNode}) {

		this.print_log = 0;
		this.log('MyDevice has been initialized');

		this.setAvailable().catch(err => { this.error(err);});


		if(this.hasCapability('alarm_generic') === true){
			this.removeCapability('alarm_generic');
		}

		if(this.hasCapability('watchdog') === true){
			this.removeCapability('watchdog');
		}

		if(this.getSetting('setting_intervall_alarm') === true){
			this.sett_reporing_timeout(60);
		}

		if(this.isFirstInit()){


			if(this.print_log === 1)  this.log("isFirstInit: Yes");


			await this.configureAttributeReporting([
				{
					endpointId: this.getClusterEndpoint(CLUSTER.TEMPERATURE_MEASUREMENT),
					cluster: CLUSTER.TEMPERATURE_MEASUREMENT,
					attributeName: 'measuredValue',
					minInterval: 0,
					maxInterval: 900, // once per ~30 min
					minChange: 1,
				}
				
			]).catch(err => { this.error(err);});
		
			

		}


		
		/******************************************************************************* */
		/*
		/*      measure_battery
		/*
		**********************************************************************************/ 
		

		if (this.hasCapability('measure_battery')) {
			
			zclNode.endpoints[1].clusters[CLUSTER.POWER_CONFIGURATION.NAME].on('attr.batteryVoltage', (attr_value) => {
				try {
							
					if(this.print_log === 1)  this.log("measure_battery:", attr_value);

					if (this.hasCapability('heartbeat')){ 
						this.setCapabilityValue('heartbeat', false).catch(err => { this.error(err);});
						this.setCapabilityValue('heartbeat', true).catch(err => { this.error(err);});
					}
					
					this.setCapabilityValue('measure_battery', (Math.round(Util.mapValueRange(0, 32, 28, 32, attr_value) * 100/32))).catch(err => { this.error(err);});

				} catch (err) {
					this.error('Error in measure_temperature: ', err);
				}
			});

		}
		
		/******************************************************************************* */
		/*
		/*      measure_humidity
		/*
		**********************************************************************************/ 
		
		if (this.hasCapability('measure_humidity')) {
			

			zclNode.endpoints[1].clusters[CLUSTER.RELATIVE_HUMIDITY_MEASUREMENT.NAME].on('attr.measuredValue', (attr_value) => {
				try {
							
					if(this.print_log === 1)  this.log("measure_humidity:", attr_value);

					this.setCapabilityValue('measure_humidity', (attr_value / 100)).catch(err => { this.error(err);});

					if (this.hasCapability('heartbeat')){ 
						this.setCapabilityValue('heartbeat', false).catch(err => { this.error(err);});
						this.setCapabilityValue('heartbeat', true).catch(err => { this.error(err);});
					}

					

				} catch (err) {
					this.error('Error in measure_humidity: ', err);
				}
			});

		}
		

		/******************************************************************************* */
		/*
		/*      measure_temperature
		/*
		**********************************************************************************/ 
		
		if (this.hasCapability('measure_temperature')) {
						
			zclNode.endpoints[1].clusters[CLUSTER.TEMPERATURE_MEASUREMENT.NAME].on('attr.measuredValue', (attr_value) => {
				try {
							
					if(this.print_log === 1)  this.log("measure_temperature:", attr_value);

					this.setCapabilityValue('measure_temperature', (attr_value / 100)).catch(err => { this.error(err);});
					
					
					if (this.hasCapability('heartbeat')){ 
						this.setCapabilityValue('heartbeat', false).catch(err => { this.error(err);});
						this.setCapabilityValue('heartbeat', true).catch(err => { this.error(err);});
					}

			
					if(this.getSetting('setting_intervall_alarm') === true){
						this.sett_reporing_timeout(60);
					}


					// (Math.round(attr_value) / 10)

					

				} catch (err) {
					this.error('Error in measure_temperature: ', err);
				}
			});

		}
		



	}

	/********************************************************************************/
	/*
	/*      FLOWCARD - flow_when_measure_humidity
	/*      
	**********************************************************************************/ 


	async flow_when_measure_humidity(args){

		try {
			if (this.getCapabilityValue('measure_humidity') >= args.humidity){	
				return true;
			} else {
				return false;
			}
		} catch (err) {
			if(this.print_log === 1)  this.log('flow_when_measure_humidity: ', err);
			throw new Error("flow_when_measure_humidity error");
		}

	}


	/********************************************************************************/
	/*
	/*      FLOWCARD - flow_when_measure_temperature
	/*      
	**********************************************************************************/ 


	async flow_when_measure_temperature(args){
		
		
		try {
			if (this.getCapabilityValue('measure_temperature') >= args.temperature){
				return true;
			} else {
				return false;
			}
		} catch (err) {
			if(this.print_log === 1)  this.log('flow_when_measure_temperature: ', err);
			throw new Error("flow_when_measure_temperature error");
		}

	}

  /**
   * onAdded is called when the user adds the device, called just after pairing.
   */
  async onAdded() {
    this.log('MyDevice has been added');
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
		
		this.log('MyDevice settings where changed');


		/********************************************************************************/
		/*
		/*      setting_intervall_alarm - 
		/*      
		**********************************************************************************/ 

		if (event.changedKeys.includes('setting_intervall_alarm')){
			
			//this.log('setting_intervall_alarm: ', event.newSettings.setting_intervall_alarm);


			if(event.newSettings.setting_intervall_alarm === true){
				
				this.sett_reporing_timeout(60);
		
			} else {

				if(typeof this.time_id !== "undefined")
				{
					this.log("Disable reporting Timeout");
					this.homey.clearTimeout(this.time_id);
				} 
				//this.setCapabilityValue('watchdog', false).catch(err => { this.error(err);});
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

module.exports = luftfoler;
