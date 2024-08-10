'use strict';

const Homey = require('homey');
const { ZigBeeDevice } = require('homey-zigbeedriver');
const { ZCLNode, CLUSTER } = require('zigbee-clusters');
const CTMSpecificThermostatCluster = require('../../lib/CTMSpecificThermostatCluster');
const CTMSpecificTimeCluster = require('../../lib/CTMSpesificTimeCluster');
const CTMFunction = require('../../lib/CTMFunc');


//debug(true);

class mTouchOne extends CTMFunction {



	/**
	 * onInit is called when the device is initialized.
	 */
	async onNodeInit({ zclNode }) {

		this.print_log = 0;

		this.setAvailable().catch(err => { this.error(err);});
		this.log('Device Name: ', this.getName());

		

		/* Version 1.1.0 > 1.1.1 */
		try{

			if(this.hasCapability('operationMode') === false){
				await this.addCapability('operationMode');
			}
			if(this.hasCapability('button.refresh') === false){
				await this.addCapability('button.refresh').catch(err => { this.error(err);});
				this.setCapabilityOptions('button.refresh', {
					maintenanceAction: true,
					title: { "en": "Refresh settings", "no": "Oppdatere innstillinger" },
					desc: { "en": "Send a request to the thermostat for updated information", "no": "Send en forespørsel til termostaten på oppdatert informasjon" }
				}).catch(err => { this.error(err);});
				//await this.removeCapability('button.refresh');
			}

			if(this.hasCapability('onoff') === false){
				this.addCapability('onoff').catch(err => { this.error(err);});
			}

			if(this.hasCapability('temperature_nattsenk') === true){
				this.removeCapability('temperature_nattsenk');
			}

			if(this.hasCapability('sensorMode') === true){
				this.removeCapability('sensorMode');
			}
			
			if(this.hasCapability('thermostatLoad') === true){
				this.removeCapability('thermostatLoad');
			}

			if(this.hasCapability('measure_temperature.nattsenk') === true){
				this.removeCapability('measure_temperature.nattsenk');
			}

			if(this.hasCapability('night_switching') === true){
				this.removeCapability('night_switching');
			}

			if(this.hasCapability('alarm_generic') === true){
				this.removeCapability('alarm_generic');			
			}

			if(this.hasCapability('watchdog') === true){
				this.removeCapability('watchdog');			
			}

				

		} catch (err) {
			this.error('Error in adding and removing Capability: ', err);
		}


		if(this.getSetting('setting_intervall_alarm') === true){
			this.sett_reporing_timeout(60);
		}

		


		if(this.isFirstInit()){

			try{
			
				await this.configureAttributeReporting([
					{
						endpointId: this.getClusterEndpoint(CLUSTER.THERMOSTAT),
						cluster: CLUSTER.THERMOSTAT,
						attributeName: 'currentAirTemperature',
						minInterval: 0,
						maxInterval: 1200, // once per ~30 min
						minChange: 1,
					},
					{
						endpointId: this.getClusterEndpoint(CLUSTER.THERMOSTAT),
						cluster: CLUSTER.THERMOSTAT,
						attributeName: 'currentFloorTemperature',
						minInterval: 0,
						maxInterval: 1200, // once per ~30 min
						minChange: 1,
					},
					{
						endpointId: this.getClusterEndpoint(CLUSTER.THERMOSTAT),
						cluster: CLUSTER.THERMOSTAT,
						attributeName: 'temperaturSensor',
						minInterval: 0,
						maxInterval: 43200, // once per ~12 timer
						minChange: 1,
					},
					{
						endpointId: this.getClusterEndpoint(CLUSTER.THERMOSTAT),
						cluster: CLUSTER.THERMOSTAT,
						attributeName: 'mean_power',
						minInterval: 0,
						maxInterval: 1800, // once per ~30 min
						minChange: 1,
					},
					{
						endpointId: this.getClusterEndpoint(CLUSTER.THERMOSTAT),
						cluster: CLUSTER.THERMOSTAT,
						attributeName: 'frost_guard',
						minInterval: 0,
						maxInterval: 43200, // once per ~30 min
						minChange: 1,
					},
					{
						endpointId: this.getClusterEndpoint(CLUSTER.THERMOSTAT),
						cluster: CLUSTER.THERMOSTAT,
						attributeName: 'childLock',
						minInterval: 0,
						maxInterval: 43200, // once per ~30 min
						minChange: 1,
					},
					{
						endpointId: this.getClusterEndpoint(CLUSTER.THERMOSTAT),
						cluster: CLUSTER.THERMOSTAT,
						attributeName: 'unoccupiedHeatingSetpoint',
						minInterval: 0,
						maxInterval: 43200, // once per ~30 min
						minChange: 1,
					},
	
					
					{
						endpointId: this.getClusterEndpoint(CLUSTER.THERMOSTAT),
						cluster: CLUSTER.THERMOSTAT,
						attributeName: 'relayState',
						minInterval: 0,
						maxInterval: 900, // once per ~30 min
						minChange: 1,
					},
					
	
	
	
				]).catch(err => { this.error(err);});
	
				/*
				await this.configureAttributeReporting([
	
					{
						endpointId: this.getClusterEndpoint(CLUSTER.THERMOSTAT),
						cluster: CLUSTER.THERMOSTAT,
						attributeName: 'weeklyTimerEnable',
						minInterval: 0,
						maxInterval: 43200, // once per ~30 min
						minChange: 1,
					},
	
	
				]);
				*/
				
	
	
	
			} catch (err) {
				this.setUnavailable(this.homey.__('device_unavailable')).catch(err => { this.error(err);});
				this.error('Error in configureAttributeReporting: ', err);
			}

			try{
				this.setStoreValue('lastMeanPower', 0);
				this.setStoreValue('sumPowerMeter', 0);
				this.setStoreValue('lastUpdate', null );
				this.setStoreValue('old_setPoint', 0);
				this.setStoreValue('store_status_costcontrol', false);
				this.setStoreValue('regulatorMode', "0");
				this.setStoreValue('thermostatLoad', 0);

			} catch (err) {
				this.error('Error in setStoreValues: ', err);
			}
			

		}



		if(this.print_log === 1)  this.log("181 await this.readAll();")
		await this.readAll();

	


		
		/******************************************************************************* */
		/*
		/*      ON OFF / operationMode
		/*
		**********************************************************************************/ 
		if (this.hasCapability('operationMode')) {

			zclNode.endpoints[1].clusters[CLUSTER.THERMOSTAT.NAME].on('attr.operationMode', (attr_value) => {
				try {

					if(this.print_log === 1)  this.log('push attr.opreationMode:', attr_value);
					this.setAvailable().catch(err => { this.error(err);});
					if(attr_value === 0 || attr_value === 1){
						this.setCapabilityValue('operationMode', "0").catch(err => { this.error(err);});
						this.setCapabilityValue('onoff', false).catch(err => { this.error(err);});
					} else {
						this.setCapabilityValue('operationMode', attr_value.toString(8)).catch(err => { this.error(err);});
						this.setCapabilityValue('onoff', true).catch(err => { this.error(err);});
					}


				} catch (err) {
					this.error('Error in operationMode: ', err);
				}
			});

			this.registerCapabilityListener('operationMode', async (operationMode) => {
				try {

					this.setAvailable().catch(err => { this.error(err);});
					if(this.print_log === 1)  this.log ('operationMode set to:', operationMode);
					if(operationMode === "0"){
						if(this.print_log === 1)  this.log ('write power_status:', operationMode);
						await zclNode.endpoints[1].clusters.thermostat.writeAttributes({ power_status: false }).catch(err => { this.error(err);});
						this.setCapabilityValue('onoff', false).catch(err => { this.error(err);});
					} else {
						await zclNode.endpoints[1].clusters.thermostat.writeAttributes({ operationMode: operationMode }).catch(err => { this.error(err);});
						this.setCapabilityValue('onoff', true).catch(err => { this.error(err);});
					}
					

				} catch (err) {
					//this.setUnavailable(this.homey.__('device_unavailable')).catch(err => { this.error(err);});
					this.error('Error in writeAttributes operationMode: ', err)
				}

			});

			this.registerCapabilityListener('onoff', async (onoff) => {
				try {
					if(this.print_log === 1)  this.log ('onoff set to:', onoff);
					this.setCapabilityValue('onoff', onoff).catch(err => { this.error(err);});
					await zclNode.endpoints[1].clusters.thermostat.writeAttributes({ power_status: onoff }).catch(err => { this.error(err);});
				} catch (err) {
					//this.setUnavailable(this.homey.__('device_unavailable')).catch(err => { this.error(err);});
					this.error('Error in writeAttributes operationMode: ', err)
				}

			});


		}


		/******************************************************************************* */
		/*
		/*      TemperaturSensor
		/*
		**********************************************************************************/ 
		zclNode.endpoints[1].clusters[CLUSTER.THERMOSTAT.NAME].on('attr.temperaturSensor', (attr_value) => {
			try {

				if(this.print_log === 1)  this.log('push attr temperaturSensor: ', attr_value);
				this.setStoreValue('sensorMode', attr_value);

				if(attr_value == 'Regulator'){
					return;	
				} 

				this.setSettings({
					setting_temperaturSensor: attr_value,
				}).catch(err => { this.error(err);});

				//this.switchTermostatFunksjon(attr_value);	

			} catch (err) {
				this.error('Error in temperaturSensor: ', err);
			}
		});

		/******************************************************************************* */
		/*
		/*      localTemperature
		/*
		**********************************************************************************/ 

		if (this.hasCapability('measure_temperature')) {

			
			zclNode.endpoints[1].clusters[CLUSTER.THERMOSTAT.NAME].on('attr.localTemperature', (attr_value) => {
				try {
					if(this.print_log === 1)  this.log('push localTemperature: ', attr_value);
					this.value = Math.round((attr_value / 100) * 10) / 10;
					if(this.print_log === 1)  this.log('localTemperature: ', this.value);
					this.setAvailable().catch(err => { this.error(err);});
		
					//if(this.print_log === 1)  this.log('sensor_mode: ', sensor_mode);
					if(this.getStoreValue('regulatorMode') != 1){
						if(this.hasCapability('measure_temperature') === true){
							this.setCapabilityValue('measure_temperature', this.value).catch(err => { this.error(err);});
						}
					}
				} catch (err) {
					this.error('Error in localTemperature: ', err);
				}
			});
		

		}

		/******************************************************************************* */
		/*
		/*      weeklyTimerEnable:
		/*
		**********************************************************************************/ 
		/*
				/* Driver.settings.compose */
				/*
				{
				"id": "setting_weeklyTimer",
				"type": "checkbox",
				"value": false,
				"label": {  "en": "Weekly timer active",
						"no": "Ukeur Aktivert"}
				},
				
				try {
					this.readattribute = await zclNode.endpoints[1].clusters[CLUSTER.THERMOSTAT.NAME].readAttributes('weeklyTimerEnable')
					if(this.print_log === 1)  this.log('weeklyTimer:', this.readattribute.weeklyTimerEnable);
					this.setStoreValue('weeklyTimer', this.readattribute.weeklyTimerEnable);
					this.setSettings({
						setting_weeklyTimer: this.readattribute.weeklyTimerEnable,
					}).catch(err => { this.error(err);});
			
				} catch (err) {
					this.error('Error in readAttributes weeklyTimerEnable: ', err);
				}
			
				zclNode.endpoints[1].clusters[CLUSTER.THERMOSTAT.NAME].on('attr.weeklyTimerEnable', (attr_value) => {
					try {
			
						if(this.print_log === 1)  this.log('weeklyTimer: ', attr_value);
						this.setSettings({
							setting_weeklyTimer: attr_value,
						}).catch(err => { this.error(err);});
			
						this.setStoreValue('weeklyTimer', attr_value);
			
					} catch (err) {
						this.error('Error in weeklyTimer: ', err);
					}
				});

		*/

		/******************************************************************************* */
		/*
		/*      REGULATOREFFEKT
		/*
		**********************************************************************************/ 
		//if (this.hasCapability('dim.regulator')) {


		zclNode.endpoints[1].clusters[CLUSTER.THERMOSTAT.NAME].on('attr.regulatorsetPoint', (attr_value) => {
			try {

				this.setAvailable().catch(err => { this.error(err);});
			
				if(this.print_log === 1)  this.log('2 push regulatorsetPoint: ', attr_value);
				this.setStoreValue('regulatorsetPoint', attr_value).catch(err => { this.error(err);});

				if(this.getStoreValue('regulatorMode') == 1){
					if(this.hasCapability('dim.regulator') === true){
						this.setCapabilityValue('dim.regulator', (attr_value)).catch(err => { this.error(err);});
					}
			
				} else {
					if (this.hasCapability('target_temperature') === true) {
						this.setCapabilityValue('target_temperature', attr_value).catch(err => { this.error(err);});
					}
				}		

			} catch (err) {
				this.error('Error in regulatorsetPoint: ', err);
			}
		});


		this.registerCapabilityListener('dim.regulator', async (regulatorsetPoint) => {
			try {

				if(this.print_log === 1)  this.log('dim.regulator', regulatorsetPoint);

				if(regulatorsetPoint >= 1){
					await zclNode.endpoints[1].clusters.thermostat.writeAttributes({ power_status: true, regulatorsetPoint: regulatorsetPoint}).catch(err => { this.error(err);});
					this.setCapabilityValue('onoff', true).catch(err => { this.error(err);});
					
				}  else {
					await zclNode.endpoints[1].clusters.thermostat.writeAttributes({ power_status: false, regulatorsetPoint: regulatorsetPoint}).catch(err => { this.error(err);});
					this.setCapabilityValue('onoff', false).catch(err => { this.error(err);});
				}
				if(this.print_log === 1)  this.log ('dim.regulator regulatorsetPoint set to:', regulatorsetPoint)
			
			} catch (err) {
				this.error('Error in setting regulatorsetPoint: ', err)
			}

		});



			
		//}
		/******************************************************************************* */
		/*
		/*      Lufttemperatur:
		/*
		**********************************************************************************/ 

		if (this.hasCapability('measure_temperature.air')) {

			zclNode.endpoints[1].clusters[CLUSTER.THERMOSTAT.NAME].on('attr.currentAirTemperature', (attr_value) => {
				try {
					this.value = Math.round((attr_value / 100) * 10) / 10;
					if(this.print_log === 1)  this.log('currentAirTemperature: ', this.value);
					
					//if(this.print_log === 1)  this.log('sensor_mode: ', sensor_mode);
					this.setCapabilityValue('measure_temperature.air', this.value).catch(err => { this.error(err);});
					this.setAvailable().catch(err => { this.error(err);});

					if(this.getSetting('setting_intervall_alarm') === true){
						this.sett_reporing_timeout(60);
					}


				} catch (err) {
					this.error('Error in currentAirTemperature: ', err);
				}
			});


		}


		/******************************************************************************* */
		/*
		/*      floorSensorError:
		/*
		**********************************************************************************/ 

			
		zclNode.endpoints[1].clusters[CLUSTER.THERMOSTAT.NAME].on('attr.floorSensorError', (attr_value) => {
			try {

				if(this.print_log === 1)  this.log('floorSensorError: ', attr_value);

				if(attr_value === true){
					this.setCapabilityValue('measure_temperature.floor', -99).catch(err => { this.error(err);});
					this.floorSensorError_status = "Error";

					this.setWarning(this.homey.__('FloorSensorError')).catch(err => { this.error(err);});

				} else {
						this.floorSensorError_status = "OK";
						this.unsetWarning().catch(err => { this.error(err);});
				}

				this.setSettings({
					setting_floorSensorError: this.floorSensorError_status
				}).catch(err => { this.error(err);});

				
			} catch (err) {
				this.error('Error in floorSensorError: ', err);
			}
		});
			
		zclNode.endpoints[1].clusters[CLUSTER.THERMOSTAT.NAME].on('attr.externalSensorError', (attr_value) => {
			try {

				if(this.print_log === 1)  this.log('externalSensorError: ', attr_value);

				if(attr_value === true){
					//this.setCapabilityValue('measure_temperature.floor', -99).catch(err => { this.error(err);});
					this.externalSensorError_status = "Error";


					this.setWarning(this.homey.__('ExternalSensorError')).catch(err => { this.error(err);});

				} else {
					this.externalSensorError_status = "OK";
					this.unsetWarning().catch(err => { this.error(err);});
				}
				
				this.setSettings({
					setting_externalSensorError: this.externalSensorError_status
				}).catch(err => { this.error(err);});

			} catch (err) {
				this.error('Error in externalSensorError: ', err);
			}
		});


		

		/******************************************************************************* */
		/*
		/*      Gulvtemperatur:
		/*
		**********************************************************************************/ 

		if (this.hasCapability('measure_temperature.floor')) {
			
			zclNode.endpoints[1].clusters[CLUSTER.THERMOSTAT.NAME].on('attr.currentFloorTemperature', (attr_value) => {
				try {
					this.setAvailable().catch(err => { this.error(err);});
					this.value = Math.round((attr_value / 100) * 10) / 10;
					if(this.print_log === 1)  this.log('currentFloorTemperature: ', this.value);
					this.setCapabilityValue('measure_temperature.floor', this.value).catch(err => { this.error(err);});

				} catch (err) {
					this.error('Error in currentFloorTemperature: ', err);
				}
			});
			
		}


		/******************************************************************************* */
		/*
		/*      target_temperature
		/*
		**********************************************************************************/ 
		/*

		zclNode.endpoints[1].clusters[CLUSTER.THERMOSTAT.NAME].on('attr.occupiedHeatingSetpoint', (attr_value) => {
			try {
				this.value = Math.round((attr_value / 100) * 10) / 10;
				if(this.print_log === 1)  this.log('occupiedHeatingSetpoint: ', this.value);					

			} catch (err) {
				this.error('Error in occupiedHeatingSetpoint: ', err);
			}
		});
		*/
		
			

		this.registerCapabilityListener('target_temperature', async (regulatorsetPoint) => {
			try {

				if(this.print_log === 1)  this.log("target_temperature set to", regulatorsetPoint);
				this.setAvailable().catch(err => { this.error(err);});
				await zclNode.endpoints[1].clusters.thermostat.writeAttributes({ operationMode: 3, regulatorsetPoint: regulatorsetPoint}).catch(err => { this.error(err);});
				if(this.print_log === 1)  this.log ('Change operationMode to ON');
				this.setCapabilityValue('operationMode', "3").catch(err => { this.error(err);});
	
			} catch (err) {
				//this.setUnavailable(this.homey.__('device_unavailable')).catch(err => { this.error(err);});
				this.error('Error in writeAttributes regulatorsetPoint: ', err)
			}

		});


		/****************************************note*************************************** */
		/*
		/*      Setpunkt Nattsenk/Spare / unoccupiedHeatingSetpoint:
		/*
		**********************************************************************************/ 

		zclNode.endpoints[1].clusters[CLUSTER.THERMOSTAT.NAME].on('attr.unoccupiedHeatingSetpoint', (attr_value) => {
			try {
				this.value = Math.round((attr_value / 100) * 10) / 10;
				if(this.print_log === 1)  this.log('unoccupiedHeatingSetpoint: ', this.value);
				
				this.setSettings({
					setting_night_switching_temp: this.value,
				}).catch(err => { this.error(err);});

			} catch (err) {
				this.error('Error in unoccupiedHeatingSetpoint: ', err);
			}
		});



		/******************************************************************************* */
		/*
		/*      Relestatus:
		/*
		**********************************************************************************/ 


		if (this.hasCapability('heat')) {

			zclNode.endpoints[1].clusters[CLUSTER.THERMOSTAT.NAME].on('attr.relayState', (attr_value) => {
				try {
					this.setAvailable().catch(err => { this.error(err);});
					
					if(this.print_log === 1)  this.log('Push relayState: ', attr_value);
					this.setCapabilityValue('heat', attr_value).catch(err => { this.error(err);});

					this.update_consumption(attr_value);

					this.driver.triggerHeating(this);

				
				} catch (err) {
					this.error('Error in relayState: ', err);
				}
			});
		
		}

		/******************************************************************************* */
		/*
		/*      RegulatorMode:
		/*
		**********************************************************************************/ 



		zclNode.endpoints[1].clusters[CLUSTER.THERMOSTAT.NAME].on('attr.regulatorMode', (attr_value) => {
			try {
				if(this.print_log === 1)  this.log('push regulatorMode: ', attr_value);
				this.switchTermostatFunksjon(attr_value);

			} catch (err) {
				this.error('Error in regulatorMode: ', err);
			}
		});

	




		/******************************************************************************* */
		/*
		/*      Strømmåling. Beregnet effekt ut i fra thermostatLoad
		/*
		**********************************************************************************/ 

		if (this.hasCapability('measure_power')) {

			zclNode.endpoints[1].clusters[CLUSTER.THERMOSTAT.NAME].on('attr.mean_power', (mean_power) => {
				try {

					if(this.print_log === 1)  this.log('push measure_power: ', mean_power);

					if(this.getSetting('setting_use_average') === true){
						return;
					}
					
					this.update_consumption(mean_power);
					

				} catch (err) {
					this.error('Error in mean_power: ', err);
				}
			});




		}


		/******************************************************************************* */
		/*
		/*      Frostsirking:
		/*
		**********************************************************************************/ 

		if (this.hasCapability('frost_guard')) {

			zclNode.endpoints[1].clusters[CLUSTER.THERMOSTAT.NAME].on('attr.frost_guard', (attr_value) => {
				try {

					if(this.print_log === 1)  this.log('frost_guard: ', attr_value);

					this.setSettings({
						setting_frost_guard: attr_value,
					}).catch(err => { this.error(err);});

					this.setCapabilityValue('frost_guard', attr_value).catch(err => { this.error(err);});

				} catch (err) {
					this.error('Error in frost_guard: ', err);
				}
			});

		}

		/******************************************************************************* */
		/*
		/*      Barnesikring / Tastelås:
		/*
		**********************************************************************************/ 


			if (this.hasCapability('keyLock')) {
						
				zclNode.endpoints[1].clusters[CLUSTER.THERMOSTAT.NAME].on('attr.childLock', (attr_value) => {
					try {

						if(this.print_log === 1)  this.log('keyLock: ', attr_value);

						this.setSettings({
							setting_keyLock: attr_value,
						}).catch(err => { this.error(err);});

						this.setCapabilityValue('keyLock', attr_value).catch(err => { this.error(err);});

						this.driver.triggerKeyLock(this);

					} catch (err) {
						this.error('Error in keyLock: ', err);
					}
				});

				
			}

			zclNode.endpoints[1].clusters[CLUSTER.THERMOSTAT.NAME].on('attr.thermostatLoad', (attr_value) => {
				try {

					if(this.print_log === 1)  this.log('push attr thermostatLoad: ', attr_value);

					this.setSettings({
						setting_floor_watt: attr_value,
					}).catch(err => { this.error(err);});

					this.setStoreValue('thermostatLoad', attr_value).catch(err => { this.error(err);});

				} catch (err) {
					this.error('Error in thermostatLoad: ', err);
				}
			});

			
		//}


		/********************************************************************************/
		/*
		/*      Kostnadskontroll / Lokalt.
		/*      NB: Ligger lokalt i Homey og ikke i Termostat 
		/*
		**********************************************************************************/ 


		if (this.hasCapability('cost_control')) {
			try {
				this.addCapability('cost_control');				
				this.setCapabilityValue('cost_control', this.getStoreValue('store_status_costcontrol')).catch(err => { this.error(err);});
						
			} catch (err) {
				this.error('Error in cost_control: ', err)
			}
		}

		/********************************************************************************/
		/*
		/*      button.refresh "maintenanceAction": true,
		/*     
		/*
		**********************************************************************************/ 

		this.registerCapabilityListener('button.refresh', async () => {
			// Maintenance action button was pressed, return a promise
			try {
		
				//await this.setStoreValue('regulatorsetPoint', 0).catch(err => { this.error(err);});
				//if(this.print_log === 1)  this.log('this', this);

				this.setClock();
				
				return await this.readAll();	
	
			} catch (err) {
				this.error('Error in onStartRead: ', err);
				throw new Error('Something went wrong');
			}
			
		});


		// Read all Capability
		if(this.print_log === 1)  this.log("795 await this.refreshSettings();")
		await this.refreshSettings();
		
		
	} // async	onNodeInit({ zclNode }) {


	/********************************************************************************/
	/*
	/*      FLOWCARD - Sette termostaten i ON, Nattsenk eller AV/Frostsikring
	/*      
	**********************************************************************************/ 
	
	async flowCangeThermostatState(args){
		try {

			if(this.print_log === 1)  this.log ('operationMode set to:', args.flow_tilstand);
			if(args.flow_tilstand === "0"){
				if(this.print_log === 1)  this.log ('write power_status:', args.flow_tilstand);
				await this.zclNode.endpoints[1].clusters.thermostat.writeAttributes({ power_status: false }).catch(err => { this.error(err);});
			} else {
				await this.zclNode.endpoints[1].clusters.thermostat.writeAttributes({ operationMode: args.flow_tilstand }).catch(err => { this.error(err);});
			}
			return true;

		} catch (err) {
			if(this.print_log === 1)  this.log('flowCangeThermostatState: ', err);
			throw new Error(this.homey.__('flow_CangeThermostatStateError'));
		}
	}

	/********************************************************************************/
	/*
	/*      FLOWCARD - Sette termostaten Termostat, Regulator eller Zzzilent
	/*      
	**********************************************************************************/ 
	
	
	async flowChangeRegulatorMode(args){
		try {

			/*
				Må følge med om det sendes push med rikti sensor slik at GUI blir riktig.
			*/
			
			
			if(this.print_log === 1)  this.log ('regulatorMode set to:', args.flow_mode);
			
			if(args.flow_mode == 1){
				
				if(args.setpoint < 1 || args.setpoint > 99){
					throw new Error(this.homey.__('flow_flowRegulatorErrorNumer'));
				}
			} else {
				
				if(args.setpoint < 5 || args.setpoint > 40){
					throw new Error(this.homey.__('flow_flowRegulatorErrorNumer'));
				} 

				
			}
			
			await this.zclNode.endpoints[1].clusters.thermostat.writeAttributes({ regulatorMode: args.flow_mode, regulatorsetPoint: Math.round(args.setpoint) }).catch(err => { this.error(err);});
			//this.switchTermostatFunksjon(args.flow_mode, 0);

			return true;

		} catch (err) {
			if(this.print_log === 1)  this.log('flowCangeThermostatMode: ', err);
			throw new Error('Error! Unable to change thermostat mode');
		}
	}
	



	/********************************************************************************/
	/*
	/*      FLOWCARD - Kostnadskontroll aktivere
	/*      Ved aktiv så senker eller øker vi setpunktet. Ved deaktivering setter vi 
	/*      setpunktet tilbake igjen. Må forbedres med tanke på strømbrudd, manuell justering av bruker eller manglende radiokommunikasjon
	/*      
	**********************************************************************************/ 

	async flowCostControlActivate(args){
	
		this.temperature = args.temperature;
		this.setpoint = this.getCapabilityValue('target_temperature');
		this.status_costcontrol = this.getStoreValue('store_status_costcontrol');
		this.oldSetPont = this.getStoreValue('old_setPoint');
		this.sensorMode = this.getStoreValue('sensorMode');

		this.new_setpoint = this.setpoint;
		
		if(this.print_log === 1)  this.log('Old Costcontrol:', this.status_costcontrol);

		
		if((this.sensorMode === 'Regulator') || (this.sensorMode === 'MVRegulator')){
		
			this.setCapabilityValue('cost_control', false).catch(err => { this.error(err);});
			if(this.print_log === 1)  this.log('Error! CostControl not supported in regulatormode', this.sensorMode);
			
			throw new Error(this.homey.__('flow_CostControlErrorMode'));

		}

		if(this.getCapabilityValue('operationMode') != "3"){
			this.setCapabilityValue('cost_control', false).catch(err => { this.error(err);});
			if(this.print_log === 1)  this.log('Error! CostControl only supportet in operation mode ON');
			
			throw new Error(this.homey.__('flow_CostControlErrorState'));
		}


		if(this.status_costcontrol === false){
			
			//Enable cost control
			this.new_setpoint = (this.setpoint + this.temperature);
			this.setStoreValue('old_setPoint', this.setpoint).catch(err => { this.error(err);});
															
		} else if ((this.oldSetPont + this.temperature) != this.new_setpoint){
			// Kostnadskontroll aktiv, men vi økter justeringen
			this.new_setpoint = (this.oldSetPont + this.temperature);
			
		} else {
			if(this.print_log === 1)  this.log('Costcontrol nothting to do:', this.new_setpoint)
			return false;

		}

		if(this.print_log === 1)  this.log('oldSetPont:', (this.oldSetPont));
		if(this.print_log === 1)  this.log('(setpoint + temperature):', (this.setpoint + this.temperature));
		if(this.print_log === 1)  this.log('Cost control sepoint just:', this.temperature);
		if(this.print_log === 1)  this.log('Old setpoint:', this.oldSetPont);
		if(this.print_log === 1)  this.log('New setpoint:', this.new_setpoint);
		

		
		if((this.new_setpoint < 5) || (this.new_setpoint > 40)){
			if(this.print_log === 1)  this.log('New occupiedHeatingSetpoint out of range:', this.new_setpoint)

			this.setCapabilityValue('cost_control', false).catch(err => { this.error(err);});
			this.setStoreValue('store_status_costcontrol', false).catch( this.error )
			throw new Error(this.homey.__('flow_CostControlNumerError'), this.new_setpoint);
			
		} 

		try {
			await this.zclNode.endpoints[1].clusters.thermostat.writeAttributes({ operationMode: 3 ,occupiedHeatingSetpoint: this.new_setpoint * 100}).catch(err => { this.error(err);});
			//await this.zclNode.endpoints[1].clusters.thermostat.writeAttributes({ operationMode: 3, regulatorsetPoint: this.new_setpoint});

			if(this.status_costcontrol != true){
				this.setStoreValue('store_status_costcontrol', true).catch(err => { this.error(err);});
			}

			this.setCapabilityValue('cost_control', true).catch(err => { this.error(err);});
			this.setCapabilityValue('target_temperature', this.new_setpoint).catch(err => { this.error(err);});

			if(this.print_log === 1)  this.log('occupiedHeatingSetpoint attribute set to:', this.new_setpoint)

			return;
			
		
		} catch (err) {
			if(this.print_log === 1)  this.log('cardEnableCostCongroll: ', err)
			throw new Error(this.homey.__('flow_CostControlEnableFailed'));
		}
	}

	/********************************************************************************/
	/*
	/*      FLOWCARD - Kostnadskontroll deaktiver 
	/*      Ved aktiv så senker eller øker vi setpunktet. Ved deaktivering setter vi 
	/*      setpunktet tilbake igjen. Må forbedres med tanke på strømbrudd, manuell justering av bruker eller manglende radiokommunikasjon
	/*      
	**********************************************************************************/ 

	async flowCostControlDeactivate(){
		
		this.status_costcontrol = this.getStoreValue('store_status_costcontrol');
		this.oldSetPont = this.getStoreValue('old_setPoint');
		this.setpoint = this.getCapabilityValue('target_temperature');
		this.sensorMode = this.getStoreValue('sensorMode');

		if(this.print_log === 1)  this.log('Old setpoint:', this.setpoint);
		if(this.print_log === 1)  this.log('New setpoint:', this.oldSetPont);

		if((this.sensorMode === 'Regulator') || (this.sensorMode === 'MVRegulator')){
		
			this.setCapabilityValue('cost_control', false).catch(err => { this.error(err);});
			if(this.print_log === 1)  this.log('Error! Cost Control not supported in regulatormode', this.sensorMode);
			throw new Error(this.homey.__('flow_CostControlErrorMode'));

		}

		if(this.getCapabilityValue('operationMode') != "3"){
			this.setCapabilityValue('cost_control', false).catch(err => { this.error(err);});
			if(this.print_log === 1)  this.log('Error! CostControl only supportet in operation state ON');
			throw new Error(this.homey.__('flow_CostControlErrorState'));
		}


		if(this.status_costcontrol == true){
			
			if (this.oldSetPont < 5 || this.oldSetPont > 40){
				if(this.print_log === 1)  this.log('Error! Setpoint  attribute set to:', this.oldSetPont);
				throw new Error(this.homey.__('flow_CostControlNumerError'), this.oldSetPont);
			}
			//Disable cost control
			try {
				await this.zclNode.endpoints[1].clusters.thermostat.writeAttributes({ occupiedHeatingSetpoint: this.oldSetPont * 100}).catch(err => { this.error(err);});
				if(this.print_log === 1)  this.log('occupiedHeatingSetpoint attribute set to:', this.oldSetPont);

				this.setCapabilityValue('cost_control', false).catch(err => { this.error(err);});
				this.setStoreValue('store_status_costcontrol', false).catch(err => { this.error(err);});
				this.setCapabilityValue('target_temperature', this.oldSetPont).catch(err => { this.error(err);});

			} catch (err) {
				if(this.print_log === 1)  this.log('cardEnableCostControl: ', err)
				throw new Error(this.homey.__('flow_CostControlDisableFailed'));
			}
			
		} else {
			if(this.print_log === 1)  this.log('cardDeactivateCostControl nothting to do:', this.status_costcontrol)
			return;

		}


	}



	/********************************************************************************/
	/*
	/*      FLOWCARD - flowIs_Heating
	/*      
	**********************************************************************************/ 


	async flowIs_Heating(){
		try {
			if (this.getCapabilityValue('heat') === true){
				return true;
			} else{
				return false;
			}
		} catch (err) {
			if(this.print_log === 1)  this.log('flowIs_Heating: ', err);
			throw new Error(this.homey.__('flow_isHeatingError'));
		}

	}

	/********************************************************************************/
	/*
	/*      FLOWCARD - flowIs_Mode
	/*      
	**********************************************************************************/ 


	async flowIs_Mode(args){
			if(this.print_log === 1)  this.log("args", args.flow_relay_thermostatmode);
			if(this.print_log === 1)  this.log("flowIs_Mode", this.getCapabilityValue('operationMode'));

			if(args.flow_relay_thermostatmode === this.getCapabilityValue('operationMode')) return true; else return false;

	}

	/********************************************************************************/
	/*
	/*      FLOWCARD - flowIs_regulatorMode
	/*      
	**********************************************************************************/ 


	async flowIs_regulatorMode(args){
			if(this.print_log === 1)  this.log("args", args.flow_regulatorMode);
			if(this.print_log === 1)  this.log("Flow regulatorMode", this.getStoreValue('regulatorMode'));
			if(args.flow_regulatorMode === this.getStoreValue('regulatorMode')) return true; else return false;

	}

/********************************************************************************/
/*
/*      FLOWCARD - flowIs_Energy
/*      
**********************************************************************************/ 


async flowIs_Energy(){

		if(this.getCapabilityValue('cost_control') === true) return true; else return false;

}

/********************************************************************************/
/*
/*      FLOWCARD - flowIs_KeyLock
/*      
**********************************************************************************/ 


async flowIs_KeyLock(){

		if(this.getCapabilityValue('keyLock') === true) return true; else return false;

}


	/**
	 * onAdded is called when the user adds the device, called just after pairing.
	 */
	async onAdded() {
		this.log('MyDevice has been added');
	}


/********************************************************************************/
/*
/*      INNSTILLINGER - 
/*      
/*      
**********************************************************************************/ 
  /**
   * onSettings is called when the user updates the device's settings.
   * @param {object} event the onSettings event data
   * @param {object} event.oldSettings The old settings object
   * @param {object} event.newSettings The new settings object
   * @param {string[]} event.changedKeys An array of keys changed since the previous version
   * @returns {Promise<string|void>} return a custom message that will be displayed
   */

  async onSettings(event) {
    try {
      //this.log('onSettings', event);
 
		

        /********************************************************************************/
        /*
        /*      Sensorvalg - 
        /*      
        **********************************************************************************/ 
        
		if (event.changedKeys.includes('setting_temperaturSensor')) {
			this.log('setting_temperaturSensor: ', event.newSettings.setting_temperaturSensor);
			this.zclNode.endpoints[1].clusters.thermostat.writeAttributes({ temperaturSensor: event.newSettings.setting_temperaturSensor, regulatorsetPoint: 20}).catch(err => { this.error(err);});


		//this.switchTermostatFunksjon(event.newSettings.setting_temperaturSensor);

		};
		
        /********************************************************************************/
        /*
        /*      Reguleringsvalg - 
        /*      
        **********************************************************************************/ 
        
		if (event.changedKeys.includes('setting_regulatorfuksjon')) {
			this.log('setting_regulatorfuksjon: ', event.newSettings.setting_regulatorfuksjon);
			this.zclNode.endpoints[1].clusters.thermostat.writeAttributes({ regulatorMode: event.newSettings.setting_regulatorfuksjon, regulatorsetPoint: 20 }).catch(err => { this.error(err);});

		};

		  


        /********************************************************************************/
        /*
        /*      Effekt Varmekabel - 
        /*      
        **********************************************************************************/ 
		if (event.changedKeys.includes('setting_floor_watt')) {


			this.log('setting_floor_watt: ', event.newSettings.setting_floor_watt);
			
			this.zclNode.endpoints[1].clusters.thermostat.writeAttributes({ thermostatLoad: event.newSettings.setting_floor_watt}).catch(err => { this.error(err);});

		};


		/********************************************************************************/
        /*
        /*      Effekt BEREGNING - 
        /*      
        **********************************************************************************/ 
		if (event.changedKeys.includes('setting_use_average')) {


			if(this.print_log === 1)  this.log('setting_use_average: ', event.newSettings.setting_use_average);

			if(event.newSettings.setting_use_average === true){

				/*
				try {
					this.readattribute = await this.zclNode.endpoints[1].clusters[CLUSTER.BASIC.NAME].readAttributes(
						'appVersion',
						'swBuildId',
						'hwVersion');
					
					if(this.print_log === 1)this.log('SW:', this.readattribute);

					this.setSettings({
						setting_version: 'Thermostat: ' + this.readattribute_sw.appVersion + ' RF: ' + this.readattribute_sw.swBuildId,
					}).catch(err => { this.error(err);});

				} catch (err) {
					this.error('Error readAttributes BASIC: ', err)
				}
				*/


				this.setStoreValue('lastUpdate', Date.now()).catch(err => { this.error(err);});
			
				this.setCapabilityOptions('measure_power', {
					title: { "en": "Power", "no": "Effekt" }
				}).catch(err => { this.error(err);});

			} else {
				this.setCapabilityOptions('measure_power', {
					title: { "en": "Mean Power", "no": "Snitt effekt" }
				}).catch(err => { this.error(err);});
			}
			

		};




		
        
        /********************************************************************************/
        /*
        /*      Frostsikring Aktivert - 
        /*      
        **********************************************************************************/ 

		if (event.changedKeys.includes('setting_frost_guard')) {
			if(this.print_log === 1)  this.log('setting_frost_guard: ', event.newSettings.setting_frost_guard);

			this.zclNode.endpoints[1].clusters.thermostat.writeAttributes({ frost_guard: event.newSettings.setting_frost_guard}).catch(err => { this.error(err);});


		};


		/*
		/********************************************************************************/
        /*
        /*      weeklyTimerEnable Spare Aktivert 
        /*      
        **********************************************************************************/ 
		/*
		if (event.changedKeys.includes('setting_weeklyTimer')) {
			if(this.print_log === 1)  this.log('setting_weeklyTimer: ', event.newSettings.setting_weeklyTimer);

			this.zclNode.endpoints[1].clusters.thermostat.writeAttributes({ weeklyTimerEnable: event.newSettings.setting_weeklyTimer}).catch(err => { this.error(err);});


		};
		*/
		


        /********************************************************************************/
        /*
        /*      Barnesikring/Tastelås aktivert
        /*      
        **********************************************************************************/ 


		if (event.changedKeys.includes('setting_keyLock')) {
			if(this.print_log === 1)  this.log('setting_keyLock: ', event.newSettings.setting_keyLock);

			this.zclNode.endpoints[1].clusters.thermostat.writeAttributes({ childLock: event.newSettings.setting_keyLock}).catch(err => { this.error(err);});
	

			
		};
     
		/********************************************************************************/
        /*
        /*      POWERMETER / KW TELLER
        /*      
        **********************************************************************************/ 


		if (event.changedKeys.includes('setting_power_meter')) {

			if(this.print_log === 1)  this.log('power_meter: ', event.newSettings.setting_power_meter);
			
			this.setCapabilityValue('meter_power', event.newSettings.setting_power_meter).catch(err => { this.error(err);});
			this.setStoreValue('sumPowerMeter', event.newSettings.setting_power_meter).catch(err => { this.error(err);});

		};


		/********************************************************************************/
		/*
		/*      setting_intervall_alarm - 
		/*      
		**********************************************************************************/ 

		if (event.changedKeys.includes('setting_intervall_alarm')){
			
			//this.log('setting_intervall_alarm: ', event.newSettings.setting_intervall_alarm);


			if(event.newSettings.setting_intervall_alarm === true){
				
				this.sett_reporing_timeout(60);
		
			} else {

				if(typeof this.time_id !== "undefined")
				{
					this.log("Disable reporting Timeout");
					this.homey.clearTimeout(this.time_id);
				} 
				//this.setCapabilityValue('watchdog', false).catch(err => { this.error(err);});
			}

		};



		
		
	} catch (err) {
		this.error('Error in listening or setting a new setting: ', err)
	}






	}






	async onEndDeviceAnnounce(){

		this.setAvailable().catch(err => { this.error(err);});
	}

	/**
	 * onRenamed is called when the user updates the device's name.
	 * This method can be used this to synchronise the name to the device.
	 * @param {string} name The new name
	 */
	async onRenamed(name) {
		this.log('MyDevice was renamed', name);

		await this.zclNode.endpoints[1].clusters.thermostat.writeAttributes({ display_text: name}).catch(err => { this.error(err);});
	}


	/**
	 * onDeleted is called when the user deleted the device.
	 */
	async onDeleted() {
		this.log('MyDevice has been deleted');


	}


/********************************************************************************/
/*
/*      BYTTE MELLOM TERMOSTAT OG REGULATOR - 
/*      
/*      
**********************************************************************************/ 
async switchTermostatFunksjon(modus) {
    
	
	if(this.print_log === 1)  this.log('switchTermostatFunksjon', modus );
	this.setStoreValue('regulatorMode', modus).catch(err => { this.error(err);});
	
	try {
		
		this.tempregpoint = this.getStoreValue('regulatorsetPoint');

		if(this.print_log === 1)  this.log('regulatorsetPoint', this.tempregpoint );


		if(modus == 1){
			
			if(this.hasCapability('dim.regulator') === false){
				await this.addCapability('dim.regulator');
				await this.setCapabilityValue('dim.regulator', (this.tempregpoint)).catch(err => { this.error(err);});
			}
			
		} else {
			

			if(this.hasCapability('target_temperature') === false){
				await this.addCapability('target_temperature');
				await this.setCapabilityValue('target_temperature', this.tempregpoint).catch(err => { this.error(err);});
			}
			
			
			if(this.hasCapability('measure_temperature') === false){
				await this.addCapability('measure_temperature');
				this.readattribute = await this.zclNode.endpoints[1].clusters[CLUSTER.THERMOSTAT.NAME].readAttributes('localTemperature').catch(err => { this.error(err);});
				await this.setCapabilityValue('measure_temperature', (Math.round((this.readattribute.localTemperature / 100) * 10) / 10)).catch(err => { this.error(err);});

			}
			

		}


		
		if(modus == 1){
			
			if(this.hasCapability('measure_temperature') === true){
				await this.removeCapability('measure_temperature');
			}
			if(this.hasCapability('target_temperature') === true){
				await this.removeCapability('target_temperature');
			}

		} else {

			if(this.hasCapability('dim.regulator') === true){
				await this.removeCapability('dim.regulator');
			}

		}


		if(this.print_log === 1)  this.log("1354 await this.refreshSettings();")
		this.refreshSettings();
		


    } catch (err) {
    	this.error('Error when trying to change operating mode: ', err)
    }

	
  }

/********************************************************************************/
/*
/*      OPPDATERE INNSTILLINGER- 
/*      
/*      
**********************************************************************************/ 


async readAll(){

	try {
		this.readattribute = await this.zclNode.endpoints[1].clusters[CLUSTER.THERMOSTAT.NAME].readAttributes(
			'operationMode',
			'thermostatLoad',
			'childLock', 
			'frost_guard', 
			'relayState', 
			'unoccupiedHeatingSetpoint', 
			'regulatorsetPoint', 
			'currentFloorTemperature', 
			'floorSensorError', 
			'externalSensorError', 
			'currentAirTemperature', 
			'localTemperature', 
			'temperaturSensor',
			'regulatorMode',
			'power_status').catch(err => { this.error(err);});
		
		this.setAvailable().catch(err => { this.error(err);});

		if(this.print_log === 1)  this.log('readAttributes', this.readattribute );

		await this.setStoreValue('thermostatLoad', this.readattribute.thermostatLoad).catch(err => { this.error(err);});
		await this.setCapabilityValue('keyLock', this.readattribute.childLock).catch(err => { this.error(err);});
		await this.setCapabilityValue('frost_guard', this.readattribute.frost_guard).catch(err => { this.error(err);});
		await this.setCapabilityValue('heat', this.readattribute.relayState).catch(err => { this.error(err);});
		await this.setCapabilityValue('onoff', this.readattribute.power_status).catch(err => { this.error(err);});
		
		if(this.hasCapability('measure_temperature') === true){
			await this.setCapabilityValue('measure_temperature', (Math.round((this.readattribute.localTemperature / 100) * 10) / 10)).catch(err => { this.error(err);});
		
		}

		await this.setStoreValue('regulatorsetPoint', this.readattribute.regulatorsetPoint).catch(err => { this.error(err);});

		await this.setStoreValue('sensorMode', this.readattribute.temperaturSensor).catch(err => { this.error(err);});

		this.switchTermostatFunksjon(this.readattribute.regulatorMode);

		if(this.readattribute.regulatorMode == 1){

			if(this.hasCapability('measure_temperature') === true){
				this.removeCapability('measure_temperature');
			}
			if(this.hasCapability('target_temperature') === true){
				this.removeCapability('target_temperature');
			}

			if (this.hasCapability('dim.regulator') === true) {
				this.setCapabilityValue('dim.regulator', this.readattribute.regulatorsetPoint).catch(err => { this.error(err);});
			}

		} else {

			if(this.hasCapability('dim.regulator') === true){
				this.removeCapability('dim.regulator');
			}

			if (this.hasCapability('target_temperature') === true) {
				this.setCapabilityValue('target_temperature', this.readattribute.regulatorsetPoint).catch(err => { this.error(err);});
			}

		}

		

		await this.setCapabilityValue('measure_temperature.floor', (Math.round((this.readattribute.currentFloorTemperature / 100) * 10) / 10)).catch(err => { this.error(err);});

		if(this.readattribute.floorSensorError === true){
			//this.setCapabilityValue('measure_temperature.floor', -99).catch(err => { this.error(err);});
			this.floorSensorError_status = "Error";

			this.setWarning(
				"Floor sensor error"
			).catch(err => { this.error(err);});
		
		} else {
			this.floorSensorError_status = "OK";	
		}


		if(this.readattribute.externalSensorError === true){
			//this.setCapabilityValue('measure_temperature.floor', -99).catch(err => { this.error(err);});
			this.externalSensorError_status = "Error";
			this.setWarning(this.homey.__('WarningExternalSensor')).catch(err => { this.error(err);});

		} else {
			this.externalSensorError_status = "OK";
		}

		if(this.floorSensorError_status === 'OK' && this.externalSensorError_status === 'OK'){
			this.unsetWarning().catch(err => { this.error(err);});
		}


		
		this.readattribute_sw = await this.zclNode.endpoints[1].clusters[CLUSTER.BASIC.NAME].readAttributes(
			'appVersion',
			'swBuildId',
			'hwVersion').catch(err => { this.error(err);});
		
		if(this.print_log === 1)  this.log('SW:', this.readattribute_sw);

		

		if(this.print_log === 1)  this.log('setting_floorSensorError:', this.floorSensorError_status);
		if(this.print_log === 1)  this.log('setting_externalSensorError:', this.externalSensorError_status);
		if(this.print_log === 1)  this.log('setting_night_switching_temp:', (Math.round((this.readattribute.unoccupiedHeatingSetpoint / 100) * 10) / 10));
		if(this.print_log === 1)  this.log('setting_version:', 'Thermostat: ' + this.readattribute_sw.appVersion + ' RF: ' + this.readattribute_sw.swBuildId);


		await this.setSettings({
			setting_floorSensorError: this.floorSensorError_status,
			setting_externalSensorError: this.externalSensorError_status,
			setting_night_switching_temp: (Math.round((this.readattribute.unoccupiedHeatingSetpoint / 100) * 10) / 10),
			setting_version: 'Thermostat: ' + this.readattribute_sw.appVersion + ' RF: ' + this.readattribute_sw.swBuildId
		}).catch(err => { this.error(err);});

		await this.setCapabilityValue('measure_temperature.air', (Math.round((this.readattribute.currentAirTemperature / 100) * 10) / 10)).catch(err => { this.error(err);});


		if(this.readattribute.operationMode == 0 || this.readattribute.operationMode == 1){
			await this.setCapabilityValue('operationMode', "0").catch(err => { this.error(err);});
		} else {
			if(this.print_log === 1)  this.log('this.readattribute.operationMode', this.readattribute.operationMode);
			await this.setCapabilityValue('operationMode', this.readattribute.operationMode.toString(8)).catch(err => { this.error(err);});
		}

		if(this.print_log === 1)  this.log("1478 await this.refreshSettings();")
		await this.refreshSettings();

	

		return 1;

	} catch (err) {
		this.error('Error in on readAll: ', err);
		return 0;

	}

	
}
/********************************************************************************/
/*
/*      OPPDATERE INNSTILLINGER- 
/*      
/*      
**********************************************************************************/ 
async refreshSettings() {
	
	/*
	try {
		this.log('CapabilityValues');
		this.log('sensorMode', this.getStoreValue('sensorMode'));
		this.log('frost_guard', this.getCapabilityValue('frost_guard'));
		this.log('regulatorMode', this.getStoreValue('regulatorMode').toString(8));
		this.log('keyLock', this.getCapabilityValue('keyLock'));
		this.log('thermostatLoad', this.getStoreValue('thermostatLoad'));

	
		this.log('getSettings', this.getSettings());

	} catch (err) {
		this.error('Error in CapabilityValues: ', err);
	}
	*/
	
	if(this.getStoreValue('sensorMode') != 'Regulator'){
		await this.setSettings({
			setting_temperaturSensor: this.getStoreValue('sensorMode'),
		}).catch(this.error );
	}

	await this.setSettings({
		
		setting_frost_guard: this.getCapabilityValue('frost_guard'),
		setting_regulatorfuksjon: this.getStoreValue('regulatorMode').toString(8),
		setting_keyLock: this.getCapabilityValue('keyLock'),
		setting_floor_watt: this.getStoreValue('thermostatLoad')
	}).catch(this.error );
	
	
	//this.log('getSettings2', this.getSettings());





}


async setClock(){
    
    this.localTime = Buffer.alloc(7);

    this.sys = await this.homey.clock.getTimezone();
    this.time = new Date(); //

    this.ar =  this.time.toLocaleDateString("sv-SE",{year: 'numeric', timeZone: this.sys})
    this.mnd =  this.time.toLocaleDateString("sv-SE",{month: 'numeric', timeZone: this.sys})
    this.dag =  this.time.toLocaleDateString("sv-SE",{day: 'numeric', timeZone: this.sys})
    this.hours =  this.time.toLocaleTimeString("sv-SE",{hour: 'numeric', timeZone: this.sys})
    this.minutt =  this.time.toLocaleTimeString("sv-SE",{minute: 'numeric', timeZone: this.sys})

    //Displaying the extracted variables on the console

	if(this.print_log === 1){

		this.log("Lokalt år: ", this.ar); //log(‘Lokalt år är typ:’,typeof(ar))
		this.log("Lokal mnd:",  this.mnd); //log(‘Lokal månad är typ:’,typeof(manad));
		this.log("Lokal dag:",  this.dag);
		this.log("Lokal time:",  this.hours);
		this.log("Lokal minutt:",  this.minutt);
		//Displaying time zone of the Homey
		this.log("timeZone:",this.sys);

	}

    this.localTime[0] = 20;
    this.localTime[1] = this.ar % 100;
    this.localTime[2] = this.mnd;
    this.localTime[3] = this.dag;
    this.localTime[4] = this.hours;
    this.localTime[5] = this.minutt;
    this.localTime[6] = 0;

    //this.log("Time:", this.localTime);

    try {
      this.zclNode.endpoints[1].clusters.time.setTime({
        Data: this.localTime,
      },{
        waitForResponse: false,
      }
      );
    } catch (err) {
      this.error('Error in send setTime CMD: ', err);
    }






  }



  async update_consumption(power_usage){

	if(this.print_log === 1)  this.log('setting_use_average:', this.getSetting('setting_use_average'))

	if(this.getSetting('setting_use_average') === true){
		if(this.print_log === 1)  this.log('Use real power');
		if(power_usage === true){
			power_usage = this.getSetting('setting_floor_watt');
		} else {
			power_usage = 0;
		}		
		if(this.print_log === 1)  this.log('real_power : ', power_usage);
	} else {

		if(this.print_log === 1)  this.log('mean_power : ', power_usage);
		if(power_usage === true || power_usage === false) return;
	}
	
	this.thisUpdate = Date.now();
	this.lastUpdate = this.getStoreValue('lastUpdate');
	this.lastMeanPower = this.getStoreValue('lastMeanPower');
	this.sumPowerMeter = this.getStoreValue('sumPowerMeter');


	if(this.lastUpdate){
		
		this.meanPowerkWh = ((this.thisUpdate - this.lastUpdate) / 1000 / 60 / 60) * (this.lastMeanPower / 1000);

		this.setStoreValue('lastMeanPower', power_usage).catch( this.error);
		this.setStoreValue('sumPowerMeter', (this.sumPowerMeter + this.meanPowerkWh)).catch( this.error );

		this.setSettings({
			setting_power_meter: (this.sumPowerMeter + this.meanPowerkWh),
		}).catch(err => { this.error(err);});

		/*
		this.log('meanPowerkWh : ', this.meanPowerkWh);
		this.log('thisUpdate : ', this.thisUpdate);
		this.log('lastUpdate : ', this.lastUpdate);
		this.log('Min siden siste endring: ', (((this.thisUpdate - this.lastUpdate) / 1000) / 60));
		this.log('lastMeanPower : ', this.lastMeanPower);
		

		this.log('sumPowerMeter : ', this.sumPowerMeter);
		*/
		
		this.setCapabilityValue('meter_power', this.sumPowerMeter + this.meanPowerkWh).catch(err => { this.error(err);});

	}

	/*
	if(this.getSettings('setting_use_average') === true){
		
		if(this.getCapabilityValue('heat') === true){
			this.setStoreValue('lastUpdate', this.thisUpdate ).catch(err => { this.error(err);});
		}

		this.setStoreValue('lastUpdate', this.thisUpdate ).catch(err => { this.error(err);});

	} else {
		
	}
	*/

	this.setStoreValue('lastUpdate', this.thisUpdate ).catch(err => { this.error(err);});
	this.setCapabilityValue('measure_power', power_usage).catch(err => { this.error(err);});



  }



}








module.exports = mTouchOne;
