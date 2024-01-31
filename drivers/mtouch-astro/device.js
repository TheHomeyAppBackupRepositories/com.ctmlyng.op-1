
const Homey = require('homey');
const { ZigBeeDevice } = require('homey-zigbeedriver');
const { ZCLNode, CLUSTER, Cluster } = require('zigbee-clusters');
const CTMspecificAstroCluster = require('../../lib/CTMSpesificAstoCluster');
const CTMSpecificTimeCluster = require('../../lib/CTMSpesificTimeCluster');



class mTouchAstro extends ZigBeeDevice {
  /**
   * onInit is called when the device is initialized.
   */


  
  async onNodeInit({ zclNode }) {
    
  
    this.log('MyDevice has been initialized');

    this.setAvailable().catch(this.error);

    if(this.hasCapability('button.refresh') === false){
			await this.addCapability('button.refresh');
			this.setCapabilityOptions('button.refresh', {
				maintenanceAction: true,
        title: { "en": "Refresh settings", "no": "Oppdatere innstillinger" },
        desc: { "en": "Update date and time", "no": "Oppdatere dato og klokkelsett" }
			});
			//await this.removeCapability('button.refresh');
		}


    if (this.getClass() !== 'socket') {
      await this.setClass('socket').catch(this.error)
    }


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

        
        this.setClock();

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
          
          this.setCapabilityValue('onoff', attr_value);

          this.log('push: attr.onOff: ', attr_value);
          this.setAvailable().catch(this.error);

        } catch (err) {
          this.error('Error in onOff: ', err);
        }
      });

      this.registerCapabilityListener('onoff', async (onOff) => {
        try {

          
          this.setClock();

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

    /********************************************************************************/
		/*
		/*      button.refresh "maintenanceAction": true,
		/*     
		/*
		**********************************************************************************/ 

		this.registerCapabilityListener('button.refresh', async () => {
			// Maintenance action button was pressed, return a promise
			try {
		
				//await this.setStoreValue('regulatorsetPoint', 0).catch(this.error);
				//this.log('this', this);

				this.setClock();
			
	
			} catch (err) {
				this.error('Error in onStartRead: ', err);
				throw new Error('Something went wrong');
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


  async setClock(){
    
    this.localTime = Buffer.alloc(7);

    this.sys = await this.homey.clock.getTimezone();
    this.time = new Date(); //

    this.ar =  this.time.toLocaleDateString("sv-SE",{year: 'numeric', timeZone: this.sys})
    this.mnd =  this.time.toLocaleDateString("sv-SE",{month: 'numeric', timeZone: this.sys})
    this.dag =  this.time.toLocaleDateString("sv-SE",{day: 'numeric', timeZone: this.sys})
    this.hours =  this.time.toLocaleTimeString("sv-SE",{hour: 'numeric', timeZone: this.sys})
    this.minutt =  this.time.toLocaleTimeString("sv-SE",{minute: 'numeric', timeZone: this.sys})

    //Displaying the extracted variables on the console
    this.log("Lokalt år: ", this.ar); //log(‘Lokalt år är typ:’,typeof(ar))
    this.log("Lokal mnd:",  this.mnd); //log(‘Lokal månad är typ:’,typeof(manad));
    this.log("Lokal dag:",  this.dag);
    this.log("Lokal time:",  this.hours);
    this.log("Lokal minutt:",  this.minutt);
    //Displaying time zone of the Homey
    this.log("timeZone:",this.sys);

    
    this.localTime[0] = 20;
    this.localTime[1] = this.ar % 100;
    this.localTime[2] = this.mnd;
    this.localTime[3] = this.dag;
    this.localTime[4] = this.hours;
    this.localTime[5] = this.minutt;
    this.localTime[6] = 0;

    //this.log("Time:", this.localTime);

    try {
      this.zclNode.endpoints[1].clusters.time.setTime({
        Data: this.localTime,
      },{
        waitForResponse: false,
      }
      );
    } catch (err) {
      this.error('Error in send setTime CMD: ', err);
    }






  }




}

module.exports = mTouchAstro;
