package expo.modules.transferservice

import android.app.Service
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.os.PowerManager
import android.util.Log

private const val LOG_TAG = "TransferService"
private const val WAKE_LOCK_TAG = "AlterSend:transfer"
private const val WAKE_LOCK_TIMEOUT_MS = 6L * 60 * 60 * 1000
private const val IDLE_TIMEOUT_MS = 15L * 60 * 1000
private const val TRANSFERRING_TIMEOUT_MS = 60L * 60 * 1000

class TransferForegroundService : Service() {
  private var wakeLock: PowerManager.WakeLock? = null
  private val watchdog = Handler(Looper.getMainLooper())
  private val stopWhenIdle = Runnable { stopSelf() }

  override fun onBind(intent: Intent?): IBinder? = null

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    val notifications = TransferNotification(this)
    notifications.ensureChannel(intent?.getStringExtra(EXTRA_CHANNEL_NAME).orEmpty())

    val notification = notifications.build(
      intent?.getStringExtra(EXTRA_TITLE).orEmpty(),
      intent?.getStringExtra(EXTRA_TEXT).orEmpty(),
      intent?.getStringExtra(EXTRA_SUBTEXT).orEmpty(),
      intent?.getIntExtra(EXTRA_PROGRESS, INDETERMINATE_PROGRESS) ?: INDETERMINATE_PROGRESS
    )

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
      startForeground(
        TransferNotification.NOTIFICATION_ID,
        notification,
        ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC
      )
    } else {
      startForeground(TransferNotification.NOTIFICATION_ID, notification)
    }

    instance = this
    isRunning = true
    if (pendingTransferring) acquireWakeLock()
    armStop(livenessTimeout())
    return START_NOT_STICKY
  }

  private fun armStop(delayMs: Long) {
    watchdog.post {
      watchdog.removeCallbacks(stopWhenIdle)
      watchdog.postDelayed(stopWhenIdle, delayMs)
    }
  }

  override fun onTimeout(startId: Int, fgsType: Int) {
    stopSelf()
  }

  override fun onDestroy() {
    isRunning = false
    instance = null
    pendingTransferring = false
    watchdog.removeCallbacks(stopWhenIdle)
    releaseWakeLock()
    try {
      onStopped?.invoke()
    } catch (err: Exception) {
      Log.w(LOG_TAG, "failed to report service stop", err)
    }
    super.onDestroy()
  }

  private fun acquireWakeLock() {
    if (wakeLock?.isHeld == true) return
    val power = getSystemService(PowerManager::class.java) ?: return
    wakeLock = power.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, WAKE_LOCK_TAG).apply {
      setReferenceCounted(false)
      acquire(WAKE_LOCK_TIMEOUT_MS)
    }
  }

  private fun releaseWakeLock() {
    if (wakeLock?.isHeld == true) wakeLock?.release()
    wakeLock = null
  }

  companion object {
    const val EXTRA_TITLE = "title"
    const val EXTRA_TEXT = "text"
    const val EXTRA_SUBTEXT = "subText"
    const val EXTRA_PROGRESS = "progress"
    const val EXTRA_CHANNEL_NAME = "channelName"
    const val INDETERMINATE_PROGRESS = -1

    @Volatile
    var isRunning = false

    @Volatile
    var onStopped: (() -> Unit)? = null

    @Volatile
    private var instance: TransferForegroundService? = null

    @Volatile
    private var pendingTransferring = false

    private fun livenessTimeout(): Long =
      if (pendingTransferring) TRANSFERRING_TIMEOUT_MS else IDLE_TIMEOUT_MS

    fun setTransferring(transferring: Boolean) {
      pendingTransferring = transferring
      val service = instance ?: return
      if (transferring) service.acquireWakeLock() else service.releaseWakeLock()
      service.armStop(livenessTimeout())
    }

    fun keepAlive() {
      val service = instance ?: return
      service.armStop(livenessTimeout())
      if (pendingTransferring) service.acquireWakeLock()
    }
  }
}
