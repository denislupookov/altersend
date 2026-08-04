package expo.modules.transferservice

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build

class TransferNotification(private val context: Context) {
  fun ensureChannel(channelName: String) {
    val manager = context.getSystemService(NotificationManager::class.java) ?: return
    val channel = NotificationChannel(
      CHANNEL_ID,
      channelName.ifEmpty { CHANNEL_ID },
      NotificationManager.IMPORTANCE_LOW
    ).apply {
      setShowBadge(false)
      enableVibration(false)
      enableLights(false)
      lockscreenVisibility = Notification.VISIBILITY_PRIVATE
    }
    manager.createNotificationChannel(channel)
  }

  fun build(title: String, text: String, subText: String, progress: Int): Notification {
    val builder = Notification.Builder(context, CHANNEL_ID)
      .setContentTitle(title)
      .setContentText(text)
      .setSmallIcon(R.drawable.ic_transfer_notification)
      .setCategory(Notification.CATEGORY_PROGRESS)
      .setOngoing(true)
      .setOnlyAlertOnce(true)
      .setShowWhen(false)

    if (progress in 0..100) {
      builder.setProgress(100, progress, false)
    } else {
      builder.setProgress(0, 0, true)
    }

    if (subText.isNotEmpty()) builder.setSubText(subText)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      builder.setForegroundServiceBehavior(Notification.FOREGROUND_SERVICE_IMMEDIATE)
    }
    launchIntent()?.let { builder.setContentIntent(it) }

    return builder.build()
  }

  fun buildCompleted(title: String, text: String): Notification {
    val builder = Notification.Builder(context, CHANNEL_ID)
      .setContentTitle(title)
      .setSmallIcon(R.drawable.ic_transfer_notification)
      .setCategory(Notification.CATEGORY_STATUS)
      .setAutoCancel(true)
      .setOnlyAlertOnce(true)

    if (text.isNotEmpty()) builder.setContentText(text)
    launchIntent()?.let { builder.setContentIntent(it) }

    return builder.build()
  }

  private fun launchIntent(): PendingIntent? {
    cachedLaunchIntent?.let { return it }

    val intent = context.packageManager.getLaunchIntentForPackage(context.packageName) ?: return null
    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)

    val pending = PendingIntent.getActivity(
      context,
      0,
      intent,
      PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
    )
    cachedLaunchIntent = pending
    return pending
  }

  companion object {
    const val CHANNEL_ID = "altersend.transfer"
    const val NOTIFICATION_ID = 8341
    const val COMPLETED_ID_BASE = 8400

    @Volatile
    private var cachedLaunchIntent: PendingIntent? = null
  }
}
