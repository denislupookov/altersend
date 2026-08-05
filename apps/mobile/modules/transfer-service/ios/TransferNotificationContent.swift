import ExpoModulesCore

struct TransferNotificationContent: Record {
  @Field var title: String = ""
  @Field var text: String = ""
  @Field var subText: String = ""
  @Field var progress: Int = -1
}
