package expo.modules.workoutlive

import android.content.Context
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class WorkoutLiveModule : Module() {
  private val context: Context
    get() = requireNotNull(appContext.reactContext) { "React context недоступен" }.applicationContext

  override fun definition() = ModuleDefinition {
    Name("WorkoutLive")

    // Без данных: по событию JS забирает очередь consumeActions — так нажатие не применится дважды
    Events("onAction")

    OnCreate { instance = this@WorkoutLiveModule }
    OnDestroy { if (instance === this@WorkoutLiveModule) instance = null }

    /** Показать или обновить уведомление. state — JSON WorkoutLiveState */
    AsyncFunction("show") { state: String ->
      WorkoutLiveController.show(context, WorkoutLiveState.fromJson(state))
    }

    AsyncFunction("hide") {
      WorkoutLiveController.hide(context)
    }

    /** Нажатия кнопок уведомления, которые приложение ещё не применило: JSON-массив */
    Function("consumeActions") {
      WorkoutLiveActions.consume(context)
    }
  }

  companion object {
    @Volatile
    private var instance: WorkoutLiveModule? = null

    fun emitAction() {
      instance?.sendEvent("onAction", emptyMap<String, Any>())
    }
  }
}
