'use strict';

export default {
  ActionTypes: {
    Receive: {
      RESOURCE: 21,
      DONE: 22,
      DENIED: 23
    },
    Send: {
      CONNECT: 0,
      // Clients calls to subsrcibe to a specific resource. Respond with current data and inform of any data changes.
      SUBSCRIBE: 10,
      // Client calls to unsubscribe from a specific resource.
      UNSUBSCRIBE: 11,
      // Client calls to change properties of a specific resource. Modify and broadcast new values. Provide answer to client with DONE or DENIED.
      UPDATE: 12,
      // Clients calls to subsrcibe to the logs (activity) of a specific resource.
      SUBSCRIBE_LOG: 13,
      // Client calls to unsubscribe from the logs (activity) of a specific resource.
      UNSUBSCRIBE_LOG: 14,
      GET: 15
    }
  }
};
