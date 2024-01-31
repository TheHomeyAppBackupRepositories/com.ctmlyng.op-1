'use strict';


const Homey = require('homey');
const { Util, ZigBeeDevice } = require("homey-zigbeedriver");
const { ZCLNode, Cluster, CLUSTER, debug } = require('zigbee-clusters');

const CTMSpecificSceneCluster = require('../../lib/CTMSpecificSceneCluster');
const CTMSpecificSceneBoundCluster = require('../../lib/CTMSpecificSceneBoundCluster');

const CTMGroupScenesConfigCluster = require('../../lib/CTMGroupScenesConfigCluster');

Cluster.addCluster(CTMSpecificSceneCluster);


class HBU extends ZigBeeDevice {



  /**
   * onInit is called when the device is initialized.
   */
   async onNodeInit({ zclNode }) {
    this.log('MyDevice has been initialized');
    this.setAvailable().catch(this.error);

    /* Version  >= 1.1.5 */

	try {
		if(this.hasCapability('button.1') === true){
			this.removeCapability('button.1');
		}
		if(this.hasCapability('button.2') === true){
			this.removeCapability('button.2');
		}
		if(this.hasCapability('button.3') === true){
			this.removeCapability('button.3');
		}

		if(this.hasCapability('heartbeat') === false){
			this.addCapability('heartbeat');
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
        //this.log('readAttributes', this.readattribute );
        //this.log ('Write Group ID 1 = 0x00:');
        await zclNode.endpoints[1].clusters.GroupScenesConfig.writeAttributes({ group_id: 0 });
      } catch (err) {
        //this.setUnavailable(this.homey.__('device_unavailable')).catch(this.error);
        this.error('Error in writeAttributes group_id: ', err)
      }
        
    }


    if (this.hasCapability('measure_battery')) {

		try {

			this.registerCapability('measure_battery', CLUSTER.POWER_CONFIGURATION, {
				get: 'batteryVoltage',
				getOpts: {
				getOnStart: true,
				},
				report: 'batteryVoltage',
				reportParser(value) {
				
					if (this.hasCapability('heartbeat')){ 
						this.setCapabilityValue('heartbeat', false).catch(this.error);
						this.setCapabilityValue('heartbeat', true).catch(this.error);
					}

            this.log("batteryVoltage: ", value);

				  	return (Math.round(Util.mapValueRange(0, 32, 28, 32, value) * 100/32)); 
				
				},
				endpoint: this.getClusterEndpoint(CLUSTER.POWER_CONFIGURATION),
			});
		} catch (err) {
			this.error('Error in registerCapability measure_battery: ', err);
		}

    }


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
      	this.log('Button Handler', button);
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
		this.log('Button Handler', button);

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

      //this.readattribute = await this.zclNode.endpoints[1].clusters['GroupScenesConfig'].readAttributes('group_id');
      //this.log('readAttributes', this.readattribute );
      //this.log ('Write Group ID 1 = 0x0:');
      //await zclNode.endpoints[1].clusters['GroupScenesConfig'].writeAttributes({ group_id: 0 });
        await this.zclNode.endpoints[1].clusters.GroupScenesConfig.writeAttributes({ group_id: 0 });
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

module.exports = HBU;
