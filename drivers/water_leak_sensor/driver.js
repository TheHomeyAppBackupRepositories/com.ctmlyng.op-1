'use strict';

const { Driver } = require('homey');

class WaterLeakDriver extends Driver {

  /**
   * onInit is called when the driver is initialized.
   */
  async onInit() {
    this.log('MyDriver has been initialized');

    //this._deviceReportingTimeout = this.homey.flow.getDeviceTriggerCard("reporting_timeout2");
    //this._deviceReportingTimeoutTest = this.homey.flow.getDeviceTriggerCard("watchdog");

    this.WatchdogStartTrigger = this.homey.flow.getTriggerCard('watchdog');

    //this.log(this.homey)

    //this.log(this._deviceReportingTimeout)
  }

  /*
  triggerTimeout(device) {
      this._deviceReportingTimeout
      .trigger(device)
      .catch(err => { this.error(err);});
  }
  */

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
    try{
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
    } catch (err) {
			this.error('Error in onPairListDevices: ', err);
		}
		

  }

}

module.exports = WaterLeakDriver;
