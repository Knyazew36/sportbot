package expo.modules.workoutlive

import org.json.JSONObject

/**
 * Что показать в уведомлении. Тексты собирает приложение (src/widgets/workout-live/model/live-props.ts),
 * здесь только фаза и время: их сервис меняет сам, когда JS спит — конец отдыха и кнопки уведомления
 */
internal data class WorkoutLiveState(
  val workoutId: Int,
  val startedAt: Long,
  val url: String,
  val title: String,
  val exercise: String,
  val step: String,
  val target: String,
  val phase: String,
  val label: String,
  val from: Long,
  val to: Long?,
  val pausedAt: Long?,
  val clock: String,
  val setsDone: Int,
  val setsTotal: Int,
  val segments: List<Int>
) {
  val resting get() = phase == PHASE_REST || phase == PHASE_REST_OVER

  /** Отсчёт отдыха идёт (не на паузе и время не вышло) */
  val restRunning get() = phase == PHASE_REST && pausedAt == null && to != null

  /** Кнопки: прибавить можно только идущему отдыху, пропустить — любому */
  val canAdd get() = restRunning || phase == PHASE_REST_OVER
  val canSkip get() = resting

  /** Время отдыха вышло: дальше счёт вверх от конца отдыха, как на экране тренировки */
  fun restOver() = copy(phase = PHASE_REST_OVER, label = "Пора к подходу", from = to ?: from, to = null, pausedAt = null)

  /** Как timer.add в приложении: от конца отдыха или от «сейчас», если время уже вышло */
  fun addRest(seconds: Int, now: Long): WorkoutLiveState {
    val endsAt = maxOf(to ?: now, now) + seconds * 1000L
    return copy(phase = PHASE_REST, label = "Отдых", to = endsAt, pausedAt = null)
  }

  /** Отдых закончен: тренировка идёт дальше, счёт от её начала */
  fun skipRest() = copy(phase = PHASE_WORKOUT, label = "Тренировка идёт", from = startedAt, to = null, pausedAt = null)

  companion object {
    const val PHASE_REST = "rest"
    const val PHASE_REST_OVER = "restOver"
    const val PHASE_WORKOUT = "workout"

    fun fromJson(raw: String): WorkoutLiveState {
      val json = JSONObject(raw)
      val segments = json.optJSONArray("segments")
      return WorkoutLiveState(
        workoutId = json.getInt("workoutId"),
        startedAt = json.getLong("startedAt"),
        url = json.getString("url"),
        title = json.getString("title"),
        exercise = json.getString("exercise"),
        step = json.optString("step"),
        target = json.optString("target"),
        phase = json.getString("phase"),
        label = json.getString("label"),
        from = json.getLong("from"),
        to = json.optLongOrNull("to"),
        pausedAt = json.optLongOrNull("pausedAt"),
        clock = json.optString("clock"),
        setsDone = json.optInt("setsDone"),
        setsTotal = json.optInt("setsTotal"),
        segments = if (segments == null) emptyList() else List(segments.length()) { segments.getInt(it) }
      )
    }

    private fun JSONObject.optLongOrNull(key: String) = if (isNull(key)) null else getLong(key)
  }
}
