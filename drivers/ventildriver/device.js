'use strict';

const { ZCLNode, CLUSTER } = require('zigbee-clusters');
const { ZigBeeDevice } = require('homey-zigbeedriver');


class ventildriver extends ZigBeeDevice {

  /**
   * onInit is called when the device is initialized.
   */
	async onNodeInit({ zclNode }) {  


		this.print_log = 0;
		this.log('WaterValve has been initialized');
		this.setAvailable().catch(this.error);
    
		
		if (this.hasCapability('onoff')) {



			this.registerCapabilityListener('onoff', async (onOff) => {
				try {

					if(onOff === false){
						if(this.print_log === 1)  this.log ('set to: Off');
						await zclNode.endpoints[1].clusters[CLUSTER.ON_OFF.NAME].setOff({},{
							waitForResponse: true,
						});
					} else {
						if(this.print_log === 1)  this.log ('set to: ON');
						await zclNode.endpoints[1].clusters[CLUSTER.ON_OFF.NAME].setOn({},{
							waitForResponse: true,
						});
					}					
					
					
					if(this.print_log === 1)  this.log ('onoff set to:', onOff);

					this.setCapabilityValue('onoff', onOff).catch(this.error);

				} catch (err) {
						this.error('Error in setting onoff: ', err);
				}
				

			});


			
			zclNode.endpoints[1].clusters[CLUSTER.ON_OFF.NAME].on('attr.onOff', (attr_value) => {
				try {
							
					if(this.print_log === 1)  this.log('attr.onOff: ', attr_value);

					this.setCapabilityValue('onoff', attr_value).catch(this.error);

				} catch (err) {
					this.error('Error in onoff: ', err);
				}
			});
			
		
		
		}
		

		
		zclNode.endpoints[2].clusters.iasZone.onZoneEnrollRequest = () => {
			try {
				if(this.print_log === 1)  this.log("onZoneEnrollRequest");

				zclNode.endpoints[2].clusters.iasZone.zoneEnrollResponse({
					enrollResponseCode: 0, // Success
					zoneId: 1,
				});
			} catch (err) {
				this.error('Error in onZoneEnrollRequest: ', err);
			}
		};

		
		// Capture the zoneStatusChangeNotification
		zclNode.endpoints[2].clusters[CLUSTER.IAS_ZONE.NAME]
		.onZoneStatusChangeNotification = ({zoneStatus}) => {
			
			if(this.print_log === 1)  this.log('zoneStatus.alarm2:', zoneStatus.alarm2);
			if(this.print_log === 1)  this.log('zoneStatus.battery:', zoneStatus.acMains);

			this.setCapabilityValue('alarm_water', zoneStatus.alarm2).catch(this.error);
			this.setCapabilityValue('power_mains', zoneStatus.acMains).catch(this.error);
			
		};
    


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

module.exports = ventildriver;
