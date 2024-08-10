const Homey = require('homey');
const { ZigBeeDevice } = require("homey-zigbeedriver");


    /********************************************************************************/
	/*
	/*      FUNCTION sett_reporing_timeout
	/*      
	**********************************************************************************/ 


    class ctmFunc extends ZigBeeDevice {

        
        async sett_reporing_timeout(timeout){
            
            const print_log = false;

            if(print_log === true){

                this.log(this.getName());
                this.log("Start TimeoutID: ", this.time_id);
                this.log("typeof", typeof this.time_id);

            }
            if(typeof this.time_id !== "undefined")
            {
                if(print_log === true){
                    this.log("clearTimeout");
                    
                } 
                
                this.homey.clearTimeout(this.time_id);
            } 
            

            this.time_id = this.homey.setTimeout(() => {

                if(print_log === true){
                    this.log("Timeout sett_reporing_timeout", timeout);
                    this.log(this.getName());
                    this.log("TimeoutID: ", this.time_id);
                }
               
                this.tokens = {
                    device: this.getName(),
                    timeout: timeout
                };

                this.driver.triggerWatchdog(this.tokens);

                //this.setCapabilityValue('watchdog', true).catch(err => { this.error(err);});
                

            }, (timeout * 60000));

            if(print_log === true) this.log("Create this.time_id", this.time_id);
    
        }


    }

    module.exports = ctmFunc;
