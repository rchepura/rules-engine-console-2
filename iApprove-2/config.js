
var config = {

    /*
     * The root path
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
    , apiHost: '52.87.73.108' // STAGE
//    , apiHost: '52.86.57.144' // PROD
    
    /*
     * The API Port
     */
    , apiPort: '8443'

    /*
     * The Auth data
     */
   , loginPath: '/com.magnet.server/user/session'
   , MMS_DEVICE_ID: '1111-2222-3333-4445'
   , client_id: 'bfb45779-c1a8-4e7a-80dc-756be9040a5e'
   , apiUsername: 'manager'
   , apiPass: 'macmagnet'

};

module.exports = config;