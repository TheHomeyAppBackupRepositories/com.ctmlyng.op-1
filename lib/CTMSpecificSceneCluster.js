'use strict';

const { ScenesCluster, ZCLDataTypes } = require('zigbee-clusters');

class CTMSpecificSceneCluster extends ScenesCluster {

  static get COMMANDS() {
    return {
      ...super.COMMANDS,
      short_press: {
        id: 0x05,
        args: {
            id: ZCLDataTypes.uint16,
            button: ZCLDataTypes.enum8({
            hbu_short_button_1: 1,
            hbu_short_button_2: 2,
            hbu_short_button_3: 3,
          }),
        },
      },
      long_press: {
        id: 0x04,
        args: {
            id: ZCLDataTypes.uint16,
          button: ZCLDataTypes.enum8({
            hbu_long_button_1: 1,
            hbu_long_button_2: 2,
            hbu_long_button_3: 3,
          }),
        },
      },
    };
  }

}

module.exports = CTMSpecificSceneCluster;