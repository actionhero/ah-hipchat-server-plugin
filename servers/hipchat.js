var xmpp = require('node-xmpp');
var uuid = require('node-uuid');

var initialize = function(api, options, next){

  //////////
  // INIT //
  //////////

  var type = 'hipchat';

  var attributes = {
    canChat: true,
    logConnections: false,
    logExits: false,
    sendWelcomeMessage: false,
    verbs: []
  };

  var server = new api.genericServer(type, options, attributes);

  var delimiter = api.config.servers.hipchat.delimiter;
  var breaker   = api.config.servers.hipchat.breaker;

  var callbacks = {};

  //////////////////////
  // REQUIRED METHODS //
  //////////////////////

  server.start = function(next){

    server.rooms = [];

    server.xmpp = new xmpp.Client({
      jid: api.config.servers.hipchat.jid + '/bot',
      password: api.config.servers.hipchat.password,
    });

    server.xmpp.on('online', function(){
      clearTimeout(server.serverPresenseTimer);

      // send keepalive data or server will disconnect us after 150s of inactivity
      server.serverPresenseTimer = setInterval(function(){
        server.xmpp.send(' ');
      }, 10000);

      getRooms(function(error, rooms){
        server.rooms = rooms;

        server.xmpp.send(
          // TODO: "away" works, but "chat" for presence does not?
          new xmpp.Element('presence', { type: 'available' }).c('show').t('dnd')
        );

        server.rooms.forEach(function(r){
          server.xmpp.send(
            new xmpp.Element('presence', { to: r + '/' + api.config.servers.hipchat.nickname }).c('x', { xmlns: 'http://jabber.org/protocol/muc' })
          );
        });

        api.log("hipchat connected");

        next();
      });
    });

    server.xmpp.on('stanza', processStanxa);
  };

  server.stop = function(next){
    server.xmpp.connection.disconnect();
    next();
  };

  server.sendMessage = function(connection, message, messageCount){
    server.xmpp.send(
      new xmpp.Element('message', { to: connection.rawConnection.room, type: 'groupchat' }).c('body').t( String(message) )
    );
  };

  server.goodbye = function(){
    // Nothin'
  };

  /////////////
  // HELPERS //
  /////////////

  var getRooms = function(callback){
    var rooms = [];
    var req = new xmpp.Element('iq', {to: 'conf.hipchat.com', type: 'get'}).c('query',{xmlns: 'http://jabber.org/protocol/disco#items'});
    sendWithCallback(req, function(roomsStanza){
      var children = roomsStanza.getChild('query').getChildren('item');
      children.forEach(function(c){
        rooms.push(c.attrs.jid);
      });

      callback(null, rooms);
    });
  };

  var sendWithCallback = function(stanza, callback){
    var id = uuid.v4();
    stanza = stanza.root(); // work with base element
    stanza.attrs.id = id;
    callbacks[id] = callback;
    server.xmpp.send(stanza);
  };

  var processStanxa = function(stanza){
    if (stanza.attrs.type == 'error') {
      api.log('[hipchat error] ' + stanza, 'error');
      return;
    }

    // return any callbacks if requested
    if(stanza.attrs.id && callbacks[stanza.attrs.id] !== undefined ){
      callbacks[stanza.attrs.id](stanza);
      delete callbacks[stanza.attrs.id];
    }
   
    // ignore messages from myaelf
    server.rooms.forEach(function(r){
      if (stanza.attrs.from == r + '/' + api.config.servers.hipchat.nickname ) {
        return;
      }
    });

    // don't respond to private messages
    if (!stanza.is('message') || !stanza.attrs.type == 'groupchat') {
      return;
    }
   
    var body = stanza.getChild('body');
    if (!body) { return; }
    var message = body.getText();
    var room = stanza.attrs.from.split('/')[0];
    var from = stanza.attrs.from.split('/')[1];
    var payload = {message: message, room: room};

    server.buildConnection({
      rawConnection  : { 
        message: message,
        room: room,
        from: from,
      }, 
      remoteAddress  : 0,
      remotePort     : 0,
    });
  };

  var handleConnection = function(connection){
    connection.params.room = connection.rawConnection.room;
    connection.params.from = connection.rawConnection.from;

    var words = connection.rawConnection.message.split(' ');
    connection.params.words = words;

    // check for "/action"
    if(words[0].indexOf(delimiter) === 0){
      connection.params.action = words[0].substring(1);
      words.shift();
    }

    // check for action keywords
    if(!connection.params.action){
      for(var name in api.actions.actions){
        for(var version in api.actions.actions[name]){
          var a = api.actions.actions[name][version];
          if(a.matchers){
            a.matchers.forEach(function(m){
              if( connection.rawConnection.message.match(m) ){
                connection.params.action = name;
              }
            });
          }
        }
      }
    }
    
    // check for key/value mathers
    words.forEach(function(word){
      if(word.indexOf(breaker) >= 0){
        var parts = word.split(breaker);
        var key = parts.shift();
        connection.params[key] = parts.join(breaker);
      }
    });

    if(connection.params.action && connection.params.from !== api.config.servers.hipchat.nickname){
      server.processAction(connection);
    }else{
      connection.destroy();
    }
  };

  var prepareResponse = function(data){
    var msg = '';
    if(data.response.error){ data.response.error = String(data.response.error); }

    if(data.response.message){
      msg = data.response.message;
    }else{
      for(var key in data.response){
        msg += key + ': ' + data.response[key] + ' \r\n';
      }
    }

    data.connection.sendMessage(msg);
  };

  ////////////
  // EVENTS //
  ////////////

  server.on('connection', handleConnection);

  server.on('actionComplete', prepareResponse);

  next(server);
};

exports.initialize = initialize;
