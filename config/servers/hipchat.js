exports.default = {
  servers: {
    hipchat: function(api){
      return {
        enabled:   true,
        delimiter: '/',
        breaker:   '=',
        jid:       process.env.HIPCHAT_JID,
        password:  process.env.HIPCHAT_PASSWORD,
        nickname:  process.env.HIPCHAT_NICKNAME,
      };
    }
  }
};