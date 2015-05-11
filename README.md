# ah-hipchat-server-plugin

This plugin adds a "hipchat" server, allowing you to communicate with [actionhero](http://actionherojs.com) from your hipchat chat client! 

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

## Regexp matchers

Somtimes you want to match the plain text content of an incomming message to map to an action, rather than relying on `/` commands.  You can append a new property to your actions, `action.matchers = []` which contains a collection of regexps which will attempt to be matched to call this action. So, if you wanted to match "ship it" to show a random image, your action would look likt:

```javascript
exports.action = {
  name:                   'shipit',
  description:            'shipit',
  blockedConnectionTypes: [],
  outputExample:          {},
  matchExtensionMimeType: false,
  version:                1.0,
  toDocument:             true,
  middleware:             [],
  matchers: [
    'ship it',
    'shipit',
    'SHIP IT',
    'SHIPIT'
  ],

  inputs: {},

  run: function(api, data, next){
    var images = [
      "https://img.skitch.com/20111026-r2wsngtu4jftwxmsytdke6arwd.png",
      "http://images.cheezburger.com/completestore/2011/11/2/aa83c0c4-2123-4bd3-8097-966c9461b30c.jpg",
      "http://images.cheezburger.com/completestore/2011/11/2/46e81db3-bead-4e2e-a157-8edd0339192f.jpg",
      "http://28.media.tumblr.com/tumblr_lybw63nzPp1r5bvcto1_500.jpg",
      "http://i.imgur.com/DPVM1.png",
      "http://gifs.gifbin.com/092010/1285616410_ship-launch-floods-street.gif",
      "http://d2f8dzk2mhcqts.cloudfront.net/0772_PEW_Roundup/09_Squirrel.jpg",
      "http://www.cybersalt.org/images/funnypictures/s/supersquirrel.jpg",
      "http://www.zmescience.com/wp-content/uploads/2010/09/squirrel.jpg",
      "http://img70.imageshack.us/img70/4853/cutesquirrels27rn9.jpg",
      "http://img70.imageshack.us/img70/9615/cutesquirrels15ac7.jpg",
      "http://1.bp.blogspot.com/_v0neUj-VDa4/TFBEbqFQcII/AAAAAAAAFBU/E8kPNmF1h1E/s640/squirrelbacca-thumb.jpg",
      "https://dl.dropboxusercontent.com/u/602885/github/soldier-squirrel.jpg",
      "https://dl.dropboxusercontent.com/u/602885/github/squirrelmobster.jpeg"
    ];

    data.response.message = images[Math.floor(Math.random()*images.length)];

    next();
  }
};
```

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

- figure out how to get "online" presence right within hipchat
- work in private chats
