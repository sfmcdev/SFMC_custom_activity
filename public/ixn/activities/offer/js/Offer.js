define( function( require ) {

    'use strict';
    
	var Postmonger = require( 'postmonger' );
	var $ = require( 'vendor/jquery.min' );

    var connection = new Postmonger.Session();
    var toJbPayload = {};
    var step = 1; 
	var endpoints;
	
    $(window).ready(onRender);

    connection.on('initActivity', function(payload) {
        var amount;

        if (payload) {
            toJbPayload = payload;
            console.log('payload',payload);
            
			//merge the array of objects.
			var aArgs = toJbPayload['arguments'].execute.inArguments;
			var oArgs = {};
			for (var i=0; i<aArgs.length; i++) {  
				for (var key in aArgs[i]) { 
					oArgs[key] = aArgs[i][key]; 
				}
			}
			//oArgs.amount will contain a value if this activity has already been configured:
			amount = oArgs.amount || toJbPayload['configurationArguments'].defaults.amount;            
        }
        
		$.get( "/version", function( data ) {
			$('#version').html('Version: ' + data.version);
		});                

        // If there is no amount selected, disable the next button
		/*
        if (!amount) {
            connection.trigger('updateButton', { button: 'next', enabled: false });
        }

		$('#selectAmount').find('option[value='+ amount +']').attr('selected', 'selected');		
		*/
		
		connection.trigger('updateButton', { button: 'next', enabled: false });
		gotoStep(step);
        
    });

    connection.on('requestedEndpoints', function(data) {
		if( data.error ) {
			console.error( data.error );
		} else {
			endpoints = data;
            console.log("endpoints",data);
		}        
    });

    connection.on('clickedNext', function() {
        step++;
        gotoStep(step);
        connection.trigger('ready');
    });

    connection.on('clickedBack', function() {
        step--;
        gotoStep(step);
        connection.trigger('ready');
    });

    function onRender() {
        connection.trigger('ready');
		connection.trigger('requestTokens');
        connection.trigger('requestEndpoints');

		//connection.trigger('updateButton', { button: 'next', enabled: true});

    };

    function gotoStep(step) {
        $('.step').hide();
        switch(step) {
            case 1:
                $('#step1').show();
                connection.trigger('updateButton', { button: 'next', text: 'done', visible: true });
                connection.trigger('updateButton', { button: 'back', visible: false });
				
				connection.trigger( 'updateStep', step ); 
            break;
			default:
                save();
            break;
        }
    };
	
	function getTitleEn()
	{
		return $('#titleEn').attr('value').trim();
	};
	
	function getContentEn()
	{
		return $('#contentEn').attr('value').trim();
	};
	
	
	function getTitleTc()
	{
		return $('#titleTc').attr('value').trim();
	};
	
	function getContentTc()
	{
		return $('#contentTc').attr('value').trim();
	};
    function getMessageType() {
        return $('#selectMessageType').find('option:selected').attr('value').trim();
    };

    function save() {

        //var valueTier = getValueTier();
        //var type = getType();
        //var bonus = getBonus();

        // toJbPayload is initialized on populateFields above.  Journey Builder sends an initial payload with defaults
        // set by this activity's config.json file.  Any property may be overridden as desired.
        //toJbPayload.name = "my activity";

        //this will be sent into the custom activity body within the inArguments array.
		var titleEn = getTitleEn();
		var contentEn = getContentEn();
		var titleTc = getTitleTc();
		var contentTc = getContentTc();
		var messageType = getMessageType();
		
        toJbPayload['arguments'].execute.inArguments.push({"titleEn": titleEn});
		toJbPayload['arguments'].execute.inArguments.push({"contentEn": contentEn});
		toJbPayload['arguments'].execute.inArguments.push({"titleTc": titleTc});
		toJbPayload['arguments'].execute.inArguments.push({"contentTc": contentTc});
		toJbPayload['arguments'].execute.inArguments.push({"messageType": messageType});
        //toJbPayload['arguments'].execute.inArguments.push({"type": type});
        //toJbPayload['arguments'].execute.inArguments.push({"bonus": bonus});

		/*
        toJbPayload['metaData'].things = 'stuff';
        toJbPayload['metaData'].icon = 'path/to/icon/set/from/iframe/icon.png';
        toJbPayload['configurationArguments'].version = '1.1'; // optional - for 3rd party to track their customActivity.js version
        toJbPayload['configurationArguments'].partnerActivityId = '49198498';
        toJbPayload['configurationArguments'].myConfiguration = 'configuration coming from iframe';
		*/
		
		toJbPayload.metaData.isConfigured = true;  //this is required by JB to set the activity as Configured.
        connection.trigger('updateActivity', toJbPayload);
    }; 
    	 
});
			
