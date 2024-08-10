'use strict';

const { ZigBeeDevice } = require("homey-zigbeedriver");
const { CLUSTER} = require('zigbee-clusters');

const CTMFunction = require('../../lib/CTMFunc');

class waterleaksensor extends CTMFunction {

  /**
   * onInit is called when the device is initialized.
   */
	async onNodeInit({zclNode}) {


		this.print_log = 1;
		this.log('WaterLekak sensor has been initialized');
		this.setAvailable().catch(err => { this.error(err);});

		//await this.addCapability('heartbeat').catch(err => { this.error(err);});

		if(this.isFirstInit()){

			
			try {
				this.readattribute = await zclNode.endpoints[1].clusters[CLUSTER.IAS_ZONE.NAME].readAttributes('zoneState');
				if(this.print_log === 1)this.log('zoneState: ', this.readattribute.zoneState);

				if(this.readattribute.zoneState === 0){
					
					zclNode.endpoints[1].clusters.iasZone.zoneEnrollResponse({
						enrollResponseCode: 0, // Success
						zoneId: 1, // Choose a zone id
					}).catch(err => { this.error(err);});
				}
	
			} catch (err) {
				this.error('Error in readAttributes zoneState: ', err);
			}
				
		

		}
		/*
		try {
			const readattribute = await zclNode.endpoints[1].clusters[CLUSTER.IAS_ZONE.NAME].readAttributes('iasCIEAddress')
			if(this.print_log === 1)this.log('iasCIEAddress: ', readattribute.iasCIEAddress);

		} catch (err) {
			this.error('Error in readAttributes iasCIEAddress: ', err);

		try {
			const readattribute = await zclNode.endpoints[1].clusters[CLUSTER.IAS_ZONE.NAME].readAttributes('zoneState')
			if(this.print_log === 1)this.log('zoneState: ', readattribute.zoneState);

		} catch (err) {
			this.error('Error in readAttributes zoneState: ', err);
		}

		try {
			const readattribute = await zclNode.endpoints[1].clusters[CLUSTER.IAS_ZONE.NAME].readAttributes('zoneId')
			if(this.print_log === 1)this.log('zoneId: ', readattribute.zoneId);

		} catch (err) {
			this.error('Error in readAttributes zoneId: ', err);
		}
		*/
		
		if(this.hasCapability('alarm_generic') === true){
			this.removeCapability('alarm_generic');
		}

		if(this.hasCapability('watchdog') === true){
			this.removeCapability('watchdog');
		}

		if(this.getSetting('setting_intervall_alarm') === true){
			this.sett_reporing_timeout(60);
		}


		
			// Capture the zoneStatusChangeNotification
			zclNode.endpoints[1].clusters[CLUSTER.IAS_ZONE.NAME].onZoneStatusChangeNotification = ({zoneStatus}) => {
				try {
					if(this.print_log === 1)this.log('zoneStatus.alarm2:', zoneStatus.alarm2);
					if(this.print_log === 1)this.log('zoneStatus.battery:', zoneStatus.battery);

					this.setCapabilityValue('alarm_water', zoneStatus.alarm2).catch(err => { this.error(err);});
					this.setCapabilityValue('alarm_battery', zoneStatus.battery).catch(err => { this.error(err);});

					if (this.hasCapability('heartbeat')){ 
						this.setCapabilityValue('heartbeat', false).catch(err => { this.error(err);});
						this.setCapabilityValue('heartbeat', true).catch(err => { this.error(err);});
					}

					if(this.getSetting('setting_intervall_alarm') === true){
						this.sett_reporing_timeout(60);
					}

					
				} catch (err) {
					this.error('Error in onZoneStatusChangeNotification: ', err);
				}
				1
			};

		
			zclNode.endpoints[1].clusters[CLUSTER.IAS_ZONE.NAME].onZoneEnrollRequest = ({zoneType}) => {
				try {

					if(this.print_log === 1){
					
						this.log("onZoneEnrollRequest");
						this.log("args", zoneType);
					}


					zclNode.endpoints[1].clusters.iasZone.zoneEnrollResponse({
						enrollResponseCode: 0, // Success
						zoneId: 1, // Choose a zone id
					}).catch(err => { this.error(err);});


				} catch (err) {
					this.error('Error in onZoneStatusChangeNotification: ', err);
				}

			};
	
 

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

module.exports = waterleaksensor;
