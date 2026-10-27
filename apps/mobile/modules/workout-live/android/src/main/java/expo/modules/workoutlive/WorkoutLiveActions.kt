package expo.modules.workoutlive

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject

/**
 * Нажатия кнопок уведомления, которые приложение ещё не применило к своему таймеру отдыха.
 * Хранятся на диске: JS мог спать в момент нажатия, тогда заберёт их при следующем запуске
 */
internal object WorkoutLiveActions {
  private const val PREFS = "expo.modules.workoutlive"
  private const val KEY = "actions"

  @Synchronized
  fun push(context: Context, type: String, workoutId: Int, at: Long) {
    val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    val list = JSONArray(prefs.getString(KEY, null) ?: "[]")
    list.put(JSONObject().put("type", type).put("workoutId", workoutId).put("at", at))
    prefs.edit().putString(KEY, list.toString()).apply()
  }

  /** Отдаёт накопленные нажатия JSON-массивом и очищает очередь */
  @Synchronized
  fun consume(context: Context): String {
    val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    val raw = prefs.getString(KEY, null) ?: return "[]"
    prefs.edit().remove(KEY).apply()
    return raw
  }
}
