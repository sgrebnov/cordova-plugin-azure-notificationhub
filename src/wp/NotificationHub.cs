/*
* Licensed under the Apache License, Version 2.0 (the "License")
* http://www.apache.org/licenses/LICENSE-2.0
*
* Copyright © Microsoft Open Technologies, Inc.
* All Rights Reserved
*/

using System;
using System.Diagnostics;
using System.Runtime.Serialization;
using System.Collections.Generic;
using System.Text;
using System.Threading;
using System.Windows;
using Microsoft.Phone.Controls;
using Microsoft.Phone.Notification;
using WPCordovaClassLib;
using WPCordovaClassLib.Cordova;
using WPCordovaClassLib.Cordova.Commands;
using WPCordovaClassLib.Cordova.JSON;

namespace Cordova.Extension.Commands
{
    /// <summary>
    /// Apache Cordova plugin for Windows Azure Notification Hub
    /// </summary>
    public class NotificationHub : BaseCommand
    {
        private const string PluginChannelId = "cordova.notificationhub.plugin";
        private string pushNotificationCallback = null;

        /// <summary>
        /// Asynchronously registers the device for native notifications.
        /// </summary>
        /// <param name="options"></param>
        public void registerApplication(string options)
        {
            try
            {
                var args = JsonHelper.Deserialize<List<string>>(options);

                var notificationHubPath = args[0];
                var connectionString = args[1];
                this.pushNotificationCallback = args[2];

                if (string.IsNullOrEmpty(notificationHubPath))
                {
                    DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, "notificationHubPath can't be null or empty"));
                    return;
                }

                if (string.IsNullOrEmpty(connectionString))
                {
                    DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, "connectionString can't be null or empty"));
                    return;
                }

                if (string.IsNullOrEmpty(pushNotificationCallback))
                {
                    DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, "pushNotificationCallback can't be null or empty"));
                    return;
                }

                var channel = HttpNotificationChannel.Find(PluginChannelId);
                if (channel == null)
                {
                    channel = new HttpNotificationChannel(PluginChannelId);
                    channel.ChannelUriUpdated += (o, res) => CompleteApplicationRegistration(res.ChannelUri.ToString(), notificationHubPath, connectionString);
                    channel.Open();
                    channel.BindToShellToast();
                }
                else
                {
                    CompleteApplicationRegistration(channel.ChannelUri.ToString(), notificationHubPath, connectionString);
                }

                channel.ShellToastNotificationReceived += PushChannel_ShellToastNotificationReceived;
                
            }
            catch (Exception ex)
            {
                DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, ex.Message));
            }
        }

        /// <summary>
        /// Asynchronously unregisters the native registration on the application or secondary tiles.
        /// </summary>
        /// <param name="options"></param>
        public async void unregisterApplication(string options)
        {
            try
            {
                var args = JsonHelper.Deserialize<List<string>>(options);

                var notificationHubPath = args[0];
                var connectionString = args[1];

                if (string.IsNullOrEmpty(notificationHubPath))
                {
                    DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, "notificationHubPath can't be null or empty"));
                    return;
                }

                if (string.IsNullOrEmpty(connectionString))
                {
                    DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, "connectionString can't be null or empty"));
                    return;
                }

                var hub = new Microsoft.WindowsAzure.Messaging.NotificationHub(notificationHubPath, connectionString);
                await hub.UnregisterNativeAsync();

                DispatchCommandResult(new PluginResult(PluginResult.Status.OK));
            }
            catch (Exception ex)
            {
                DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, ex.Message));
            }
        }

        private async void CompleteApplicationRegistration(string channelUri, string notificationHubPath, string connectionString)
        {
            try
            {
                var hub = new Microsoft.WindowsAzure.Messaging.NotificationHub(notificationHubPath, connectionString);
                var registration = await hub.RegisterNativeAsync(channelUri);
                
                var regInfo = new RegisterResult();
                regInfo.RegistrationId = registration.RegistrationId;
                regInfo.ChannelUri = registration.ChannelUri;
                regInfo.NotificationHubPath = registration.NotificationHubPath;

                DispatchCommandResult(new PluginResult(PluginResult.Status.OK, regInfo));
            }
            catch (Exception ex)
            {
                DispatchCommandResult(new PluginResult(PluginResult.Status.ERROR, ex.Message));
            }
        }

        void PushChannel_ShellToastNotificationReceived(object sender, NotificationEventArgs e)
        {
            
            // if there is no js handler
            if (this.pushNotificationCallback == null) return;

            StringBuilder message = new StringBuilder();
            string relativeUri = string.Empty;

            Toast toast = new Toast();
            toast.Title = e.Collection["wp:Text1"];
            toast.Subtitle = e.Collection["wp:Text2"];
            PluginResult result = new PluginResult(PluginResult.Status.OK, toast);

            Deployment.Current.Dispatcher.BeginInvoke(() =>
            {
                PhoneApplicationFrame frame = Application.Current.RootVisual as PhoneApplicationFrame;
                if (frame != null)
                {
                    PhoneApplicationPage page = frame.Content as PhoneApplicationPage;
                    if (page != null)
                    {
                        //CordovaView cView = page.FindName("PGView") as CordovaView;
                        CordovaView cView = page.FindName("CordovaView") as CordovaView;
                        if (cView != null)
                        {
                            cView.Browser.Dispatcher.BeginInvoke((ThreadStart)delegate()
                            {
                                try
                                {
                                    cView.Browser.InvokeScript("execScript", this.pushNotificationCallback + "(" + result.Message + ")");
                                }
                                catch (Exception ex)
                                {
                                    Debug.WriteLine("ERROR: Exception in InvokeScriptCallback :: " + ex.Message);
                                }

                            });
                        }
                    }
                }
            });
        }

        [DataContract]
        public class RegisterResult
        {
            [DataMember(Name = "registrationId", IsRequired = true)]
            public string RegistrationId { get; set; }

            [DataMember(Name = "channelUri", IsRequired = true)]
            public string ChannelUri { get; set; }

            [DataMember(Name = "notificationHubPath", IsRequired = true)]
            public string NotificationHubPath { get; set; }
        }

        [DataContract]
        public class Toast
        {
            [DataMember(Name = "text1", IsRequired = false)]
            public string Title { get; set; }

            [DataMember(Name = "text2", IsRequired = false)]
            public string Subtitle { get; set; }
        }
    }
}