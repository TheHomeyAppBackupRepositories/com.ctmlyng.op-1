'use strict';

const { Cluster, ThermostatCluster, ZCLDataTypes } = require('zigbee-clusters');

class CTMpecificThermostatCluster extends ThermostatCluster {

  static get ATTRIBUTES(){
    return {
      ...super.ATTRIBUTES,
      thermostatLoad: { id: 1025, type: ZCLDataTypes.uint16,},
      display_text: { id: 1026, type: ZCLDataTypes.string,},
      temperaturSensor: { id: 1027, type: ZCLDataTypes.enum8({
          Air: 0,
          Floor: 1,
          External: 2,
          Regulator: 3,
          MVAir: 4,
          MVExternal: 5,
          MVRegulator: 6,
        }),
      },
      regulatorModeEnable: { id: 1029, type: ZCLDataTypes.bool,},
      power_status: { id: 1030, type: ZCLDataTypes.bool,},
      mean_power: { id: 1032, type: ZCLDataTypes.uint16,},
      currentFloorTemperature: { id: 1033, type: ZCLDataTypes.int16,},
      night_switching: { id: 1041, type: ZCLDataTypes.bool,},
      frost_guard: { id: 1042, type: ZCLDataTypes.bool,},
      childLock: { id: 1043, type: ZCLDataTypes.bool,},
      maxFloorTemp: { id: 1044, type: ZCLDataTypes.uint8,},
      relayState: { id: 1045, type: ZCLDataTypes.bool,},
      regulatorsetPoint: { id: 1056, type: ZCLDataTypes.uint8,},
      regulatorMode: { id: 1057, type: ZCLDataTypes.uint8,},
      operationMode: { id: 1058, type: ZCLDataTypes.uint8,},
      maxFloorTempEnable: { id: 1059, type: ZCLDataTypes.bool,},
      weeklyTimerEnable: { id: 1060, type: ZCLDataTypes.bool,},
      frostGuardSetpont: { id: 1061, type: ZCLDataTypes.uint8,},
      externalTemperature: { id: 1062, type: ZCLDataTypes.int16,},
      externalSource: { id: 1064, type: ZCLDataTypes.int16,},
      currentAirTemperature: { id: 1065, type: ZCLDataTypes.int16,},
      floorSensorError: { id: 1067, type: ZCLDataTypes.bool,},
      externalSensorError: { id: 1068, type: ZCLDataTypes.bool,}
    };
  }

}

Cluster.addCluster(CTMpecificThermostatCluster);

module.exports = CTMpecificThermostatCluster;
