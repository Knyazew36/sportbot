package expo.modules.workoutlive

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.graphics.drawable.Icon
import android.net.Uri
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.util.Log

/**
 * Уведомление идущей тренировки: одно на тренировку, живёт вместе с WorkoutLiveService.
 * Таймер тикает сам (хронометр системы), конец отдыха и кнопки меняют уведомление без JS
 */
internal object WorkoutLiveController {
  const val NOTIFICATION_ID = 7301
  const val ACTION_ADD = "expo.modules.workoutlive.ADD"
  const val ACTION_SKIP = "expo.modules.workoutlive.SKIP"

  private const val TAG = "WorkoutLive"
  private const val CHANNEL_ID = "workout-live"
  private const val ADD_SECONDS = 30
  // Notification.EXTRA_REQUEST_PROMOTED_ONGOING, литералом — константа тоже только с 36.1
  private const val EXTRA_REQUEST_PROMOTED_ONGOING = "android.requestPromotedOngoing"

  // Цвета живой полосы приложения (global.css: --color-live, --color-rest)
  private val LIVE = Color.parseColor("#d1ffca")
  private val REST = Color.parseColor("#ffdcae")
  // Live Update красить фоном нельзя, поэтому на белом нужны тёмные тона (--color-positive, --color-sb-gold)
  private val LIVE_ACCENT = Color.parseColor("#12893a")
  private val REST_ACCENT = Color.parseColor("#a8720a")

  private val handler = Handler(Looper.getMainLooper())
  private val restEnd = Runnable { onRestEnd() }
  @Volatile
  private var context: Context? = null

  // Пишется из потока модуля и receiver'а, читается сервисом в главном потоке
  @Volatile
  var state: WorkoutLiveState? = null
    private set

  @Synchronized
  fun show(context: Context, next: WorkoutLiveState) {
    this.context = context.applicationContext
    state = next
    ensureChannel(context)
    scheduleRestEnd(next)
    if (WorkoutLiveService.running) notify(context) else WorkoutLiveService.start(context)
  }

  @Synchronized
  fun hide(context: Context) {
    state = null
    handler.removeCallbacks(restEnd)
    WorkoutLiveService.stop(context)
    // Если сервис не дали запустить, уведомление висело само по себе
    context.getSystemService(NotificationManager::class.java).cancel(NOTIFICATION_ID)
  }

  /** Кнопка уведомления: сразу перерисовываем и оставляем нажатие приложению — его таймер отдыха в MMKV */
  @Synchronized
  fun onAction(context: Context, action: String?) {
    val current = state ?: return
    val now = System.currentTimeMillis()
    val (next, type) = when (action) {
      ACTION_ADD -> if (current.canAdd) current.addRest(ADD_SECONDS, now) to "add" else return
      ACTION_SKIP -> if (current.canSkip) current.skipRest() to "skip" else return
      else -> return
    }
    Log.d(TAG, "Кнопка «$type», workoutId=${current.workoutId}")
    WorkoutLiveActions.push(context, type, current.workoutId, now)
    show(context, next)
    WorkoutLiveModule.emitAction()
  }

  fun build(context: Context): Notification? = state?.let { build(context, it) }

  fun notify(context: Context) {
    val notification = build(context) ?: return
    try {
      context.getSystemService(NotificationManager::class.java).notify(NOTIFICATION_ID, notification)
    } catch (error: SecurityException) {
      // Нет разрешения на уведомления: тренировка идёт и без них
      Log.w(TAG, "Уведомление не показано: ${error.message}")
    }
  }

  // ── Конец отдыха ─────────────────────────────────────────────────────────

  private fun scheduleRestEnd(state: WorkoutLiveState) {
    handler.removeCallbacks(restEnd)
    val to = state.to ?: return
    if (!state.restRunning) return
    // При спящем процессоре Handler сработает при пробуждении экрана: до этого хронометр сам уйдёт в минус
    handler.postDelayed(restEnd, maxOf(0L, to - System.currentTimeMillis()))
  }

  @Synchronized
  private fun onRestEnd() {
    val current = state ?: return
    val context = context ?: return
    val to = current.to ?: return
    if (!current.restRunning) return
    if (to > System.currentTimeMillis()) return scheduleRestEnd(current)
    state = current.restOver()
    notify(context)
  }

  // ── Сборка ──────────────────────────────────────────────────────────────

  private fun build(context: Context, state: WorkoutLiveState): Notification {
    val builder =
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) Notification.Builder(context, CHANNEL_ID)
      else @Suppress("DEPRECATION") Notification.Builder(context)

    val headline = listOf(state.exercise, state.step).filter { it.isNotEmpty() }.joinToString(" · ")
    // На отдыхе показываем, что будет после него
    val title = if (state.resting) "Дальше: $headline" else headline
    val paused = state.pausedAt != null
    val detail = listOf(if (paused) state.clock else "", state.target).filter { it.isNotEmpty() }.joinToString(" · ")

    builder
      .setSmallIcon(R.drawable.workout_live_icon)
      .setContentTitle(title)
      .setSubText(state.label)
      .setOngoing(true)
      .setOnlyAlertOnce(true)
      .setVisibility(Notification.VISIBILITY_PUBLIC)
      .setCategory(Notification.CATEGORY_PROGRESS)
      .setContentIntent(openApp(context, state.url))
    if (detail.isNotEmpty()) builder.setContentText(detail)

    // Хронометр системы тикает сам: обратный отсчёт до конца отдыха или вверх от начала
    if (paused) {
      builder.setShowWhen(false).setUsesChronometer(false)
    } else {
      builder.setShowWhen(true).setUsesChronometer(true)
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) builder.setChronometerCountDown(state.to != null)
      builder.setWhen(state.to ?: state.from)
    }

    if (state.canAdd) builder.addAction(action(context, ACTION_ADD, "+$ADD_SECONDS с"))
    if (state.canSkip) builder.addAction(action(context, ACTION_SKIP, "Пропустить"))

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.BAKLAVA) liveUpdate(builder, state)
    else colorized(builder, state)

    return builder.build()
  }

  /** Android 16: Live Update — прогресс по подходам сегментами упражнений, чип в статус-баре */
  private fun liveUpdate(builder: Notification.Builder, state: WorkoutLiveState) {
    val accent = if (state.resting) REST_ACCENT else LIVE_ACCENT
    val segments = state.segments.filter { it > 0 }.ifEmpty { listOf(maxOf(state.setsTotal, 1)) }
    val style = Notification.ProgressStyle()
      .setStyledByProgress(true)
      .setProgressSegments(segments.map { Notification.ProgressStyle.Segment(it).setColor(accent) })
      .setProgress(state.setsDone.coerceIn(0, segments.sum()))
    builder
      .setStyle(style)
      .setColor(accent)
    // setRequestPromotedOngoing есть только с 36.1, на 36.0 падает NoSuchMethodError — extra понимают обе версии
    builder.extras.putBoolean(EXTRA_REQUEST_PROMOTED_ONGOING, true)
  }

  /** До Android 16: цветное уведомление (работает только у foreground service) и обычная полоса */
  private fun colorized(builder: Notification.Builder, state: WorkoutLiveState) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      builder.setColor(if (state.resting) REST else LIVE).setColorized(true)
    }
    if (state.setsTotal > 0) builder.setProgress(state.setsTotal, state.setsDone.coerceIn(0, state.setsTotal), false)
  }

  private fun openApp(context: Context, url: String): PendingIntent {
    val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
      .setPackage(context.packageName)
      .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    return PendingIntent.getActivity(
      context,
      0,
      intent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )
  }

  private fun action(context: Context, name: String, title: String): Notification.Action {
    val intent = Intent(context, WorkoutLiveActionReceiver::class.java).setAction(name)
    val pending = PendingIntent.getBroadcast(
      context,
      name.hashCode(),
      intent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )
    return Notification.Action.Builder(null as Icon?, title, pending).build()
  }

  private fun ensureChannel(context: Context) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
    val manager = context.getSystemService(NotificationManager::class.java)
    if (manager.getNotificationChannel(CHANNEL_ID) != null) return
    // Тихий канал: уведомление обновляется на каждом подходе и не должно звенеть
    val channel = NotificationChannel(CHANNEL_ID, "Идущая тренировка", NotificationManager.IMPORTANCE_LOW).apply {
      description = "Упражнение, подход и отдых на экране блокировки"
      lockscreenVisibility = Notification.VISIBILITY_PUBLIC
      setShowBadge(false)
      enableVibration(false)
      setSound(null, null)
    }
    manager.createNotificationChannel(channel)
  }
}
