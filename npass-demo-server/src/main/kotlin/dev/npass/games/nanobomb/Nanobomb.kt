package dev.npass.games.nanobomb

import com.google.gson.Gson
import com.rotilho.jnano.commons.NanoAccounts
import com.rotilho.jnano.commons.NanoBaseAccountType
import dev.npass.Util
import dev.npass.games.nanobomb.PersistenceTopics.sessionLoadAllTopic
import io.vertx.core.Handler
import io.vertx.core.Vertx
import io.vertx.ext.web.RoutingContext

data class GameMeta(
        val jackpot: Double,
        val recentGames: List<GameSummary>,
        val cardPrice: Double,
        val address: String = "nano_3swpttz8t86zywz7xa83wb9ygsq89y71i7eyg9ackeix1nubzng9uj7aw9ha"
)

class Nanobomb private constructor() {
    val sessions = mutableMapOf<String, GameSession>()
    val gson = Gson()
    var vertx: Vertx? = null

    fun init(vertx: Vertx) {
        this.vertx = vertx
        loadSessions()
    }

    private object HOLDER {
        val INSTANCE = Nanobomb()
    }

    companion object {
        val instance: Nanobomb by lazy { HOLDER.INSTANCE }
    }

    fun newSession(playerAddress: String, vertx: Vertx): GameSession {
        val session = GameSession.newSession(playerAddress, vertx)
        sessions[session.sessionId] = session
        return session
    }

    // get meta -> last 10 games, open jackpot
    val metaHandler = Handler<RoutingContext> { context ->
        val meta = GameMeta(Payments.INSTANCE.getJackpotAmout(), listOf(), Payments.INSTANCE.CARD_PRICE)
        context.response().end(gson.toJson(meta))
        Util.log("metaHandler returning: ${meta}")
    }

    fun recentGames(n: Int): List<GameSummary> {
        return sessions.values.sortedBy { s -> s.startTime }.map {s -> s.summary() }.takeLast(n)
    }

    fun isValidAddress(address: String): Boolean {
        return NanoAccounts.isValid(NanoBaseAccountType.NANO, address)
    }

    val newSessionHandler = Handler<RoutingContext> { context ->
        val address = context.request().getParam("address")
        if(!isValidAddress(address)) {
            context.response().statusCode = 500
            context.response().statusMessage = "Invalid Nano Address: " + address
            context.response().end()
        }
        else {
            val session = newSession(address, vertx!!)
            val summary = gson.toJson(session.summary())
            context.response().end(summary)
            Util.log("newSessionHandler $address returning: ${summary}")
        }
    }

    val getSessionHandler = Handler<RoutingContext> { context ->
        val sessionId = context.request().getParam("sessionId")
        val session = sessions[sessionId]!!
        val summary = session.summary()
        context.response().end(gson.toJson(summary))
        Util.log("getSessionHandler $sessionId returning: ${gson.toJson(summary)}")
    }

    val abandonSessionHandler = Handler<RoutingContext> { context ->
        val sessionId = context.request().getParam("sessionId")
        val session = sessions[sessionId]!!
        val handler = Handler<GameSummary> { res ->
            context.response().end(gson.toJson(res))
            Util.log("abandonSessionHandler $sessionId returning: ${gson.toJson(res)}")
        }
        session.abandon(handler)
    }

    val claimSessionHandler = Handler<RoutingContext> { context ->
        val sessionId = context.request().getParam("sessionId")
        val session = sessions[sessionId]!!
        val handler = Handler<GameSummary> { res ->
            context.response().end(gson.toJson(res))
            Util.log("claimSessionHandler $sessionId returning: ${gson.toJson(res)}")
        }
        session.claim(handler)
    }

    val reclaimSessionHandler = Handler<RoutingContext> { context ->
        val sessionId = context.request().getParam("sessionId")
        val session = sessions[sessionId]!!
        val handler = Handler<GameSummary> { res ->
            context.response().end(gson.toJson(res))
            Util.log("reclaimSessionHandler $sessionId returning: ${gson.toJson(res)}")
        }
        session.reclaim(handler)
    }

    var nanobombContentHandler = Handler<RoutingContext> { context ->
        val sessionId = context.request().getParam("sessionId")
        val cardId = context.request().getParam("cardId")
        val session = sessions[sessionId]!!
        val card = session.revealCard(cardId.toInt())
        val path = "/npass/nanobomb/preview/${card.cardType}.png"
        context.reroute(path)
        Util.log("nanobombContentHandler $sessionId $cardId returning: $path")
    }

    private fun loadSessions() {
        vertx!!.eventBus().localRequest<LoadAllSessionslResponse>(sessionLoadAllTopic, LoadAllSessions) { ar ->
            if(ar.succeeded()) {
                ar.result().body().items.forEach { sessions[it.sessionId] = it }
                Util.log("loaded sessions: ${sessions.size}")
            } else {
                Util.log("failed to load sessions: ${ar.cause()}")
            }
        }
    }

    // TODO validate inputs on all handlers
}