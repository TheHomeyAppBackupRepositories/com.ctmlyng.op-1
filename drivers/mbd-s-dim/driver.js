'use strict';

const { Driver } = require('homey');

class MBDDriver extends Driver {

  /**
   * onInit is called when the driver is initialized.
   */
  async onInit() {
    this.log('MyDriver has been initialized');


    /*
    //ConditionCard - HEATING
    this.cardConditionRelay = this.homey.flow.getConditionCard('flow-rele_status');
    this.cardConditionRelay.registerRunListener(async (args) => {
      this.status = await args.device.flowIs_Rele() === 1;
      return this.status;
    });

    //FLOWCARD - RELE
    this.cardEnableRelay = this.homey.flow.getActionCard('flow-relay_state');
    this.cardEnableRelay.registerRunListener(async (args) => {
        await args.device.flowEnableRelay(args);
    });
    */


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

module.exports = MBDDriver;
