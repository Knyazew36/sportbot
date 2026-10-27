package expo.modules.workoutlive

import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import android.util.Log

/**
 * Держит процесс живым, пока идёт тренировка: без него система убивает приложение на отдыхе,
 * и уведомление застывает. Само уведомление собирает WorkoutLiveController
 */
class WorkoutLiveService : Service() {
  override fun onCreate() {
    super.onCreate()
    running = true
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    val notification = WorkoutLiveController.build(this)
    if (notification == null) {
      stopSelf()
      return START_NOT_STICKY
    }
    try {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
        startForeground(WorkoutLiveController.NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE)
      } else {
        startForeground(WorkoutLiveController.NOTIFICATION_ID, notification)
      }
    } catch (error: RuntimeException) {
      Log.w(TAG, "Сервис не стал foreground, уведомление без него: ${error.message}")
      stopSelf()
      WorkoutLiveController.notify(this)
    }
    // После убийства процесса тренировку не восстанавливаем: состояние живёт в приложении
    return START_NOT_STICKY
  }

  override fun onDestroy() {
    running = false
    super.onDestroy()
  }

  override fun onBind(intent: Intent?): IBinder? = null

  companion object {
    private const val TAG = "WorkoutLive"

    @Volatile
    var running = false
      private set

    fun start(context: Context) {
      val intent = Intent(context, WorkoutLiveService::class.java)
      try {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) context.startForegroundService(intent)
        else context.startService(intent)
      } catch (error: RuntimeException) {
        // Android 12+ не даёт запустить foreground service из фона: показываем уведомление без сервиса
        Log.w(TAG, "Сервис не запущен: ${error.message}")
        WorkoutLiveController.notify(context)
      }
    }

    fun stop(context: Context) {
      context.stopService(Intent(context, WorkoutLiveService::class.java))
    }
  }
}
