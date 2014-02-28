/*
* Licensed under the Apache License, Version 2.0 (the "License")
* http://www.apache.org/licenses/LICENSE-2.0
*
* Copyright © Microsoft Open Technologies, Inc.
* All Rights Reserved
*/

using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.WindowsAzure;
using Windows.Networking.PushNotifications;
using Windows.Foundation;
using System.Diagnostics;

namespace NotificationHubRuntimeProxy
{
    public sealed class HubApi
    {
        public IAsyncOperation<string> RegisterNativeAsync(string notificationHubPath, string connectionString, string channelUri)
        {
            return this.RegisterNativeAsyncInternal(notificationHubPath, connectionString, channelUri).AsAsyncOperation();
        }

        public async void UnregisterNativeAsync(string notificationHubPath, string connectionString)
        {
            var hub = new Microsoft.WindowsAzure.Messaging.NotificationHub(notificationHubPath, connectionString);

            await hub.UnregisterNativeAsync();
        }

        private async Task<string> RegisterNativeAsyncInternal(string notificationHubPath, string connectionString, string channelUri)
        {           
            // Create the notification hub
            var hub = new Microsoft.WindowsAzure.Messaging.NotificationHub(notificationHubPath, connectionString);

            // Register with the Notification Hub, passing the push channel uri and the string array of tags
            var registration = await hub.RegisterNativeAsync(channelUri);

            return registration.RegistrationId;
        }
    }
}
