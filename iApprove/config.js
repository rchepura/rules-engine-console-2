
var config = {
    
    /* 
     * The root path
     * for. ex. '/admin'
     */
    rootUrl: '/'

    /*
     * The API Protocol
     * 
     * Uncommented if different from Web Admin Console Protocol
     */
    , apiProtocol: 'http'
    
    /*
     * The API Host
     * 
     * Uncommented if different from Web Admin Console Host
     */
//    , apiHost: '54.151.253.234'
    , apiHost: '52.87.73.108' // MAC STAGE
    
    /*
     * The API Port
     */
    , apiPort: '8443'
    , apiBeamPort: '9898'

    /*
     * The Auth data
     */
   , loginPath: '/com.magnet.server/user/session'
    /*
     * The API Url
     */
   , apiUrl: 'http://54.151.253.234:8443/api'
   , MMS_DEVICE_ID: '1111-2222-3333-4445'
//   , client_id: '57b1d5a6-0e1b-48cd-9e87-4fac73950c1d'
   , client_id: 'bfb45779-c1a8-4e7a-80dc-756be9040a5e'
   
   
};

module.exports = config;
