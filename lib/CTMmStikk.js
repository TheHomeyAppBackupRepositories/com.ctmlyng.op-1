
const { ZigBeeDevice } = require('homey-zigbeedriver');
const { CLUSTER } = require('zigbee-clusters');



class CTMGenericStikk extends ZigBeeDevice {

    async onNodeInit() {
       

        //await this.removeCapability('cost_control').catch(this.error);
        
        try {
            await this.configureAttributeReporting([
                {
                    endpointId: this.getClusterEndpoint(CLUSTER.ELECTRICAL_MEASUREMENT),
                    cluster: CLUSTER.ELECTRICAL_MEASUREMENT,
                    attributeName: 'activePower',
                    minInterval: 1,
                    maxInterval: 1200, // once per ~10 min
                    minChange: 10,
                },
            ]);

            await this.configureAttributeReporting([
                {
                    endpointId: this.getClusterEndpoint(CLUSTER.METERING),
                    cluster: CLUSTER.METERING,
                    attributeName: 'currentSummationDelivered',
                    minInterval: 1,
                    maxInterval: 3600, // once per ~30 min
                    minChange: 10,
                },
            ]);

        } catch (err) {
            //this.setUnavailable().catch(this.error);
            this.error('Error in configureAttributeReporting: ', err);
        }

        if (this.hasCapability('onoff')) {
            try {
                this.registerCapability('onoff', CLUSTER.ON_OFF);
                this.getClusterCapabilityValue('onoff', CLUSTER.ON_OFF).catch(this.error);

            } catch (err) {
                this.error('Error in registerCapability onoff: ', err);
            }
        }

        // measure_power
        if (this.hasCapability('measure_power')) {
            
            try {
                this.registerCapability('measure_power', CLUSTER.ELECTRICAL_MEASUREMENT);
                this.getClusterCapabilityValue('measure_power', CLUSTER.ELECTRICAL_MEASUREMENT).catch(this.error);

            } catch (err) {
                //this.setUnavailable().catch(this.error);
                this.error('Error in registerCapability measure_power: ', err);
            }

        }

        // power_meter
        if (this.hasCapability('meter_power')) {
            try {
                    
                this.registerCapability('meter_power', CLUSTER.METERING, {
                    get: 'currentSummationDelivered',
                    getOpts: {
                        getOnStart: true,
                    },
                    report: 'currentSummationDelivered',
                    reportParser(value) {
                        this.setAvailable().catch(this.error);
                        if ((value < 0) || (value === 0xFFFFFFFFFFFF)) return null;
                        return (value / 1000);
                    },
                    endpoint: this.getClusterEndpoint(CLUSTER.METERING),
                });

            } catch (err) {
                this.error('Error in registerCapability meter_power: ', err);
            }

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


module.exports = CTMGenericStikk;