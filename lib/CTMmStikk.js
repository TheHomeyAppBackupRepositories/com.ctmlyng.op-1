
const { ZigBeeDevice } = require('homey-zigbeedriver');
const { CLUSTER } = require('zigbee-clusters');



class CTMGenericStikk extends ZigBeeDevice {

    async onNodeInit() {
       
        this.print_log = 0;
        //await this.removeCapability('cost_control').catch(this.error);
        
        if(this.isFirstInit()){
            

            this.setStoreValue('old_setting_kwh', 0).catch(this.error);

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

                        this.kwh = (value / 1000);
                        
                        if((this.getSetting('setting_kwh') > this.kwh)  && (this.getStoreValue('old_setting_kwh') === 0)){
                            this.setStoreValue('old_setting_kwh', this.getSetting('setting_kwh')).catch(this.error);  
                        }

                        if(this.getStoreValue('old_setting_kwh') !== 0){
                            this.kwh =  this.kwh + this.getStoreValue('old_setting_kwh');
                            this.log("NY KWH", this.kwh);
                        }


                        this.setSettings({
                            setting_kwh: this.kwh ,
                        }).catch(this.error);

                        return this.kwh;
     
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


		/********************************************************************************/
        /*
        /*      POWERMETER / KW TELLER
        /*      
        **********************************************************************************/ 


		if (changedKeys.includes('setting_kwh')) {

			this.log('power_meter: ', newSettings.setting_kwh);
			
            this.setStoreValue('old_setting_kwh', 0).catch(this.error);
			this.setCapabilityValue('meter_power', newSettings.setting_kwh).catch(this.error);

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


module.exports = CTMGenericStikk;