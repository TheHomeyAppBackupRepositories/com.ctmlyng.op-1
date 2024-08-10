'use strict';

const Homey = require('homey');
const { debug } = require('zigbee-clusters');
  

// Enable zigbee-cluster logging
debug(false);



class MyApp extends Homey.App {

  /**
   * onInit is called when the app is initialized.
   */
  async onInit() {
    this.log('CTM Lyng app has been initialized');
		
    /*
		if (process.env.DEBUG === '1') {
			require('inspector').open(9229, '0.0.0.0', true);
			process.stdout.write = () => {}
		}
    */

    
    


  }



}

module.exports = MyApp;
