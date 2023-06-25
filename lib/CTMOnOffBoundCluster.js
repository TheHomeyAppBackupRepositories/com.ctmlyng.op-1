'use strict';

const { BoundCluster } = require('zigbee-clusters');

class CTMOnOffBoundCluster extends BoundCluster {

  constructor({
    onsetOn,
  }) {
    super();
    this._onsetOn = onsetOn;

  }


  async setOn() {
    if (typeof this._onsetOn === 'function') {
      this._onsetOn();
    }
  }


}

module.exports = CTMOnOffBoundCluster;