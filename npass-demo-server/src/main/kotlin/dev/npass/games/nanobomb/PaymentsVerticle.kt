package dev.npass.games.nanobomb

import dev.npass.PaymentRequest
import dev.npass.Util
import dev.npass.client.NpassClient
import io.vertx.core.AsyncResult
import io.vertx.core.eventbus.DeliveryOptions
import io.vertx.core.eventbus.Message
import io.vertx.ext.web.client.WebClient
import io.vertx.ext.web.client.WebClientOptions
import io.vertx.kotlin.core.json.get
import io.vertx.kotlin.coroutines.CoroutineVerticle
import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.launch

fun <T> Message<T>.localReply( message: Any,
                              options: DeliveryOptions? = null,
                              replyHandler: ((AsyncResult<Message<T>>) -> Unit)? = null) {
    val deliveryOptions = options?.let { DeliveryOptions(options) } ?: DeliveryOptions()
    deliveryOptions.apply {
        codecName = "local"
        isLocalOnly = true
    }
    reply(message, deliveryOptions, replyHandler)
}

class PaymentsVerticle : CoroutineVerticle() {
    private lateinit var httpClient: WebClient

    override suspend fun start() {
        Util.log("PaymentsVerticle starting...")

        try {
            val clientOptions = WebClientOptions().setConnectTimeout(60000)
            httpClient = WebClient.create(vertx, clientOptions)
            val npassClient = NpassClient(httpClient, this.config["npassHost"]  ,this.config["npassPort"], this.config["representative"])
            Payments.INSTANCE.initAccount(this.config["seed"], npassClient, vertx)
            Nanobomb.instance.init(vertx)
        }
        catch (e: Exception) {
            Util.log("ERROR: Failed to intialize payment processing verticle. Exception: ${e.message}")
        }

        val consumer = vertx.eventBus().consumer<PaymentRequest>("payment.requests")
        consumer.handler { message ->
            Util.log("Received a payment request: ${message.body()}")
            GlobalScope.launch {
                try {
                    val paymentResult = Payments.INSTANCE.processPaymentRequest(message.body())
                    if (paymentResult.hash.isNotEmpty())
                        message.localReply(paymentResult)
                    else
                        message.fail(500, "Failed to request payment ${message.body()}")
                }
                catch (e: Exception) {
                    message.fail(500, "Failed to request payment ${e.message}")
                }
            }
        }

        vertx.setPeriodic(1000 * 60) { id ->
            Payments.INSTANCE.updateServerAccount()
        }
    }
}