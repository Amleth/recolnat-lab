/**
 * WebSocket action ids. The values here must replicate exactly those expected by the WebSocket.
 */
'use strict';

export default {
  ActionTypes: {
    // Types received by the HMI from the WebSocket
    Receive: {
      // Message contains a resource
      RESOURCE: 21,
      // Action has been accepted by server. This may contain the original message sent by HMI to Socket. This may contain additional information provided by Socket (such as UIDs of newly-created elements)
      DONE: 22,
      // Action has been rejected by server.
      DENIED: 23
    },
    // Types to be sent to the Socket
    Send: {
      // Not used, just here for comprehensiveness
      CONNECT: 0,
      // Subscribe to the resource designated by the provided UID
      SUBSCRIBE: 10,
      // Unsubscribe this client from resource designated by the provided UID.
      UNSUBSCRIBE: 11,
      // Any action which could lead to changes in the database (creation, modification, deletion)
      UPDATE: 12,
      // Subsrcibe to the logs (activity) of a specific resource (not used).
      SUBSCRIBE_LOG: 13,
      // Unsubscribe from the logs (activity) of a specific resource (not used).
      UNSUBSCRIBE_LOG: 14,
      // Retrieve specific information about a resource which is computed server-side (for example a list of all tags)
      GET: 15,
      // User sends a feedback message about the application. This would be better if recoded as a REST service.
      FEEDBACK: 16,
      // User orders for some action to be started on server. Expected response is a confirmation that the order has been received. No information is expected when the order finishes. Example : prepare Set for export.
      ORDER: 17
    }
  }
};
