'use strict';

const { Driver } = require('homey');

class mTouchOneDriver extends Driver {

  /**
   * onInit is called when the driver is initialized.
   */
  async onInit() {
    this.log('MyDriver has been initialized');


    //FLOWCARD - Kostnadskontroll deaktiver 
    this.cardDeactivateCostControl = this.homey.flow.getActionCard('flow-cost_control_deactivate');
    	this.cardDeactivateCostControl.registerRunListener(async (args) => {
      	await args.device.flowCostControlDeactivate();
    });

    //FLOWCARD - Kostnadskontroll aktivere 
    this.cardEnableCostControl = this.homey.flow.getActionCard('flow-cost_control');
    	this.cardEnableCostControl.registerRunListener(async (args) => {
      	await args.device.flowCostControlActivate(args);
    });

    //FLOWCARD - Endre Termostatmodus
    this.cardCangeThermostatmode = this.homey.flow.getActionCard('flow-ChangeThermostatmode');
    	this.cardCangeThermostatmode.registerRunListener(async (args) => {
    	this.status = await args.device.flowCangeThermostatState(args);
		  return this.status;
    });

    //FLOWCARD - Endre Regulatormodus
    this.cardChangeRegulatorMode = this.homey.flow.getActionCard('flow-ChangeRegulatorMode');
    	this.cardChangeRegulatorMode.registerRunListener(async (args) => {
    	this.status = await args.device.flowChangeRegulatorMode(args);
		  return this.status;
    });


    //this._deviceHeating = this.homey.flow.getDeviceTriggerCard("flow-heating");

    //ConditionCard - HEATING
    this.cardConditionHeating = this.homey.flow.getConditionCard('flow-is_heating');
    this.cardConditionHeating.registerRunListener(async (args) => {
    	this.status = await args.device.flowIs_Heating() === 1;
    	return this.status;
    });

    //ConditionCard - Thermostat State
    this.cardConditionMode = this.homey.flow.getConditionCard('flow-is_thermostatmode');
    this.cardConditionMode.registerRunListener(async (args) => {
    	this.status = await args.device.flowIs_Mode(args);
      	return this.status;
      
    });

    //ConditionCard - Regulatormode
    this.cardConditionRegulatorMode = this.homey.flow.getConditionCard('flow-is_regulatorMode');
    this.cardConditionRegulatorMode.registerRunListener(async (args) => {
    	this.status = await args.device.flowIs_regulatorMode(args);
      	return this.status;
      
    });

    //ConditionCard - ENERGYCONTROL
    this.cardConditionEnergy = this.homey.flow.getConditionCard('flow-is_costcontrol');
    this.cardConditionEnergy.registerRunListener(async (args) => {
    	this.status = await args.device.flowIs_Energy();
    	return this.status;
      
    });

    //ConditionCard - KEYLOCK
    this.cardConditionKeyLock = this.homey.flow.getConditionCard('flow-is_keyLock');
    this.cardConditionKeyLock.registerRunListener(async (args) => {
    	this.status = await args.device.flowIs_KeyLock();
    	return this.status;
    });

  }

	/*
	triggerHeating(device, state) {
		this._deviceTurnedOn
		.trigger(device, state)
		.then(this.log)
		.catch(this.error);
	}
	*/


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

module.exports = mTouchOneDriver;
