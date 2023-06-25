'use strict';

const { ZigBeeDevice } = require("homey-zigbeedriver");
const { CLUSTER} = require('zigbee-clusters');


class waterleaksensor extends ZigBeeDevice {

  /**
   * onInit is called when the device is initialized.
   */
	async onNodeInit({zclNode}) {

    
		this.log('WaterLekak sensor has been initialized');
		this.setAvailable().catch(this.error);

		//await this.addCapability('heartbeat').catch(this.error);

		if(this.isFirstInit()){
			/*
				If the valve is not connected to the gateway, the WaterLekaksensor will not transmitsend onZoneEnrollRequest. 
		
			*/
			try {
				zclNode.endpoints[1].clusters.iasZone.zoneEnrollResponse({
					enrollResponseCode: 0, // Success
					zoneId: 2, // Choose a zone id
				});
			} catch (err) {
				this.error('Error in isFirstInit zoneEnrollResponse: ', err);
			}
		
			

		}
		/*
		try {
			const readattribute = await zclNode.endpoints[1].clusters[CLUSTER.IAS_ZONE.NAME].readAttributes('iasCIEAddress')
			this.log('iasCIEAddress: ', readattribute.iasCIEAddress);

		} catch (err) {
			this.error('Error in readAttributes iasCIEAddress: ', err);

		try {
			const readattribute = await zclNode.endpoints[1].clusters[CLUSTER.IAS_ZONE.NAME].readAttributes('zoneState')
			this.log('zoneState: ', readattribute.zoneState);

		} catch (err) {
			this.error('Error in readAttributes zoneState: ', err);
		}

		try {
			const readattribute = await zclNode.endpoints[1].clusters[CLUSTER.IAS_ZONE.NAME].readAttributes('zoneId')
			this.log('zoneId: ', readattribute.zoneId);

		} catch (err) {
			this.error('Error in readAttributes zoneId: ', err);
		}
		*/
		
		
			// Capture the zoneStatusChangeNotification
			zclNode.endpoints[1].clusters[CLUSTER.IAS_ZONE.NAME].onZoneStatusChangeNotification = ({zoneStatus}) => {
				try {
					this.log('zoneStatus.alarm2:', zoneStatus.alarm2);
					this.log('zoneStatus.battery:', zoneStatus.battery);

					this.setCapabilityValue('alarm_water', zoneStatus.alarm2).catch(this.error);
					this.setCapabilityValue('alarm_battery', zoneStatus.battery).catch(this.error);

					if (this.hasCapability('heartbeat')){ 
						this.setCapabilityValue('heartbeat', false).catch(this.error);
						this.setCapabilityValue('heartbeat', true).catch(this.error);
					}
				} catch (err) {
					this.error('Error in onZoneStatusChangeNotification: ', err);
				}
				
			};

		
			zclNode.endpoints[1].clusters[CLUSTER.IAS_ZONE.NAME].onZoneEnrollRequest = () => {
				try {
					this.log("onZoneEnrollRequest");

					zclNode.endpoints[1].clusters.iasZone.zoneEnrollResponse({
						enrollResponseCode: 0, // Success
						zoneId: 2, // Choose a zone id
					});
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

module.exports = waterleaksensor;
