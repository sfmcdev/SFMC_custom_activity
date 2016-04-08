'use strict';
// Module Dependencies
// -------------------
var express     = require('express');
var http        = require('http');
var JWT         = require('./lib/jwtDecoder');
var path        = require('path');
var request     = require('request');
var bodyParser  = require('body-parser');
var routes      = require('./routes');
var activityOffer   = require('./routes/activityOffer');
var activityUtils    = require('./routes/activityUtils');
var pkgjson = require( './package.json' );

var app = express();

// Register configs for the environments where the app functions
// , these can be stored in a separate file using a module like config

var APIKeys = {
    appId           : 'daf6e64b-0967-4856-a67f-3ba092ea3be5',
    clientId        : 'k9p4su7fxqz84np3gg9nzeru',
    clientSecret    : 'asV7XjYWC9rYFEfapUWTjNuR',
    appSignature    : '4dkfyuo543f3p4lfogagyu52pmbmifchmgks5rsciq0sos4yji5zneq4ews141lule2pp5edu0lp1kr05ojbgf1teicrpywjueps3hepcobszsplxux5zf5ucqwyk3araagticbn04i314cqoezzj11th3xlvatlbjhryf3abpgtodbxx5dhbhf5bw21l2c3hnhinw43ihtownairfkcjk2rkbght0h4bpf2wsyjgiigqjchgonskmkwlo3twmc',
    authUrl         : 'https://auth.exacttargetapis.com/v1/requestToken?legacy=1'
};

// Simple custom middleware
function tokenFromJWT( req, res, next ) {
    // Setup the signature for decoding the JWT
    var jwt = new JWT({appSignature: APIKeys.appSignature});
    
    // Object representing the data in the JWT
    var jwtData = jwt.decode( req );

    // Bolt the data we need to make this call onto the session.
    // Since the UI for this app is only used as a management console,
    // we can get away with this. Otherwise, you should use a
    // persistent storage system and manage tokens properly with
    // node-fuel
    req.session.token = jwtData.token;
    next();
}

// Use the cookie-based session  middleware
app.use(express.cookieParser());

// TODO: MaxAge for cookie based on token exp?
app.use(express.cookieSession({secret: "DeskAPI-CookieSecret0980q8w0r8we09r8"}));

// Configure Express
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
// for jwt
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.text({ type: 'application/jwt' }));
app.use(bodyParser.json({ type: 'application/*+json' }))

app.use(express.methodOverride());
app.use(express.favicon());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));



// Express in Development Mode
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

// HubExchange Routes
app.get('/', routes.index );
app.post('/login', tokenFromJWT, routes.login );
app.post('/logout', routes.logout );

// Custom Activity Routes for interacting with Desk.com API
app.post('/ixn/activities/offer/save/', activityOffer.save );
app.post('/ixn/activities/offer/validate/', activityOffer.validate );
app.post('/ixn/activities/offer/publish/', activityOffer.publish );
app.post('/ixn/activities/offer/execute/', tokenFromJWT, activityOffer.execute );

// not sure what this does
app.get( '/ixn/activities/generic/config.json', function( req, res ) {
    var appName = 'activityAppName';
    var actKey = 'appcenterKey';
    var actName = 'activityName';
    var actDesc = 'activityDescription';
    var search = new RegExp('{{'+appName+'}}', 'g');
    var json = JSON.parse(JSON.stringify(configjson));
    json.arguments.execute.url = configjson.arguments.execute.url.replace(search,process.env[appName]);
    json.arguments.execute.useJwt = process.env.jwtUse;
    json.arguments.execute.customerKey = process.env.jwtExternalKey;
    json.configurationArguments.save.url = configjson.configurationArguments.save.url.replace(search,process.env[appName]);
    json.configurationArguments.save.useJwt = process.env.jwtUse;
    json.configurationArguments.save.customerKey = process.env.jwtExternalKey;
    json.configurationArguments.publish.url = configjson.configurationArguments.publish.url.replace(search,process.env[appName]);
    json.configurationArguments.publish.useJwt = process.env.jwtUse;
    json.configurationArguments.publish.customerKey = process.env.jwtExternalKey;
    json.configurationArguments.validate.url = configjson.configurationArguments.validate.url.replace(search,process.env[appName]);
    json.configurationArguments.validate.useJwt = process.env.jwtUse;
    json.configurationArguments.validate.customerKey = process.env.jwtExternalKey;
    json.edit.url = configjson.edit.url.replace(search,process.env[appName]);
    search = new RegExp('{{'+actKey+'}}', 'g');
    json.configurationArguments.applicationExtensionKey = configjson.configurationArguments.applicationExtensionKey.replace(search,process.env[actKey]);
    search = new RegExp('{{'+actName+'}}', 'g');
    json.lang['en-US'].name = configjson.lang['en-US'].name.replace(search,process.env[actName]);   
    search = new RegExp('{{'+actDesc+'}}', 'g');
    json.lang['en-US'].description = configjson.lang['en-US'].description.replace(search,process.env[actDesc]); 
    res.status(200).send( json );
});


app.get('/clearList', function( req, res ) {
	// The client makes this request to get the data
	activityUtils.logExecuteData = [];
	res.send( 200 );
});


// Used to populate events which have reached the activity in the interaction we created
app.get('/getActivityData', function( req, res ) {
	// The client makes this request to get the data
	if( !activityUtils.logExecuteData.length ) {
		res.send( 200, {data: null} );
	} else {
		res.send( 200, {data: activityUtils.logExecuteData} );
	}
});

app.get( '/version', function( req, res ) {
	res.setHeader( 'content-type', 'application/json' );
	res.send(200, JSON.stringify( {
		version: pkgjson.version
	} ) );
} );

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
