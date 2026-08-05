import ExpoModulesCore

public class TransferTaskRegistrar: ExpoAppDelegateSubscriber {
  public func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    if #available(iOS 26.0, *) {
      ContinuedTransferTask.shared.register()
    }
    return true
  }
}
