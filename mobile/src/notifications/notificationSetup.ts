import * as Notifications from "expo-notifications";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,//how notifications look when received while app is actively open
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

//shared permission check used by both leave-soon and coursework reminder notifications
export async function checkNotifPerms(): Promise<boolean> {
  const settings = await Notifications.getPermissionsAsync();

  if (
    settings.granted || settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL//allow if fully granted or prov
  ) {
    return true;
  }

  const req = await Notifications.requestPermissionsAsync();
  return !!req.granted;
}
