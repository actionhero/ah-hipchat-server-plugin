exports.default = {
  servers: {
    hipchat: function(api){
      return {
        enabled:   true,
        delimiter: '/',
        breaker:   '=',
        jid:       'xxx' || process.env.HIPCHAT_JID,
        password:  'xxx' || process.env.HIPCHAT_PASSWORD,
        nickname:  'xxx' || process.env.HIPCHAT_NICKNAME,
      };
    }
  }
};