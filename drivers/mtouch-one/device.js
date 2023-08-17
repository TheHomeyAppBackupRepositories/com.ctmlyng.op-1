'use strict';

const Homey = require('homey');
const { ZigBeeDevice } = require('homey-zigbeedriver');
const { ZCLNode, CLUSTER } = require('zigbee-clusters');
const CTMSpecificThermostatCluster = require('../../lib/CTMSpecificThermostatCluster');



//debug(true);

class mTouchOne extends ZigBeeDevice {



	/**
	 * onInit is called when the device is initialized.
	 */
	async onNodeInit({ zclNode }) {

		this.setAvailable().catch(this.error);
		this.log('Device Name: ', this.getName());

		

		/* Version 1.1.0 > 1.1.1 */
		
		if(this.hasCapability('operationMode') === false){
			await this.addCapability('operationMode');
		}
		if(this.hasCapability('button.refresh') === false){
			await this.addCapability('button.refresh');
			this.setCapabilityOptions('button.refresh', {
				maintenanceAction: true,
				title: { "en": "Refresh settings", "no": "Oppdatere innstillinger" },
				desc: { "en": "Send a request to the thermostat for updated information", "no": "Send en forespørsel til termostaten på oppdatert informasjon" }
			});
			//await this.removeCapability('button.refresh');
		}

		if(this.hasCapability('onoff') === false){
			this.addCapability('onoff');
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

				/*
				{
					endpointId: this.getClusterEndpoint(CLUSTER.THERMOSTAT),
					cluster: CLUSTER.THERMOSTAT,
					attributeName: 'night_switching',
					minInterval: 0,
					maxInterval: 43200, // once per ~30 min
					minChange: 1,
				},
				*/



			]);

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
			this.setUnavailable(this.homey.__('device_unavailable')).catch(this.error);
			this.error('Error in configureAttributeReporting: ', err);
		}


		if(this.isFirstInit()){

			try{
				this.setStoreValue('lastMeanPower', 0);
				this.setStoreValue('sumPowerMeter', 0);
				this.setStoreValue('lastUpdate', null );
				this.setStoreValue('old_setPoint', 0);
				this.setStoreValue('store_status_costcontrol', false);

			} catch (err) {
				this.error('Error in setStoreValues: ', err);
			}
		}

		await this.readAll();

	


		
		/******************************************************************************* */
		/*
		/*      ON OFF / operationMode
		/*
		**********************************************************************************/ 
		if (this.hasCapability('operationMode')) {

			zclNode.endpoints[1].clusters[CLUSTER.THERMOSTAT.NAME].on('attr.operationMode', (attr_value) => {
				try {

					this.log('push attr.opreationMode:', attr_value);
					this.setAvailable().catch(this.error);
					if(attr_value === 0 || attr_value === 1){
						this.setCapabilityValue('operationMode', "0");
						this.setCapabilityValue('onoff', false);
					} else {
						this.setCapabilityValue('operationMode', attr_value.toString(8));
						this.setCapabilityValue('onoff', true);
					}


				} catch (err) {
					this.error('Error in operationMode: ', err);
				}
			});

			this.registerCapabilityListener('operationMode', async (doperationMode) => {
				try {

					this.setAvailable().catch(this.error);
					this.log ('operationMode set to:', operationMode);
					if(operationMode === "0"){
						this.log ('write power_status:', operationMode);
						await zclNode.endpoints[1].clusters.thermostat.writeAttributes({ power_status: false });
						this.setCapabilityValue('onoff', false);
					} else {
						await zclNode.endpoints[1].clusters.thermostat.writeAttributes({ operationMode: operationMode });
						this.setCapabilityValue('onoff', true);
					}
					

				} catch (err) {
					//this.setUnavailable(this.homey.__('device_unavailable')).catch(this.error);
					this.error('Error in writeAttributes operationMode: ', err)
				}

			});

			this.registerCapabilityListener('onoff', async (onoff) => {
				try {
					this.log ('onoff set to:', onoff);
					this.setCapabilityValue('onoff', onoff);
					await zclNode.endpoints[1].clusters.thermostat.writeAttributes({ power_status: onoff });
				} catch (err) {
					//this.setUnavailable(this.homey.__('device_unavailable')).catch(this.error);
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

				this.log('push attr temperaturSensor: ', attr_value);
				this.setStoreValue('sensorMode', attr_value);

				this.setSettings({
					setting_temperaturSensor: attr_value,
				}).catch(this.error);

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
					this.log('push localTemperature: ', attr_value);
					this.value = Math.round((attr_value / 100) * 10) / 10;
					this.log('localTemperature: ', this.value);
					this.setAvailable().catch(this.error);
		
					//this.log('sensor_mode: ', sensor_mode);
					if(this.getStoreValue('regulatorMode') != 1){
						if(this.hasCapability('measure_temperature') === true){
							this.setCapabilityValue('measure_temperature', this.value);
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
					this.log('weeklyTimer:', this.readattribute.weeklyTimerEnable);
					this.setStoreValue('weeklyTimer', this.readattribute.weeklyTimerEnable);
					this.setSettings({
						setting_weeklyTimer: this.readattribute.weeklyTimerEnable,
					}).catch(this.error);
			
				} catch (err) {
					this.error('Error in readAttributes weeklyTimerEnable: ', err);
				}
			
				zclNode.endpoints[1].clusters[CLUSTER.THERMOSTAT.NAME].on('attr.weeklyTimerEnable', (attr_value) => {
					try {
			
						this.log('weeklyTimer: ', attr_value);
						this.setSettings({
							setting_weeklyTimer: attr_value,
						}).catch(this.error);
			
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

				this.setAvailable().catch(this.error);
			
				this.log('2 push regulatorsetPoint: ', attr_value);
				this.setStoreValue('regulatorsetPoint', attr_value).catch(this.error);

				if(this.getStoreValue('regulatorMode') == 1){
					if(this.hasCapability('dim.regulator') === true){
						this.setCapabilityValue('dim.regulator', (attr_value)).catch(this.error);
					}
			
				} else {
					if (this.hasCapability('target_temperature') === true) {
						this.setCapabilityValue('target_temperature', attr_value).catch(this.error);
					}
				}		

			} catch (err) {
				this.error('Error in regulatorsetPoint: ', err);
			}
		});


		this.registerCapabilityListener('dim.regulator', async (regulatorsetPoint) => {
			try {

				this.log('dim.regulator', regulatorsetPoint);

				if(regulatorsetPoint >= 1){
					await zclNode.endpoints[1].clusters.thermostat.writeAttributes({ power_status: true, regulatorsetPoint: regulatorsetPoint});
					this.setCapabilityValue('onoff', true);
					
				}  else {
					await zclNode.endpoints[1].clusters.thermostat.writeAttributes({ power_status: false, regulatorsetPoint: regulatorsetPoint});
					this.setCapabilityValue('onoff', false);
				}
				this.log ('dim.regulator regulatorsetPoint set to:', regulatorsetPoint)
			
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
					this.log('currentAirTemperature: ', this.value);
					
					//this.log('sensor_mode: ', sensor_mode);
					this.setCapabilityValue('measure_temperature.air', this.value);
					this.setAvailable().catch(this.error);
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

				this.log('floorSensorError: ', attr_value);

				if(attr_value === true){
					this.setCapabilityValue('measure_temperature.floor', -99).catch(this.error);
					this.floorSensorError_status = "Error";

					this.setWarning(this.homey.__('FloorSensorError')).catch(this.error);

				} else {
						this.floorSensorError_status = "OK";
						this.unsetWarning().catch(this.error);
				}

				this.setSettings({
					setting_floorSensorError: this.floorSensorError_status
				}).catch(this.error);

				
			} catch (err) {
				this.error('Error in floorSensorError: ', err);
			}
		});
			
		zclNode.endpoints[1].clusters[CLUSTER.THERMOSTAT.NAME].on('attr.externalSensorError', (attr_value) => {
			try {

				this.log('externalSensorError: ', attr_value);

				if(attr_value === true){
					//this.setCapabilityValue('measure_temperature.floor', -99).catch(this.error);
					this.externalSensorError_status = "Error";
					this.setWarning(this.homey.__('ExternalSensorError')).catch(this.error);

				} else {
					this.externalSensorError_status = "OK";
					this.unsetWarning().catch(this.error);
				}
				
				this.setSettings({
					setting_externalSensorError: this.externalSensorError_status
				}).catch(this.error);

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
					this.setAvailable().catch(this.error);
					this.value = Math.round((attr_value / 100) * 10) / 10;
					this.log('currentFloorTemperature: ', this.value);
					this.setCapabilityValue('measure_temperature.floor', this.value).catch(this.error);

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
				this.log('occupiedHeatingSetpoint: ', this.value);					

			} catch (err) {
				this.error('Error in occupiedHeatingSetpoint: ', err);
			}
		});
		*/
		
			

		this.registerCapabilityListener('target_temperature', async (regulatorsetPoint) => {
			try {

				this.log("target_temperature set to", regulatorsetPoint);
				this.setAvailable().catch(this.error);
				await zclNode.endpoints[1].clusters.thermostat.writeAttributes({ operationMode: 3, regulatorsetPoint: regulatorsetPoint});
				this.log ('Change operationMode to ON');
				this.setCapabilityValue('operationMode', "3");
	
			} catch (err) {
				//this.setUnavailable(this.homey.__('device_unavailable')).catch(this.error);
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
				this.log('unoccupiedHeatingSetpoint: ', this.value);
				
				this.setSettings({
					setting_night_switching_temp: this.value,
				}).catch(this.error);

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
					this.setAvailable().catch(this.error);
					
					this.log('relayState: ', attr_value);
					this.setCapabilityValue('heat', attr_value).catch(this.error);
				
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
				this.log('push regulatorMode: ', attr_value);
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

					this.log('mean_power: ', mean_power);
	
					this.thisUpdate = Date.now();
					this.lastUpdate = this.getStoreValue('lastUpdate');
					this.lastMeanPower = this.getStoreValue('lastMeanPower');
					this.sumPowerMeter = this.getStoreValue('sumPowerMeter');


					if(this.lastUpdate){
						this.meanPowerkWh = ((this.thisUpdate - this.lastUpdate) / 1000 / 60 / 60) * (this.lastMeanPower / 1000);

						this.setStoreValue('lastMeanPower', mean_power).catch( this.error );
						this.setStoreValue('sumPowerMeter', (this.sumPowerMeter + this.meanPowerkWh)).catch( this.error );

						this.setSettings({
							setting_power_meter: (this.sumPowerMeter + this.meanPowerkWh),
						}).catch(this.error);

						this.log('meanPowerkWh : ', this.meanPowerkWh);

						this.log('thisUpdate : ', this.thisUpdate);
						this.log('lastUpdate : ', this.lastUpdate);
						this.log('lastMeanPower : ', this.lastMeanPower);
						this.log('mean_power : ', mean_power);
			
						this.log('sumPowerMeter : ', this.sumPowerMeter);
						
						this.setCapabilityValue('meter_power', this.sumPowerMeter).catch(this.error);

					}

					this.setStoreValue('lastUpdate', this.thisUpdate ).catch(this.error);
					this.setCapabilityValue('measure_power', mean_power).catch(this.error);

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

					this.log('frost_guard: ', attr_value);

					this.setSettings({
						setting_frost_guard: attr_value,
					}).catch(this.error);

					this.setCapabilityValue('frost_guard', attr_value).catch(this.error);

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

						this.log('keyLock: ', attr_value);

						this.setSettings({
							setting_keyLock: attr_value,
						}).catch(this.error);

						this.setCapabilityValue('keyLock', attr_value);

					} catch (err) {
						this.error('Error in keyLock: ', err);
					}
				});

				
			}

			zclNode.endpoints[1].clusters[CLUSTER.THERMOSTAT.NAME].on('attr.thermostatLoad', (attr_value) => {
				try {

					this.log('push attr thermostatLoad: ', attr_value);

					this.setSettings({
						setting_floor_watt: attr_value,
					}).catch(this.error);

					this.setStoreValue('thermostatLoad', attr_value).catch(this.error);

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
				this.setCapabilityValue('cost_control', this.getStoreValue('store_status_costcontrol'));
						
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
		
				//await this.setStoreValue('regulatorsetPoint', 0).catch(this.error);
				//this.log('this', this);
				return await this.readAll();	
	
			} catch (err) {
				this.error('Error in onStartRead: ', err);
				throw new Error('Something went wrong');
			}
			
		});


		// Read all Capability
		await this.refreshSettings();
		
		
	} // async	onNodeInit({ zclNode }) {


	/********************************************************************************/
	/*
	/*      FLOWCARD - Sette termostaten i ON, Nattsenk eller AV/Frostsikring
	/*      
	**********************************************************************************/ 
	
	async flowCangeThermostatState(args){
		try {

			this.log ('operationMode set to:', args.flow_tilstand);
			if(args.flow_tilstand === "0"){
				this.log ('write power_status:', args.flow_tilstand);
				await this.zclNode.endpoints[1].clusters.thermostat.writeAttributes({ power_status: false });
			} else {
				await this.zclNode.endpoints[1].clusters.thermostat.writeAttributes({ operationMode: args.flow_tilstand });
			}
			return true;

		} catch (err) {
			this.log('flowCangeThermostatState: ', err);
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
			
			
			this.log ('regulatorMode set to:', args.flow_mode);
			
			if(args.flow_mode == 1){
				
				if(args.setpoint < 1 || args.setpoint > 99){
					throw new Error(this.homey.__('flow_flowRegulatorErrorNumer'));
				}
			} else {
				
				if(args.setpoint < 5 || args.setpoint > 40){
					throw new Error(this.homey.__('flow_flowRegulatorErrorNumer'));
				} 

				
			}
			
			await this.zclNode.endpoints[1].clusters.thermostat.writeAttributes({ regulatorMode: args.flow_mode, regulatorsetPoint: Math.round(args.setpoint) }).catch(this.error);
			//this.switchTermostatFunksjon(args.flow_mode, 0);

			return true;

		} catch (err) {
			this.log('flowCangeThermostatMode: ', err);
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
		
		this.log('Old Costcontrol:', this.status_costcontrol);

		
		if((this.sensorMode === 'Regulator') || (this.sensorMode === 'MVRegulator')){
		
			this.setCapabilityValue('cost_control', false).catch(this.error);
			this.log('Error! CostControl not supported in regulatormode', this.sensorMode);
			
			throw new Error(this.homey.__('flow_CostControlErrorMode'));

		}

		if(this.getCapabilityValue('operationMode') != "3"){
			this.setCapabilityValue('cost_control', false).catch(this.error);
			this.log('Error! CostControl only supportet in operation mode ON');
			
			throw new Error(this.homey.__('flow_CostControlErrorState'));
		}


		if(this.status_costcontrol === false){
			
			//Enable cost control
			this.new_setpoint = (this.setpoint + this.temperature);
			this.setStoreValue('old_setPoint', this.setpoint).catch(this.error);
															
		} else if ((this.oldSetPont + this.temperature) != this.new_setpoint){
			// Kostnadskontroll aktiv, men vi økter justeringen
			this.new_setpoint = (this.oldSetPont + this.temperature);
			
		} else {
			this.log('Costcontrol nothting to do:', this.new_setpoint)
			return false;

		}

		this.log('oldSetPont:', (this.oldSetPont));
		this.log('(setpoint + temperature):', (this.setpoint + this.temperature));
		this.log('Cost control sepoint just:', this.temperature);
		this.log('Old setpoint:', this.oldSetPont);
		this.log('New setpoint:', this.new_setpoint);
		

		
		if((this.new_setpoint < 5) || (this.new_setpoint > 40)){
			this.log('New occupiedHeatingSetpoint out of range:', this.new_setpoint)

			this.setCapabilityValue('cost_control', false).catch(this.error);
			this.setStoreValue('store_status_costcontrol', false).catch( this.error )
			throw new Error(this.homey.__('flow_CostControlNumerError'), this.new_setpoint);
			
		} 

		try {
			await this.zclNode.endpoints[1].clusters.thermostat.writeAttributes({ operationMode: 3 ,occupiedHeatingSetpoint: this.new_setpoint * 100})
			//await this.zclNode.endpoints[1].clusters.thermostat.writeAttributes({ operationMode: 3, regulatorsetPoint: this.new_setpoint});

			if(this.status_costcontrol != true){
				this.setStoreValue('store_status_costcontrol', true).catch(this.error);
			}

			this.setCapabilityValue('cost_control', true).catch(this.error);
			this.setCapabilityValue('target_temperature', this.new_setpoint).catch(this.error);

			this.log('occupiedHeatingSetpoint attribute set to:', this.new_setpoint)

			return;
			
		
		} catch (err) {
			this.log('cardEnableCostCongroll: ', err)
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

		this.log('Old setpoint:', this.setpoint);
		this.log('New setpoint:', this.oldSetPont);

		if((this.sensorMode === 'Regulator') || (this.sensorMode === 'MVRegulator')){
		
			this.setCapabilityValue('cost_control', false).catch(this.error);
			this.log('Error! Cost Control not supported in regulatormode', this.sensorMode);
			throw new Error(this.homey.__('flow_CostControlErrorMode'));

		}

		if(this.getCapabilityValue('operationMode') != "3"){
			this.setCapabilityValue('cost_control', false).catch(this.error);
			this.log('Error! CostControl only supportet in operation state ON');
			throw new Error(this.homey.__('flow_CostControlErrorState'));
		}


		if(this.status_costcontrol == true){
			
			if (this.oldSetPont < 5 || this.oldSetPont > 40){
				this.log('Error! Setpoint  attribute set to:', this.oldSetPont);
				throw new Error(this.homey.__('flow_CostControlNumerError'), this.oldSetPont);
			}
			//Disable cost control
			try {
				await this.zclNode.endpoints[1].clusters.thermostat.writeAttributes({ occupiedHeatingSetpoint: this.oldSetPont * 100});
				this.log('occupiedHeatingSetpoint attribute set to:', this.oldSetPont);

				this.setCapabilityValue('cost_control', false);
				this.setStoreValue('store_status_costcontrol', false).catch(this.error);
				this.setCapabilityValue('target_temperature', this.oldSetPont);

			} catch (err) {
				this.log('cardEnableCostControl: ', err)
				throw new Error(this.homey.__('flow_CostControlDisableFailed'));
			}
			
		} else {
			this.log('cardDeactivateCostControl nothting to do:', this.status_costcontrol)
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
			this.log('flowIs_Heating: ', err);
			throw new Error(this.homey.__('flow_isHeatingError'));
		}

	}

	/********************************************************************************/
	/*
	/*      FLOWCARD - flowIs_Heating
	/*      
	**********************************************************************************/ 


	async flowIs_Mode(args){
			this.log("args", args.flow_relay_thermostatmode);
			this.log("flowIs_Mode", this.getCapabilityValue('operationMode'));

			if(args.flow_relay_thermostatmode === this.getCapabilityValue('operationMode')) return true; else return false;

	}

	/********************************************************************************/
	/*
	/*      FLOWCARD - flowIs_regulatorMode
	/*      
	**********************************************************************************/ 


	async flowIs_regulatorMode(args){
			this.log("args", args.flow_regulatorMode);
			this.log("Flow regulatorMode", this.getStoreValue('regulatorMode'));
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
			this.zclNode.endpoints[1].clusters.thermostat.writeAttributes({ temperaturSensor: event.newSettings.setting_temperaturSensor, regulatorsetPoint: 20}).catch(this.error);


		//this.switchTermostatFunksjon(event.newSettings.setting_temperaturSensor);

		};
		
        /********************************************************************************/
        /*
        /*      Reguleringsvalg - 
        /*      
        **********************************************************************************/ 
        
		if (event.changedKeys.includes('setting_regulatorfuksjon')) {
			this.log('setting_regulatorfuksjon: ', event.newSettings.setting_regulatorfuksjon);
			this.zclNode.endpoints[1].clusters.thermostat.writeAttributes({ regulatorMode: event.newSettings.setting_regulatorfuksjon, regulatorsetPoint: 20 }).catch(this.error);

		};

		  


        /********************************************************************************/
        /*
        /*      Effekt Varmekabel - 
        /*      
        **********************************************************************************/ 
		if (event.changedKeys.includes('setting_floor_watt')) {


			this.log('setting_floor_watt: ', event.newSettings.setting_floor_watt);
			
			this.zclNode.endpoints[1].clusters.thermostat.writeAttributes({ thermostatLoad: event.newSettings.setting_floor_watt}).catch(this.error);

		};
        
        /********************************************************************************/
        /*
        /*      Frostsikring Aktivert - 
        /*      
        **********************************************************************************/ 

		if (event.changedKeys.includes('setting_frost_guard')) {
			this.log('setting_frost_guard: ', event.newSettings.setting_frost_guard);

			this.zclNode.endpoints[1].clusters.thermostat.writeAttributes({ frost_guard: event.newSettings.setting_frost_guard}).catch(this.error);


		};


		/*
		/********************************************************************************/
        /*
        /*      weeklyTimerEnable Spare Aktivert 
        /*      
        **********************************************************************************/ 
		/*
		if (event.changedKeys.includes('setting_weeklyTimer')) {
			this.log('setting_weeklyTimer: ', event.newSettings.setting_weeklyTimer);

			this.zclNode.endpoints[1].clusters.thermostat.writeAttributes({ weeklyTimerEnable: event.newSettings.setting_weeklyTimer}).catch(this.error);


		};
		*/
		


        /********************************************************************************/
        /*
        /*      Barnesikring/Tastelås aktivert
        /*      
        **********************************************************************************/ 


		if (event.changedKeys.includes('setting_keyLock')) {
			this.log('setting_keyLock: ', event.newSettings.setting_keyLock);

			this.zclNode.endpoints[1].clusters.thermostat.writeAttributes({ childLock: event.newSettings.setting_keyLock}).catch(this.error);
	

			
		};
     
		/********************************************************************************/
        /*
        /*      POWERMETER / KW TELLER
        /*      
        **********************************************************************************/ 


		if (event.changedKeys.includes('setting_power_meter')) {

			this.log('power_meter: ', event.newSettings.setting_power_meter);
			
			this.setCapabilityValue('meter_power', event.newSettings.setting_power_meter).catch(this.error);
			this.setStoreValue('sumPowerMeter', event.newSettings.setting_power_meter).catch(this.error);

		};

		
		
	} catch (err) {
		this.error('Error in listening or setting a new setting: ', err)
	}






	}






	async onEndDeviceAnnounce(){

		this.setAvailable().catch(this.error);
	}

	/**
	 * onRenamed is called when the user updates the device's name.
	 * This method can be used this to synchronise the name to the device.
	 * @param {string} name The new name
	 */
	async onRenamed(name) {
		this.log('MyDevice was renamed', name);

		await this.zclNode.endpoints[1].clusters.thermostat.writeAttributes({ display_text: name}).catch(this.error);
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
    
	
	this.log('switchTermostatFunksjon', modus );
	this.setStoreValue('regulatorMode', modus).catch(this.error);
	
	try {
		
		this.tempregpoint = this.getStoreValue('regulatorsetPoint');

		this.log('regulatorsetPoint', this.tempregpoint );


		if(modus == 1){
			
			if(this.hasCapability('dim.regulator') === false){
				await this.addCapability('dim.regulator');
				await this.setCapabilityValue('dim.regulator', (this.tempregpoint)).catch(this.error);
			}
			
		} else {
			

			if(this.hasCapability('target_temperature') === false){
				await this.addCapability('target_temperature');
				await this.setCapabilityValue('target_temperature', this.tempregpoint).catch(this.error);
			}
			
			
			if(this.hasCapability('measure_temperature') === false){
				await this.addCapability('measure_temperature');
				this.readattribute = await this.zclNode.endpoints[1].clusters[CLUSTER.THERMOSTAT.NAME].readAttributes('localTemperature');
				await this.setCapabilityValue('measure_temperature', (Math.round((this.readattribute.localTemperature / 100) * 10) / 10)).catch(this.error);

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
			'power_status');
		
		this.setAvailable().catch(this.error);

		this.log('readAttributes', this.readattribute );

		await this.setStoreValue('thermostatLoad', this.readattribute.thermostatLoad).catch(this.error);
		await this.setCapabilityValue('keyLock', this.readattribute.childLock).catch(this.error);
		await this.setCapabilityValue('frost_guard', this.readattribute.frost_guard).catch(this.error);
		await this.setCapabilityValue('heat', this.readattribute.relayState).catch(this.error);
		await this.setCapabilityValue('onoff', this.readattribute.power_status).catch(this.error);
		
		if(this.hasCapability('measure_temperature') === true){
			await this.setCapabilityValue('measure_temperature', (Math.round((this.readattribute.localTemperature / 100) * 10) / 10)).catch(this.error);
		
		}

		await this.setStoreValue('regulatorsetPoint', this.readattribute.regulatorsetPoint).catch(this.error);

		await this.setStoreValue('sensorMode', this.readattribute.temperaturSensor).catch(this.error);

		this.switchTermostatFunksjon(this.readattribute.regulatorMode);

		if(this.readattribute.regulatorMode == 1){setting_temperaturSensor

			if(this.hasCapability('measure_temperature') === true){
				this.removeCapability('measure_temperature');
			}
			if(this.hasCapability('target_temperature') === true){
				this.removeCapability('target_temperature');
			}

		} else {

			if(this.hasCapability('dim.regulator') === true){
				this.removeCapability('dim.regulator');
			}

		}

		

		await this.setCapabilityValue('measure_temperature.floor', (Math.round((this.readattribute.currentFloorTemperature / 100) * 10) / 10)).catch(this.error);

		if(this.readattribute.floorSensorError === true){
			//this.setCapabilityValue('measure_temperature.floor', -99).catch(this.error);
			this.floorSensorError_status = "Error";

			this.setWarning(
				"Floor sensor error"
			).catch(this.error);
		
		} else {
			this.floorSensorError_status = "OK";	
		}


		if(this.readattribute.externalSensorError === true){
			//this.setCapabilityValue('measure_temperature.floor', -99).catch(this.error);
			this.externalSensorError_status = "Error";
			this.setWarning(this.homey.__('WarningExternalSensor')).catch(this.error);

		} else {
			this.externalSensorError_status = "OK";
		}

		if(this.floorSensorError_status === 'OK' && this.externalSensorError_status === 'OK'){
			this.unsetWarning().catch(this.error);
		}
		
		this.setSettings({
			setting_floorSensorError: this.floorSensorError_status,
			setting_externalSensorError: this.externalSensorError_status,
			setting_night_switching_temp: (Math.round((this.readattribute.unoccupiedHeatingSetpoint / 100) * 10) / 10)
		}).catch(this.error);

		await this.setCapabilityValue('measure_temperature.air', (Math.round((this.readattribute.currentAirTemperature / 100) * 10) / 10)).catch(this.error);


		if(this.readattribute.operationMode == 0 || this.readattribute.operationMode == 1){
			await this.setCapabilityValue('operationMode', "0").catch(this.error);
		} else {
			this.log('this.readattribute.operationMode', this.readattribute.operationMode);
			await this.setCapabilityValue('operationMode', this.readattribute.operationMode.toString(8)).catch(this.error);
		}

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
		this.log('sensorMode', this.getCapabilityValue('sensorMode'));
		this.log('frost_guard', this.getCapabilityValue('frost_guard'));
		this.log('night_switching', this.getCapabilityValue('night_switching'));
		this.log('thermostatLoad', this.getCapabilityValue('thermostatLoad'));
		this.log('temperature_nattsenk', this.getCapabilityValue('temperature_nattsenk'));
		this.log('keyLock', this.getCapabilityValue('keyLock'));

		this.log('getSettings', this.getSettings());

	} catch (err) {
		this.error('Error in CapabilityValues: ', err);
	}
	*/


	await this.setSettings({
		setting_temperaturSensor: this.getStoreValue('sensorMode'),
		setting_frost_guard: this.getCapabilityValue('frost_guard'),
		setting_regulatorfuksjon: this.getStoreValue('regulatorMode').toString(8),
		//setting_weeklyTimer: this.getStoreValue('weeklyTimer'),
		//setting_night_switching_temp: this.getCapabilityValue('measure_temperature.nattsenk'),
		setting_keyLock: this.getCapabilityValue('keyLock'),
		setting_floor_watt: this.getStoreValue('thermostatLoad')
	}).catch(this.error );


	//this.log('getSettings2', this.getSettings());



}






}








module.exports = mTouchOne;
