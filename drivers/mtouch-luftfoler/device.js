'use strict';

const Homey = require('homey');
const { Util, ZigBeeDevice } = require("homey-zigbeedriver");
const { zclNode, CLUSTER, debug } = require('zigbee-clusters');

class luftfoler extends ZigBeeDevice {

  /**
   * onInit is called when the device is initialized.
   */
	async onNodeInit({zclNode}) {
		this.log('MyDevice has been initialized');

		this.setAvailable().catch(this.error);

		/******************************************************************************* */
		/*
		/*      measure_battery
		/*
		**********************************************************************************/ 
		

		if (this.hasCapability('measure_battery')) {
			
			zclNode.endpoints[1].clusters[CLUSTER.POWER_CONFIGURATION.NAME].on('attr.batteryVoltage', (attr_value) => {
				try {
							
					this.log("measure_battery:", attr_value);

					if (this.hasCapability('heartbeat')){ 
						this.setCapabilityValue('heartbeat', false).catch(this.error);
						this.setCapabilityValue('heartbeat', true).catch(this.error);
					}
					
					this.setCapabilityValue('measure_battery', (Math.round(Util.mapValueRange(0, 32, 28, 32, attr_value) * 100/32)));

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
							
					this.log("measure_humidity:", attr_value);

					if (this.hasCapability('heartbeat')){ 
						this.setCapabilityValue('heartbeat', false).catch(this.error);
						this.setCapabilityValue('heartbeat', true).catch(this.error);
					}

					this.setCapabilityValue('measure_humidity', (attr_value / 100));

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
							
					this.log("measure_temperature:", attr_value);

					if (this.hasCapability('heartbeat')){ 
						this.setCapabilityValue('heartbeat', false).catch(this.error);
						this.setCapabilityValue('heartbeat', true).catch(this.error);
					}
					// (Math.round(attr_value) / 10)

					this.setCapabilityValue('measure_temperature', (attr_value / 100));

				} catch (err) {
					this.error('Error in measure_temperature: ', err);
				}
			});

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
  async onSettings({ oldSettings, newSettings, changedKeys }) {
    this.log('MyDevice settings where changed');
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
