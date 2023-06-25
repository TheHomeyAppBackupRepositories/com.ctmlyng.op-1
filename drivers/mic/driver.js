'use strict';

const { Driver } = require('homey');

class MICDriver extends Driver {

  /**
   * onInit is called when the driver is initialized.
   */
  async onInit() {
    this.log('MyDriver has been initialized');


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

module.exports = MICDriver;
