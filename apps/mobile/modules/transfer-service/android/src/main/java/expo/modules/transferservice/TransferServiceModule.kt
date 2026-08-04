package expo.modules.transferservice

import android.annotation.SuppressLint
import android.app.Notification
import android.content.Context
import android.content.Intent
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class TransferServiceModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("TransferService")

    Events(EVENT_STOPPED)

    OnCreate {
      TransferForegroundService.onStopped = { sendEvent(EVENT_STOPPED, mapOf<String, Any>()) }
    }

    OnDestroy {
      TransferForegroundService.onStopped = null
    }

    AsyncFunction("start") { content: TransferNotificationContent, channelName: String ->
      val context = requireContext()
      val intent = Intent(context, TransferForegroundService::class.java).apply {
        putExtra(TransferForegroundService.EXTRA_TITLE, content.title)
        putExtra(TransferForegroundService.EXTRA_TEXT, content.text)
        putExtra(TransferForegroundService.EXTRA_SUBTEXT, content.subText)
        putExtra(TransferForegroundService.EXTRA_PROGRESS, content.progress)
        putExtra(TransferForegroundService.EXTRA_CHANNEL_NAME, channelName)
      }
      ContextCompat.startForegroundService(context, intent)
    }

    AsyncFunction("update") { content: TransferNotificationContent ->
      val context = requireContext()
      if (TransferForegroundService.isRunning) {
        TransferForegroundService.keepAlive()
        post(context, content)
      }
    }

    AsyncFunction("notifyCompleted") { title: String, text: String, channelName: String ->
      val context = requireContext()
      val manager = NotificationManagerCompat.from(context)
      if (manager.areNotificationsEnabled()) {
        val notifications = TransferNotification(context)
        notifications.ensureChannel(channelName)
        postCompleted(manager, notifications.buildCompleted(title, text))
      }
    }

    AsyncFunction("setTransferring") { transferring: Boolean ->
      TransferForegroundService.setTransferring(transferring)
    }

    AsyncFunction("stop") {
      val context = requireContext()
      context.stopService(Intent(context, TransferForegroundService::class.java))
      NotificationManagerCompat.from(context).cancel(TransferNotification.NOTIFICATION_ID)
    }
  }

  private fun requireContext(): Context =
    appContext.reactContext ?: throw Exceptions.ReactContextLost()

  @SuppressLint("MissingPermission")
  private fun post(context: Context, content: TransferNotificationContent) {
    val manager = NotificationManagerCompat.from(context)
    if (!manager.areNotificationsEnabled()) return
    manager.notify(
      TransferNotification.NOTIFICATION_ID,
      TransferNotification(context).build(content.title, content.text, content.subText, content.progress)
    )
  }

  @SuppressLint("MissingPermission")
  private fun postCompleted(manager: NotificationManagerCompat, notification: Notification) {
    manager.notify(TransferNotification.COMPLETED_ID_BASE + completedCount++, notification)
  }

  private var completedCount = 0

  private companion object {
    const val EVENT_STOPPED = "onStopped"
  }
}
