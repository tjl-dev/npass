package dev.npass.games.nanobomb

import dev.npass.PaymentReceipt
import dev.npass.PaymentRequest
import dev.npass.Util
import io.vertx.kotlin.coroutines.CoroutineVerticle
import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.launch


object LoadAllSessions

data class LoadAllSessionslResponse(
        val items: List<GameSession>
)

object PersistenceTopics {
    val sessionTopic = "persistence.store.session"
    val sessionLoadAllTopic = "persistence.load.sessions"
    val paymentRequestTopic = "persistence.store.payment.request"
    val paymentReceiptTopic = "persistence.store.payment.receipt"
}

class PersistenceVerticle : CoroutineVerticle() {

    private var sessionDbPath = "nanobomb.sessions.ldb"
    private var paymentRequestDbPath = "nanobomb.payment-requests.ldb"
    private var paymentReceiptDbPath = "nanobomb.payment-receipts.ldb"


    override suspend fun start() {
        Util.log("PersistenceVerticle starting...")
        sessionDbPath = this.config.getString("sessionsDB", sessionDbPath)
        paymentRequestDbPath = this.config.getString("paymentRequestDb", paymentRequestDbPath)
        paymentReceiptDbPath = this.config.getString("paymentReceiptDb", paymentReceiptDbPath)

        vertx.eventBus().consumer<GameSummary>(PersistenceTopics.sessionTopic).handler{ message ->
            Util.log("Received a ${PersistenceTopics.sessionTopic} request: ${message.body()}")
            Persistence.storeSession(message.body(), sessionDbPath)
        }

        vertx.eventBus().consumer<LoadAllSessions>(PersistenceTopics.sessionLoadAllTopic).handler { message ->
            Util.log("Received a ${PersistenceTopics.sessionLoadAllTopic} request: ${message.body()}")
            GlobalScope.launch {
                try {
                    val summaries = Persistence.loadAllSummaries(sessionDbPath)
                    val sessions = summaries.map { GameSession.fromSummary(it, vertx) }
                    message.localReply(LoadAllSessionslResponse(sessions))
                }
                catch (e: Exception) {
                    message.fail(500, "Failed to load sessions ${e.message}")
                }
            }
        }

        vertx.eventBus().consumer<PaymentRequest>(PersistenceTopics.paymentRequestTopic).handler{ message ->
            Util.log("Received a ${PersistenceTopics.paymentRequestTopic} request: ${message.body()}")
            Persistence.storePaymentRequest(message.body(), paymentRequestDbPath)
        }

        vertx.eventBus().consumer<PaymentReceipt>(PersistenceTopics.paymentReceiptTopic).handler{ message ->
            Util.log("Received a ${PersistenceTopics.paymentReceiptTopic} request: ${message.body()}")
            Persistence.storePaymentReceipt(message.body(), paymentReceiptDbPath)
        }
    }
}