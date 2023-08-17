

const { ZigBeeDevice } = require('homey-zigbeedriver');
const { ZCLNode, CLUSTER } = require('zigbee-clusters');
const CTMspecificAstroCluster = require('../../lib/CTMSpesificAstoCluster');



//debug(true);

class mTouchAstro extends ZigBeeDevice {
  /**
   * onInit is called when the device is initialized.
   */
  async onNodeInit({ zclNode }) {
    this.log('MyDevice has been initialized');

    this.setAvailable().catch(this.error);

    await this.configureAttributeReporting([
      {
        endpointId: this.getClusterEndpoint(CLUSTER.ON_OFF),
        cluster: CLUSTER.ON_OFF,
        attributeName: 'on_time',
        minInterval: 1,
        maxInterval: 43200, // once per ~12 TIMER
        minChange: 1,
      },

      {
        endpointId: this.getClusterEndpoint(CLUSTER.ON_OFF),
        cluster: CLUSTER.ON_OFF,
        attributeName: 'device_mode',
        minInterval: 1,
        maxInterval: 43200, // once per ~12 TIMER
        minChange: 1,
      },



    ]);


    if(this.isFirstInit()){
      try {
        this.readattribute = await zclNode.endpoints[1].clusters[CLUSTER.ON_OFF.NAME].readAttributes('device_mode');
        
        this.log("this.readattribute", this.readMode(this.readattribute.device_mode));

        this.setSettings({
          setting_modus: this.readMode(this.readattribute.device_mode)
        });

      } catch (err) {
        this.error('Error in readAttributes: ', err);
      }
    }

    /******************************************************************************* */
    /*
    /*      Relestatus:
    /*
    **********************************************************************************/ 
    

    if (this.hasCapability('onoff')) {

      zclNode.endpoints[1].clusters[CLUSTER.ON_OFF.NAME].on('attr.onOff', (attr_value) => {
        try {
          this.setAvailable().catch(this.error);
          this.log('push: attr.onOff: ', attr_value);

          this.setCapabilityValue('onoff', attr_value);

        } catch (err) {
          this.error('Error in onOff: ', err);
        }
      });

      this.registerCapabilityListener('onoff', async (onOff) => {
        try {
          
          if(onOff === false){
            this.log ('set to: Off');
            await zclNode.endpoints[1].clusters[CLUSTER.ON_OFF.NAME].setOff({},{
              waitForResponse: false,
            });
          } else {
            this.log ('set to: ON');
            await zclNode.endpoints[1].clusters[CLUSTER.ON_OFF.NAME].setOn({},{
              waitForResponse: false,
            });
          }
          
          this.setCapabilityValue('onoff', onOff);

          this.log ('onoff.rele set to:', onOff);
        
        } catch (err) {
          this.error('Error in setting onoff: ', err)
        }

      });




    }
    /******************************************************************************* */
    /*
    /*      DEVEICE ENABLE:
    /*
    **********************************************************************************/ 
    

    if (this.hasCapability('onoff.enable')) {

      zclNode.endpoints[1].clusters[CLUSTER.ON_OFF.NAME].on('attr.device_enable', (attr_value) => {
        try {
          this.setAvailable().catch(this.error);
          this.log('push: attr.device_enable: ', attr_value);

          this.setCapabilityValue('onoff.enable', attr_value);

        } catch (err) {
          this.error('Error in onOff: ', err);
        }
      });

      this.registerCapabilityListener('onoff.enable', async (device_enable) => {
        try {
          
          if(device_enable === false){
            this.log ('onoff.enable set to: Off');
            await zclNode.endpoints[1].clusters[CLUSTER.ON_OFF.NAME].setOff({},{
              waitForResponse: false,
            });
          } else {
            this.log ('onoff.enable set to: ON');
            await zclNode.endpoints[1].clusters[CLUSTER.ON_OFF.NAME].setOn({},{
              waitForResponse: false,
            });
          }
          
          this.setCapabilityValue('onoff.enable', device_enable);

          this.log ('onoff.enable set to:', device_enable);
        
        } catch (err) {
          this.error('Error in setting onoff.enable: ', err)
        }

      });


    }

    /******************************************************************************* */
    /*
    /*      DEVEICE MODE:
    /*
    **********************************************************************************/ 
    

    

      zclNode.endpoints[1].clusters[CLUSTER.ON_OFF.NAME].on('attr.device_mode', (attr_value) => {
        try {
          this.setAvailable().catch(this.error);
          this.log('push: attr.device_mode: ', this.readMode(attr_value));

          this.setSettings({
            setting_modus: this.readMode(attr_value)
          });

        } catch (err) {
          this.error('Error in device_mode: ', err);
        }
      });


    /******************************************************************************* */
    /*
    /*      ON TIME:
    /*
    **********************************************************************************/ 
    

    

    zclNode.endpoints[1].clusters[CLUSTER.ON_OFF.NAME].on('attr.on_time', (attr_value) => {
      try {
        this.setAvailable().catch(this.error);
        this.log('push: attr.on_time: ', attr_value);

      } catch (err) {
        this.error('Error in on_time: ', err);
      }
    });
    


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


  readMode(mode) {

    switch(mode){
      case 0:
        return "Astrour"
      case 1:
        return "Timer"
      case 2:
        return "Dagsur"
      case 3:
        return "Ukesur"
      
    }

  }



}

module.exports = mTouchAstro;
