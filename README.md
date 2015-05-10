# ah-hipchat-plugin

This plugin adds a "hipchat" server, allowing you to communicate with actionhero from your hipchat chat client! 

This is inteded to show how simple it is to use actionhero as a hubot replacement.

You can run actions from any room that the bot is connected to.

## Actions

When crafing actions which use the hipchat server, there are a few things to keep in mind:

### Config

Copy `config/servers/hipchat.js` into your own project.  Create a hipchat user you want this server to conncet as (the bot user).  Visit https://www.hipchat.com/account/xmpp to learn the jabber conncetion information for this user.

In order to tell which messages in rooms are meant to be actions, we need to set a 'delimiter'.  The first word in the message needs to start with this charecter, and then will become the action.  So if you have a delimiter of `/` and you said the stanza `/myAction 123 abc`, the action `myAction` would be invoked.


### Params

- The params you get from the server are `action`, `words`, `room` and `from`.  So a stanza like `/ping hello bot` would produce the params:

```
{
  action: 'ping',
  room:   '12345_the_room',
  from:   'evan',
  words:  ['hello', 'bot'],
}
```

- You can send key-value pairs as well.  You can set the `breaker` for key-value pairs (which defaults to '=') in the config. So a stanza like `/ping thing=stuff` would produce:

```javascript
{
  action: 'ping',
  room:   '12345_the_room',
  from:   'evan',
  words:  ['thing=stuff']
  thing:  'stuff',
}
```

An example action, `ping`, is provided to test this out.

## Security

You can be sure that any actions coming in via the hipchat server are from users truly logged into your company's hipchat account.  That said, remmeber that you can access actions via other methods (http, websocket, etc) in actionhero.  Be sure to add a layer of authentication if you expect to user your actionhero server for more than just hipchat.  

One simple thing to do is add an authentication middleware (which your actions can opt into) which checks for the method of connection:

```javascript
// From initializaers/auth.js

module.exports = {
  initialize: function(api, next){

    var authMiddleware = {
      name: 'authMiddleware',
      global: false,
      preProcessor: function(data, next){
        if( data.connection.type === 'hipchat' ){
          next(); // OK
        }else{
          next( new Error('GO AWAY.  NOT FOR YOU.') );
        }
      }
    };

    api.actions.addMiddleware(authMiddleware);

    next();
  },
};
```

## TODO:

- load the of rooms to join dynamicallt
- figure out how to get "online" presence right within hipchat
- reconnecting & server rebooting
- work in private chats