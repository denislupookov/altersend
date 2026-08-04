package expo.modules.transferservice

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

class TransferNotificationContent : Record {
  @Field
  val title: String = ""

  @Field
  val text: String = ""

  @Field
  val subText: String = ""

  @Field
  val progress: Int = TransferForegroundService.INDETERMINATE_PROGRESS
}
