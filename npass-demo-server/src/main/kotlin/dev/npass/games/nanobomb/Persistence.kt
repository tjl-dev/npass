package dev.npass.games.nanobomb

import com.github.shyiko.levelkt.jna.JNALevelDB
import com.google.gson.Gson
import dev.npass.PaymentReceipt
import dev.npass.PaymentRequest


object Persistence {
    val gson = Gson()

    fun storeSession(summary: GameSummary, store: String) {
        JNALevelDB(store).use { levelDB ->
            val summaryJson = gson.toJson(summary)
            levelDB.put(summary.sessionId.toByteArray(), summaryJson.toByteArray())
        }
    }

    fun storePaymentRequest(request: PaymentRequest, store: String) {
        JNALevelDB(store).use { levelDB ->
            val json = gson.toJson(request)
            levelDB.put(request.requestId.toByteArray(), json.toByteArray())
        }
    }

    fun storePaymentReceipt(receipt: PaymentReceipt, store: String) {
        JNALevelDB(store).use { levelDB ->
            val json = gson.toJson(receipt)
            levelDB.put(receipt.requestId.toByteArray(), json.toByteArray())
        }
    }

    fun loadAllSummaries(store: String): List<GameSummary> {
        val sessions = mutableListOf<GameSummary>()
        JNALevelDB(store).use { levelDB ->
            levelDB.keyCursor().use { cursor ->
                var key = cursor.next()
                while(key != null) {
                    val json = levelDB.get(key)?.let { String(it) }
                    val session = gson.fromJson(json, GameSummary::class.java)
                    sessions.add(session)
                    key = cursor.next()
                }
            }
        }
        return sessions
    }
}