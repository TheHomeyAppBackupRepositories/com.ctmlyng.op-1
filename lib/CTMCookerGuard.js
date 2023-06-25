
const { ZigBeeDevice } = require('homey-zigbeedriver');
const { Cluster, CLUSTER } = require('zigbee-clusters');

const CTMCookerGuardCluster = require('../../lib/CTMCookerGuardCluster');

class CTMGenericCookerGuard extends ZigBeeDevice {



    async onNodeInit({zclNode}) {


		if(this.hasCapability('alarm_generic') === false){
			this.addCapability('alarm_generic');
		}
        
		if(this.hasCapability('alarm_cooking_guard_tamper') === false){
			this.addCapability('alarm_cooking_guard_tamper');
		}
          
        //await this.addCapability('heartbeat').catch(this.error);
        /******************************************************************************* */
        /*
        /*      alarm_status:
        /*
        **********************************************************************************/ 
        
        zclNode.endpoints[1].clusters['CookerGuard'].on('attr.alarm_status', (attr_value) => {
            try {
                
                if (this.hasCapability('heartbeat')){
					this.setCapabilityValue('heartbeat', false).catch(this.error);
					this.setCapabilityValue('heartbeat', true).catch(this.error);
				}

                this.setAvailable().catch(this.error);
                this.log('attr.alarm_status: ', attr_value);
                this.alarm_decode(attr_value);

            } catch (err) {
                this.error('Error in alarm_status: ', err);
            }
        });
        

        /********************************************************************************/
        /*
        /*      Cooking:
        /*
        **********************************************************************************/ 
        
        zclNode.endpoints[1].clusters['CookerGuard'].on('attr.active', (attr_value) => {
            try {

                if (this.hasCapability('heartbeat')){
					this.setCapabilityValue('heartbeat', false).catch(this.error);
					this.setCapabilityValue('heartbeat', true).catch(this.error);
				}


                this.setAvailable().catch(this.error);
                this.log('attr.active: ', attr_value);
                if(attr_value === 0){
                    this.setCapabilityValue('cooking', false);
                    
                } else if(attr_value === 1){
                    this.setCapabilityValue('cooking', true);
          
                } 

            } catch (err) {
                this.error('Error in alarm_status: ', err);
            }
        });

        /********************************************************************************/
        /*
        /*      Alarm attery:
        /*
        **********************************************************************************/ 
        
        zclNode.endpoints[1].clusters['CookerGuard'].on('attr.alarm_battery', (attr_value) => {
            try {

                if (this.hasCapability('heartbeat')){
					this.setCapabilityValue('heartbeat', false).catch(this.error);
					this.setCapabilityValue('heartbeat', true).catch(this.error);
				}


                this.setAvailable().catch(this.error);
                this.log('attr.alarm_battery: ', attr_value);
                if(attr_value === 0){
                    this.setCapabilityValue('alarm_battery', false);
                    
                } else if(attr_value === 1){
                    this.setCapabilityValue('alarm_battery', true);
          
                } 

            } catch (err) {
                this.error('Error in alarm_battery: ', err);
            }
        });
        
        /********************************************************************************/
        /*
        /*      DIPSW:
        /*
        **********************************************************************************/ 
        
        zclNode.endpoints[1].clusters['CookerGuard'].on('attr.dip_sw', (attr_value) => {
            try {
                this.update_settings(attr_value);

            } catch (err) {
                this.error('Error in attr.dip_sw: ', err);
            }
        });


        if(this.isFirstInit()){
            try{

                await zclNode.endpoints[1].clusters['CookerGuard'].configureReporting(
                    
                        {
                            alarm_status: {
                                minInterval: 0,
                                maxInterval: 21600,
                                minChange: 1,
                            },
                
                            active: {
                                minInterval: 0,
                                maxInterval: 21600,
                                minChange: 1,
                            },
                 
                            change_battery: {
                                minInterval: 0,
                                maxInterval: 21600,
                                minChange: 1,
                            },
                               
                            dip_sw: {
                                minInterval: 0,
                                maxInterval: 21600,
                                minChange: 1,
                            }
                        }


                );
                


            } catch (error) {
                this.log("Error! configureAttributeReporting", error);
                this.setUnavailable().catch(this.error);
            }

            try {
                this.readattribute = await zclNode.endpoints[1].clusters['CookerGuard'].readAttributes('alarm_status', 'active', 'change_battery', 'dip_sw');
                this.log('readattribute alarm_status: ', this.readattribute.alarm_status );
                this.log('readattribute active: ', this.readattribute.active );
                this.log('readattribute change_battery: ', this.readattribute.change_battery );
                
                this.alarm_decode(this.readattribute.alarm_status);
                this.update_settings(this.readattribute.dip_sw);

                if(this.readattribute.active === 0){
                    this.setCapabilityValue('cooking', false).catch(this.error);
                    
                } else if(this.readattribute.active === 1){
                    this.setCapabilityValue('cooking', true).catch(this.error);
                }

                if(this.readattribute.change_battery === 0){
                    this.setCapabilityValue('alarm_battery', false).catch(this.error);
                    
                } else {
                    this.setCapabilityValue('alarm_battery', true).catch(this.error);
                }

                
            } catch (err) {
                this.error('Error in readAttributes: ', err);
            }


        }
        

    
    }

    async alarm_decode(alarm){
        try {
            this.log('Alarm_Decode', alarm);
            if (this.hasCapability('heartbeat')){
                this.setCapabilityValue('heartbeat', false).catch(this.error);
                this.setCapabilityValue('heartbeat', true).catch(this.error);
            }
            
            if(alarm === 0){
                this.setCapabilityValue('alarm_cooking_guard_tamper', false).catch(this.err);
                this.setCapabilityValue('alarm_heat', false).catch(this.err);
                this.setCapabilityValue('alarm_generic', false).catch(this.err);
                this.setCapabilityValue('alarm_battery', false).catch(this.err);
                return;
            } else if(alarm === 1){
                //ALARM_TYPE_TAMPER
                this.setCapabilityValue('alarm_cooking_guard_tamper', true).catch(this.err);
                return;
            } else if(alarm === 2){
                //ALARM_TYPE_TEMPERATUR
                this.setCapabilityValue('alarm_heat', true).catch(this.err);
                return;
            } else if(alarm === 3){
                //ALARM_TYPE_TIDSUR
                this.setCapabilityValue('alarm_generic', true).catch(this.err);
                return;
            } else if(alarm === 4){
                //ALARM_TYPE_TIDSUR
                this.setCapabilityValue('alarm_generic', true).catch(this.err);
                return;
            } else if(alarm === 7){
                //ALARM_TYPE_BATTERI
                this.setCapabilityValue('alarm_battery', true).catch(this.err);
                return;
            } else {
                this.setCapabilityValue('alarm_generic', true).catch(this.err);
                return;
            }

        } catch (error) {
            this.log("Error! alarm_decode", error);
        }
    }

    async update_settings(dip_sw){
        try {

            function getBit(number, bitPosition) {
                return (number & (1 << bitPosition)) === 0 ? 0 : 1;
            }

            this.log("DIP_SW Settings:", dip_sw);

            this.dip3 = getBit(dip_sw, 0);
            this.dip4 = getBit(dip_sw, 1);
            this.dip5 = getBit(dip_sw, 2);
            this.dip6 = getBit(dip_sw, 3);
            this.dip7 = getBit(dip_sw, 4);
            this.dip8 = getBit(dip_sw, 5);
            this.dip9 = getBit(dip_sw, 6);
            this.dipA = getBit(dip_sw, 7);
            
            
            this.log("DIP 3", this.dip3)
            this.log("DIP 4", this.dip4)
            this.log("DIP 5", this.dip5)
            this.log("DIP 6", this.dip6)
            this.log("DIP 7", this.dip7)
            this.log("DIP 8", this.dip8)
            this.log("DIP 9", this.dip9)
            this.log("DIP A", this.dipA)
            
            /*
                PLACEMENT
            */
            
            if(this.dip3 === 0 && this.dip4 === 0){
                this.placement = "45-55cm Normal";
            } else if(this.dip3 === 1 && this.dip4 === 0){
                this.placement = "56-70cm Normal";
            } else if(this.dip3 === 0 && this.dip4 === 1){
                this.placement = "45-55cm Forhøyet alarmgrense";
            } else if(this.dip3 === 1 && this.dip4 === 1){
                this.placement = "56-70cm Forhøyet alarmgrense"; 
            }

            /*
                TIMER
            */
            if(this.dip5 === 1 && this.dip6 === 0 && this.dip7 === 0){
                this.timer = "15MIN (2t)";
            } 
            else if(this.dip5 === 1 && this.dip6 === 1 && this.dip7 === 0){
                this.timer = "30MIN (2t)";
            } 
            else if(this.dip5 === 1 && this.dip6 === 1 && this.dip7 === 1){
                this.timer = "45MIN (2t)";
            } 
            else if(this.dip5 === 0 && this.dip6 === 1 && this.dip7 === 1){
                this.timer = "60MIN (2t)";
            } 
            else if(this.dip5 === 0 && this.dip6 === 0 && this.dip7 === 1){
                this.timer = "90MIN (2t)";
            } 
            else if(this.dip5 === 0 && this.dip6 === 1 && this.dip7 === 0){
                this.timer = "120MIN (12t)";
            } 
            else if(this.dip5 === 1 && this.dip6 === 0 && this.dip7 === 1){
                this.timer = "360MIN (12t)";
            } 
            else if(this.dip5 === 0 && this.dip6 === 0 && this.dip7 === 0){
                this.timer = "OFF";
            } 

            /*
                ATUTOINNKOBLING
            */
            if(this.dip8 === 1){
                this.auto_reset = "ON";
            } else {
                this.auto_reset = "OFF";
            }
        
            /*
                STRØMMÅLING
            */
            if(this.dip9 === 1){
                this.current = "ON";
            } else {
                this.current = "OFF";
            }
        
            /*
                TESTMODUS
            */

            if(this.dipA === 1){
                this.testmode = "ON";
            } else {
                this.testmode = "OFF";
            }
            


            await this.setSettings({
                setting_dip_sw_34: this.placement,
                setting_dip_sw_567: this.timer,
                setting_dip_sw_8: this.auto_reset,
                setting_dip_sw_9: this.current,
                setting_dip_sw_A: this.testmode

            }).catch(this.error );


        } catch (error) {
            this.log("Error! update_settings", error);
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


module.exports = CTMGenericCookerGuard;