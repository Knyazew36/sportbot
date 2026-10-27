package expo.modules.workoutlive

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/** Кнопки «+30 с» и «Пропустить» в уведомлении */
class WorkoutLiveActionReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    WorkoutLiveController.onAction(context, intent.action)
  }
}
