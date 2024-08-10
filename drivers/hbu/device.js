'use strict';


const Homey = require('homey');
const { Util, ZigBeeDevice } = require("homey-zigbeedriver");
const {Cluster, CLUSTER, debug } = require('zigbee-clusters');

const CTMSpecificSceneCluster = require('../../lib/CTMSpecificSceneCluster');
const CTMSpecificSceneBoundCluster = require('../../lib/CTMSpecificSceneBoundCluster');

const CTMGroupScenesConfigCluster = require('../../lib/CTMGroupScenesConfigCluster');

const DatekDiagnosticsCluster = require('../../lib/DatekDiagnosticsCluster');

Cluster.addCluster(CTMSpecificSceneCluster);

class HBU extends ZigBeeDevice {

  /**
   * onInit is called when the device is initialized.
   */
   async onNodeInit({ zclNode }) {

    this.print_log = 0;
    
    this.log('MyDevice has been initialized');
    this.setAvailable().catch(this.error);

    /* Version  >= 1.1.5 */

	try {


		if(this.hasCapability('heartbeat') === false){
			this.addCapability('heartbeat');
		}
    
    if(this.hasCapability('measure_voltage') === true){
      this.removeCapability('measure_voltage');
    }


    if(this.hasCapability('button.refresh') === false){
      await this.addCapability('button.refresh');
      this.setCapabilityOptions('button.refresh', {
        maintenanceAction: true,
        title: { "en": "Refresh settings", "no": "Oppdatere innstillinger" },
        desc: { "en": "Send a request to the HBU for updated information", "no": "Send en forespørsel til bryteren på oppdatert informasjon. Husk og trykk på bryteren først så den er våken" }
      }).catch(err => { this.error(err);});
      //await this.removeCapability('button.refresh');
    }
	
	} catch (err) {
		this.error('Error in update Capability: ', err);
	}




    //debug(true);
    //this.enableDebug(); // only for debugging purposes
    //this.printNode(); // only for debugging purposes

    // Bind Toggle button commands
    // measure_power


    if(this.isFirstInit()){

      try {
        //this.readattribute = await zclNode.endpoints[1].clusters['GroupScenesConfig'].readAttributes('group_id');
        //if(this.print_log === 1)  this.log('readAttributes', this.readattribute );
        //if(this.print_log === 1)  this.log ('Write Group ID 1 = 0x00:');
        await zclNode.endpoints[1].clusters.GroupScenesConfig.writeAttributes({ group_id: 0 }).catch(this.error);

        if(this.print_log === 1)  this.log("configureReporting GroupScenesConfig");

        zclNode.endpoints[1].clusters['GroupScenesConfig'].configureReporting(                    
          {
            group_id: {
                  minInterval: 1,
                  maxInterval: 21600, // 6 timer
                  minChange: 0,
              }
          }

        );

      } catch (err) {
        //this.setUnavailable(this.homey.__('device_unavailable')).catch(this.error);
        this.error('Error in writeAttributes group_id: ', err);
      }


        
    }


    if (this.hasCapability('measure_battery')) {

		try {

			this.registerCapability('measure_battery', CLUSTER.POWER_CONFIGURATION, {
				get: 'batteryVoltage',
				getOpts: {
				getOnStart: false,
				},
				report: 'batteryVoltage',
				reportParser(value) {
				
					if (this.hasCapability('heartbeat')){ 
						this.setCapabilityValue('heartbeat', false).catch(this.error);
						this.setCapabilityValue('heartbeat', true).catch(this.error);
					}


          if(this.print_log === 1)  this.log("batteryVoltage: ", value);

          //return value; 
          return (Math.round(Util.mapValueRange(20, 32, 28, 32, value) * 100/32)); 
				
				},
				endpoint: this.getClusterEndpoint(CLUSTER.POWER_CONFIGURATION),
			});
		} catch (err) {
			this.error('Error in registerCapability measure_battery: ', err);
		}

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

					if (this.hasCapability('heartbeat')){ 
						this.setCapabilityValue('heartbeat', false).catch(err => { this.error(err);});
						this.setCapabilityValue('heartbeat', true).catch(err => { this.error(err);});
					}
					// (Math.round(attr_value) / 10)
          this.setStoreValue("measuredValue", (attr_value / 100));
					this.setCapabilityValue('measure_temperature', ((attr_value / 100) + this.getSetting('setting_temp_cal'))).catch(err => { this.error(err);});

				} catch (err) {
					this.error('Error in measure_temperature: ', err);
				}
			});

		}



    /******************************************************************************* */
		/*
		/*      button.1
		/*
		**********************************************************************************/ 
		
		//if (this.hasCapability('button.1')) {
      
      this.registerCapabilityListener('button.1', async (push) => {
        try {
          if(this.print_log === 1) this.log("Virtualbutton 1", push);

          this.triggerFlow({ id: "hbu_short_button_1" })
          .then(() => this.log('flow was triggered', "Virtualbutton 1 "))
          .catch(err => this.error('Error: triggering flow', "Virtualbutton 1", err));

        } catch (err) {
          this.error('Error in virtual button 1: ', err)
        }
  
      });

		//}


    /******************************************************************************* */
		/*
		/*      button.2
		/*
		**********************************************************************************/ 
		
		//if (this.hasCapability('button.2')) {
      
    this.registerCapabilityListener('button.2', async (push) => {
      try {
        if(this.print_log === 1) this.log("Virtualbutton 2", push);

        this.triggerFlow({ id: "hbu_short_button_2" })
        .then(() => this.log('flow was triggered', "Virtualbutton 2 "))
        .catch(err => this.error('Error: triggering flow', "Virtualbutton 2", err));



      } catch (err) {
        this.error('Error in virtual button 2 ', err)
      }

    });

  //}


    /******************************************************************************* */
		/*
		/*      button.3
		/*
		**********************************************************************************/ 
		
		//if (this.hasCapability('button.3')) {
      
    this.registerCapabilityListener('button.3', async (push) => {
      try {
        if(this.print_log === 1) this.log("Virtualbutton 3", push);

        this.triggerFlow({ id: "hbu_short_button_3" })
        .then(() => this.log('flow was triggered', "Virtualbutton 3 "))
        .catch(err => this.error('Error: triggering flow', "Virtualbutton 3", err));

      } catch (err) {
        this.error('Error in virtual button 3: ', err)
      }

    });

  //}




    /******************************************************************************* */
		/*
		/*      group id
		/*
		**********************************************************************************/ 

      zclNode.endpoints[1].clusters['GroupScenesConfig'].on('attr.group_id', (attr_value) => {
          try {

            if(this.print_log === 1) this.log('Push group_id', attr_value);

            if(attr_value !== 0){
              if(this.print_log === 1) this.log('Push writeAttributes', attr_value);
              this.zclNode.endpoints[1].clusters.GroupScenesConfig.writeAttributes({ group_id: 0 }).catch(this.error);
            }

            this.setSettings({
              group_id: attr_value.toString()
            }).catch(this.error);


          } catch (err) {
              this.error('Error attr.group_id: ', err);
          }
      });


    this.registerCapabilityListener('button.refresh', async () => {
			// Maintenance action button was pressed, return a promise
			try {
		
        this.readattribute = await this.zclNode.endpoints[1].clusters['GroupScenesConfig'].readAttributes('group_id').catch(this.error);
        if(this.print_log === 1)  this.log('readAttributes', this.readattribute.group_id.toString() );
        
        this.zclNode.endpoints[1].clusters.GroupScenesConfig.writeAttributes({ group_id: 0 }).catch(this.error);

        this.readDiagnostics = await this.zclNode.endpoints[1].clusters['DatekDiagnosticsCluster'].readAttributes(
          'last_reset_info',
          'last_extended_reset_info',
          'reboot_counter',
          'last_hop_lqi',
          'last_hop_rssi',
          'parent_node_id'
          ).catch(this.error);
                    
        
        this.setSettings({
          last_reset_info: this.readDiagnostics.last_reset_info.toString(),
          last_extended_reset_info: this.readDiagnostics.last_extended_reset_info.toString(),
          reboot_counter: this.readDiagnostics.reboot_counter.toString(),
          last_hop_lqi: this.readDiagnostics.last_hop_lqi.toString(),
          last_hop_rssi: this.readDiagnostics.last_hop_rssi.toString(),
          parent_node_id: this.readDiagnostics.parent_node_id.toString(),
          group_id: this.readattribute.group_id.toString()
        }).catch(this.error);
      
        if(this.print_log === 1){this.log('readDiagnostics', this.readDiagnostics);}

        

			} catch (err) {
				this.error('Error in onStartRead: ', err);
				throw new Error('Something went wrong. You need to keep the switch awake by pressing the button on the switch itself before making this request. If it doesnt work, you can try repairing again.');
			}
			
		});



    // Bind scene button commands
	try {
		zclNode.endpoints[1].bind(CLUSTER.SCENES.NAME, new CTMSpecificSceneBoundCluster({
			onShort_press: this._onShort_pressHandler.bind(this),
			onLong_press: this._onLong_pressHandler.bind(this),
		}));

	} catch (err) {
		this.error('Error in Bind scene button command: ', err);
	}

    
  }

    /**
   * Triggers the 'toggled' Flow.
   * 
   */
     _onShort_pressHandler({button}) {
      	if(this.print_log === 1)  this.log('Button Handler', button);
      if (this.hasCapability('heartbeat')){ 
        this.setCapabilityValue('heartbeat', false).catch(this.error);
        this.setCapabilityValue('heartbeat', true).catch(this.error);
      }
      
      
      	this.triggerFlow({ id: button })
    		.then(() => this.log('flow was triggered', button))
        	.catch(err => this.error('Error: triggering flow', button, err));
      
    }
    /**
     * Triggers the 'toggled' Flow.
     */
     _onLong_pressHandler({button}) {
		if(this.print_log === 1)  this.log('Button Handler', button);

		if (this.hasCapability('heartbeat')){ 
			this.setCapabilityValue('heartbeat', false).catch(this.error);
			this.setCapabilityValue('heartbeat', true).catch(this.error);
		}

     
		this.triggerFlow({ id: button })
			.then(() => this.log('flow was triggered', button))
			.catch(err => this.error('Error: triggering flow', button, err));
    }



  /**
   * onAdded is called when the user adds the device, called just after pairing.
   */
  async onAdded() {
    this.log('MyDevice has been added');
  }

  async onEndDeviceAnnounce() {

    try {
      this.log('device came online!');
      this.setAvailable().catch(this.error);

      this.readattribute = await this.zclNode.endpoints[1].clusters['GroupScenesConfig'].readAttributes('group_id').catch(this.error);
			
      if(this.print_log === 1)  this.log('readAttributes', this.readattribute.group_id.toString() );

      this.setSettings({
				group_id: this.readattribute.group_id.toString()
			}).catch(this.error);

      await this.zclNode.endpoints[1].clusters.GroupScenesConfig.writeAttributes({ group_id: 0 }).catch(this.error);

      
    } catch (err) {
        //this.setUnavailable(this.homey.__('device_unavailable')).catch(this.error);
        this.error('Error in writeAttributes group_id: ', err)
      }
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
			/*      setting_group_id - 
			/*      
			**********************************************************************************/ 
			
			if (event.changedKeys.includes('group_id')) {
				
				if(this.print_log === 1) this.log('group_id: ', event.newSettings.group_id);
				
				try{
					this.zclNode.endpoints[1].clusters.GroupScenesConfig.writeAttributes({ group_id: event.newSettings.group_id}).catch(this.error);
				} catch (err) {
					this.error('Error in writeAttributes group_id: ', err);
					throw new Error('Something went wrong');
				}
				
			};

      /********************************************************************************/
			/*
			/*      setting_temp_cal - 
			/*      
			**********************************************************************************/ 
			
			if (event.changedKeys.includes('setting_temp_cal')){
				
				if(this.print_log === 1) this.log('setting_temp_cal: ', event.newSettings.setting_temp_cal);
        this.setCapabilityValue('measure_temperature', (this.getStoreValue('measuredValue') + event.newSettings.setting_temp_cal)).catch(err => { this.error(err);});

			};

      /********************************************************************************/
			/*
			/*      setting_button_1 - 
			/*      
			**********************************************************************************/ 
			
			if (event.changedKeys.includes('setting_button_1')){
				
				if(this.print_log === 1) this.log('setting_button_1: ', event.newSettings.setting_button_1);
        
        if(event.newSettings.setting_button_1 === true){

          if(this.hasCapability('button.1') === false){
            await this.addCapability('button.1');

          }

        } else {

          if(this.hasCapability('button.1') === true){
            this.removeCapability('button.1');
          }

        }


			};


      /********************************************************************************/
			/*
			/*      setting_button_2 - 
			/*      
			**********************************************************************************/ 
			
			if (event.changedKeys.includes('setting_button_2')){
				
				if(this.print_log === 1) this.log('setting_button_2: ', event.newSettings.setting_button_2);
        
        if(event.newSettings.setting_button_2 === true){

          if(this.hasCapability('button.2') === false){
            await this.addCapability('button.2');

          }

        } else {
          
          if(this.hasCapability('button.2') === true){
            this.removeCapability('button.2');
          }

        }


			};

      /********************************************************************************/
			/*
			/*      setting_button_3 - 
			/*      
			**********************************************************************************/ 
			
			if (event.changedKeys.includes('setting_button_3')){
				
				if(this.print_log === 1) this.log('setting_button_3: ', event.newSettings.setting_button_3);
        
        if(event.newSettings.setting_button_3 === true){

          if(this.hasCapability('button.3') === false){
            await this.addCapability('button.3');

          }

        } else {
          
          if(this.hasCapability('button.3') === true){
            this.removeCapability('button.3');
          }

        }
			};


      /********************************************************************************/
			/*
			/*      setting_button_1_text - 
			/*      
			**********************************************************************************/ 
			
			if (event.changedKeys.includes('setting_button_1_text')){
				
				if(this.print_log === 1) this.log('setting_button_1_text: ', event.newSettings.setting_button_1_text);
        
        this.setCapabilityOptions('button.1', {
          title: { "en": event.newSettings.setting_button_1_text }
        }).catch(err => { this.error(err);});

  

			};

      /********************************************************************************/
			/*
			/*      setting_button_2_text - 
			/*      
			**********************************************************************************/ 
			
			if (event.changedKeys.includes('setting_button_2_text')){
				
				if(this.print_log === 1) this.log('setting_button_2_text: ', event.newSettings.setting_button_2_text);
        
        this.setCapabilityOptions('button.2', {
          title: { "en": event.newSettings.setting_button_2_text }
        }).catch(err => { this.error(err);});

			};

      /********************************************************************************/
			/*
			/*      setting_button_3_text - 
			/*      
			**********************************************************************************/ 
			
			if (event.changedKeys.includes('setting_button_3_text')){
				
				if(this.print_log === 1) this.log('setting_button_3_text: ', event.newSettings.setting_button_3_text);
        
        this.setCapabilityOptions('button.3', {
          title: { "en": event.newSettings.setting_button_3_text }
        }).catch(err => { this.error(err);});

  

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

module.exports = HBU;
