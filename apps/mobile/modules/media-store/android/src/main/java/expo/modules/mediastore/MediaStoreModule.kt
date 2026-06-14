package expo.modules.mediastore

import android.content.ContentValues
import android.content.Intent
import android.net.Uri
import android.os.Environment
import android.provider.MediaStore
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File

private const val COPY_BUFFER_SIZE = 1024 * 1024

class MediaStoreModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("MediaStore")

    // Streams a private file into the public Downloads collection and deletes the source.
    AsyncFunction("saveToDownloads") { srcPath: String, fileName: String, mimeType: String ->
      val context = appContext.reactContext ?: throw Exceptions.ReactContextLost()
      val resolver = context.contentResolver

      val srcFilePath = if (srcPath.startsWith("file://")) Uri.parse(srcPath).path ?: srcPath else srcPath
      val src = File(srcFilePath)
      if (!src.exists()) throw IllegalArgumentException("Source file does not exist: $srcPath")

      val pending = ContentValues().apply {
        put(MediaStore.Downloads.DISPLAY_NAME, fileName)
        if (mimeType.isNotEmpty()) put(MediaStore.Downloads.MIME_TYPE, mimeType)
        put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS)
        put(MediaStore.Downloads.IS_PENDING, 1)
      }

      val collection = MediaStore.Downloads.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY)
      val itemUri = resolver.insert(collection, pending)
        ?: throw IllegalStateException("Failed to create Downloads entry for $fileName")

      try {
        resolver.openOutputStream(itemUri).use { output ->
          output ?: throw IllegalStateException("Failed to open Downloads output stream")
          src.inputStream().use { input -> input.copyTo(output, COPY_BUFFER_SIZE) }
        }
      } catch (e: Exception) {
        resolver.delete(itemUri, null, null)
        throw e
      }

      val finalized = resolver.update(
        itemUri,
        ContentValues().apply { put(MediaStore.Downloads.IS_PENDING, 0) },
        null,
        null
      )
      if (finalized == 0) {
        resolver.delete(itemUri, null, null)
        throw IllegalStateException("Failed to finalize Downloads entry for $fileName")
      }
      src.delete()

      itemUri.toString()
    }

    // Opens a saved Downloads item in an external viewer via ACTION_VIEW.
    AsyncFunction("openDownload") { contentUri: String, mimeType: String ->
      val context = appContext.reactContext ?: throw Exceptions.ReactContextLost()
      val intent = Intent(Intent.ACTION_VIEW).apply {
        setDataAndType(Uri.parse(contentUri), mimeType.ifEmpty { "*/*" })
        addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      }
      context.startActivity(Intent.createChooser(intent, null).apply {
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      })
    }

    // Opens the system Downloads UI.
    AsyncFunction("openDownloadsFolder") {
      val context = appContext.reactContext ?: throw Exceptions.ReactContextLost()
      val intent = Intent(android.app.DownloadManager.ACTION_VIEW_DOWNLOADS).apply {
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      }
      context.startActivity(intent)
    }
  }
}
