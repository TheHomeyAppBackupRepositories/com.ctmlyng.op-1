'use strict';

const { Driver } = require('homey');

class AirSensorDriver extends Driver {

  /**
   * onInit is called when the driver is initialized.
   */
  async onInit() {
    this.log('MyDriver has been initialized');


    this.cardConditionHumidity = this.homey.flow.getConditionCard('flow-when_measure_humidity');
    this.cardConditionHumidity.registerRunListener(async (args) => {
      //this.log("Humidity:", args.humidity);
    	this.status = await args.device.flow_when_measure_humidity(args);
      //this.log("Status:", this.status);
    	return this.status;
    });

    this.cardConditionTemperature = this.homey.flow.getConditionCard('flow-when_measure_temperature');
    this.cardConditionTemperature.registerRunListener(async (args) => {
    	this.status = await args.device.flow_when_measure_temperature(args);
    	return this.status;
    });


    this.WatchdogStartTrigger = this.homey.flow.getTriggerCard('watchdog');

  
  }

  
  
  async triggerWatchdog(tokens) {
    this.WatchdogStartTrigger
    .trigger(tokens)
    .catch(err => { this.error(err);});
  }




  /**
   * onPairListDevices is called when a user is adding a device
   * and the 'list_devices' view is called.
   * This should return an array with the data of devices that are available for pairing.
   */
  async onPairListDevices() {
    return [
      // Example device data, note that `store` is optional
      // {
      //   name: 'My Device',
      //   data: {
      //     id: 'my-device',
      //   },
      //   store: {
      //     address: '127.0.0.1',
      //   },
      // },
    ];
  }

}

module.exports = AirSensorDriver;
