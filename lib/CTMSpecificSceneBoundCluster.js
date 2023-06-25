'use strict';

const { BoundCluster } = require('zigbee-clusters');

class CTMSpecificSceneBoundCluster extends BoundCluster {

  constructor({
    onShort_press,
    onLong_press,
  }) {
    super();
    this._onShort_press = onShort_press;
    this._onLong_press =  onLong_press;

  }

  async short_press(payload) {
    if (typeof this._onShort_press === 'function') {
      this._onShort_press(payload);
    }
  }

  async long_press(payload) {
    if (typeof this._onLong_press === 'function') {
      this._onLong_press(payload);
    }
  }



}

module.exports = CTMSpecificSceneBoundCluster;