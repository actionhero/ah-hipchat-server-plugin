exports.action = {
  name:                   'ping',
  description:            'ping',
  blockedConnectionTypes: [],
  outputExample:          {},
  matchExtensionMimeType: false,
  version:                1.0,
  toDocument:             true,
  middleware:             [],

  inputs: {
    words:  { required: true },
  },

  run: function(api, data, next){
    data.response.message = 'pong ' + data.params.words.join(' ');
    next();
  }
};