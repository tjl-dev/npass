package dev.npass.games.nanobomb

import com.google.gson.Gson
import dev.npass.BlockPublishResult
import dev.npass.PaymentRequest
import dev.npass.Util
import dev.npass.games.nanobomb.PersistenceTopics.sessionTopic
import io.vertx.core.AsyncResult
import io.vertx.core.Handler
import io.vertx.core.Vertx
import io.vertx.core.eventbus.DeliveryOptions
import io.vertx.core.eventbus.EventBus
import io.vertx.core.eventbus.Message
import java.time.Instant
import java.util.*

enum class GameState {
    ACTIVE, ABANDONED, DEAD, HACKED, CLAIMED, RECLAIMED, JACKPOT, ERROR
}

enum class CardType {
    NANOCOIN, HEART, BOMB, COLIN, BOMBER, NOTHING, UNKNOWN, TRIPLET
}

data class Card (
        val sessionId: String,
        val cardType: CardType,
        val cardId: Int,
        val hints: Set<CardType>,
        var visible: Boolean
    )

data class GameSummary(
        val state: GameState,
        val startTime: Instant,
        val sessionId: String,
        val sessionHash: String,
        val tally: Double,
        val spent: Double,
        val jackpot: Double,
        val cardPrice: Double,
        val hearts: Int,
        val bombs: Int,
        val coins: Int,
        val triplets: Int,
        val cardDistributionHash: String,
        val playerAddress: String,
        val cards: Set<Card>,
        val result: GameResult?
)

data class GameResult(
        val blockHash: String,
        val paymentAmount: Double,
        val playerAddress: String,
        val cardDistribution: String,
        val cardDistributionHash: String
)

fun <T> EventBus.localRequest(address: String,
                              message: Any,
                              options: DeliveryOptions? = null,
                              replyHandler: ((AsyncResult<Message<T>>) -> Unit)? = null) {
    val deliveryOptions = options?.let { DeliveryOptions(options) } ?: DeliveryOptions()
    deliveryOptions.apply {
        codecName = "local"
        isLocalOnly = true
    }
    request(address, message, deliveryOptions, replyHandler)
}

class GameSession(val playerAddress: String, val vertx: Vertx, val units: Double) {
    var sessionId: String = UUID.randomUUID().toString()
    var startTime = Instant.now()
    private lateinit var sessionDigest: String
    private lateinit var sessionHash: String
    private val cards = mutableMapOf<Int, Card>()
    private var blockHash: String =  ""
    private var hearts = 3
    private var bombs = 0
    private var jackpot = 0.0
    private var spent = 0.0
    private var state: GameState = GameState.ACTIVE
    private var result: GameResult? = null
    private val gson = Gson()

    // generate deck --> 25 cards + session hash
    private fun genDeck() {
        var types = MutableList(100) { CardType.NANOCOIN }
        types.addAll( MutableList(60) { CardType.BOMB } )
        types.addAll( MutableList(40) { CardType.HEART } )
        types.addAll( MutableList(100) { CardType.NOTHING } )

        types.shuffle()
        types = types.take(23).toMutableList()
        types.add(CardType.COLIN)
        types.add(CardType.BOMBER)
        types.shuffle()
        types.forEach { t -> cards[cards.size] = Card(sessionId, t, cards.size, getHints(cards.size, types), false) }

        sessionDigest = "|"
        cards.values.forEach { card -> sessionDigest += card.cardType.toString() + "|" }

        sessionHash = HashUtils.hashString("MD5", sessionDigest)
    }

    private fun getHints(i: Int, types: List<CardType>): Set<CardType> {
        return listOf(i-1, i+1, i-5, i+5)
                .filter { it in 0..24 && (i%5 == it%5 || i/5 == it/5)}
                .map { types[it] }
                .filter { it == CardType.BOMB || it == CardType.HEART || it == CardType.NANOCOIN }
                .toSet()
    }

    // reveal card --> update session state, update win
    fun revealCard(index: Int): Card {
        val card = cards[index]!!
        if(state == GameState.ACTIVE && card.visible == false) {
            card.visible = true
            if (card.cardType == CardType.HEART) {
                hearts += 1
            }
            if (card.cardType == CardType.BOMB) {
                bombs += 1
                hearts -= 1
                if (hearts < 1) {
                    state = GameState.DEAD
                    Payments.INSTANCE.relinquishJackpot(sessionId, jackpot)
                }
            }
            if (card.cardType == CardType.BOMBER) {
                state = GameState.HACKED
                Payments.INSTANCE.relinquishJackpot(sessionId, jackpot)
            }
            if (card.cardType == CardType.COLIN) {
                state = GameState.JACKPOT
            }

            persist()
        }
        return card
    }

    fun summary(full: Boolean = false): GameSummary {
        spent = cards.filterValues { it.visible }.size * units
        var nanocoins = 0

        val doTally = (state == GameState.ACTIVE
                || state == GameState.CLAIMED
                || state == GameState.RECLAIMED
                || state == GameState.JACKPOT)

        // add up coins and hearts if not dead
        if (doTally) {
            cards.filterValues { it.visible }.values.forEach { card ->
                if (card.cardType == CardType.NANOCOIN)
                    nanocoins += 1
            }
        }

        var triplets = 0
        val cardsView = cards.values.map { card ->
            val show = full || card.visible
            val hints = mutableSetOf<CardType>()
            if(show)
                hints.addAll(card.hints)
            if(card.visible) {
                val tripletCount = countTriplets(card.cardId)
                if (tripletCount > 0) {
                    triplets += 1
                    hints.add(CardType.TRIPLET)
                    if(doTally)
                        nanocoins += 2
                }
            }
            Card(sessionId, if(show) card.cardType else CardType.UNKNOWN, card.cardId, hints, card.visible)
        }.toSet()

        var total = (nanocoins * units * 2)
        if (state == GameState.JACKPOT) {
            total += jackpot
        }

        return GameSummary(state, startTime, sessionId, sessionHash, total, spent, jackpot, units, hearts, bombs, nanocoins, triplets, sessionHash, playerAddress, cardsView, result)
    }

    fun countTriplets(i: Int): Int {
        val cardType = cards[i]!!.cardType
        if(cardType!= CardType.NANOCOIN)
            return 0

        val tripletLines = listOf(
                listOf(i-2, i-1, i),
                listOf(i-1, i, i +1),
                listOf(i, i+1, i+2),
                listOf(i-10, i-5, i),
                listOf(i-5, i, i+5),
                listOf(i, i+5, i+10))
                .filter { list -> list.all {
                    item ->
                        item in 0..24
                        && cards[item]!!.visible
                        && cards[item]!!.cardType == cardType
                        && (i%5 == item%5 || i/5 == item/5)
                } }
                .size

        val tripletDiags = listOf(
                listOf(i-12, i-6, i),
                listOf(i-6, i, i+6),
                listOf(i, i+6, i+12),
                listOf(i-8, i-4, i),
                listOf(i-4, i, i+4),
                listOf(i, i+4, i+8))
                .filter { list -> list.all {
                    item ->
                        item in 0..24
                        && cards[item]!!.visible
                        && cards[item]!!.cardType == cardType
                        && (i%5 != item%5 && i/5 != item/5) || i == item
                } }
                    .size
        return tripletLines + tripletDiags
    }

    // claim win and claim game.
    @Synchronized fun claim(resultHandler: Handler<GameSummary>) {
        var summary = summary()
        if(state != GameState.CLAIMED && state != GameState.RECLAIMED && summary.spent > 0) {
            val paymentAmount = summary.tally  // TODO rewire to cap at amount spent
            val paymentRequest = PaymentRequest(playerAddress, paymentAmount, sessionId)
            vertx.eventBus().localRequest<BlockPublishResult>("payment.requests", paymentRequest) { ar ->
                if(ar.succeeded()) {
                    Util.log("Claim: payment success  ${ar.result().body()}")
                    blockHash = ar.result().body().hash
                    result = GameResult(blockHash, paymentAmount, playerAddress, sessionDigest, sessionHash)

                    if(state == GameState.JACKPOT)
                        Payments.INSTANCE.claimJackpot(sessionId, jackpot)
                    else {
                        Payments.INSTANCE.relinquishJackpot(sessionId, jackpot)
                        jackpot = 0.0
                    }

                    state = GameState.CLAIMED
                    persist()
                }
                else {
                    Util.log("Claim: failed to request payment: ${ar.cause()}")
                }
                summary = summary() // regen with result
                resultHandler.handle(summary)
            }
        }
        else resultHandler.handle(summary)
    }

    @Synchronized fun reclaim(resultHandler: Handler<GameSummary>) {
        var summary = summary()
        if(state != GameState.CLAIMED && state != GameState.RECLAIMED && summary.spent > 0) {
            val paymentAmount = summary.spent

            val paymentRequest = PaymentRequest(playerAddress, paymentAmount, sessionId)
            vertx.eventBus().localRequest<BlockPublishResult>("payment.requests", paymentRequest) { ar ->
                if(ar.succeeded()) {
                    Util.log("Reclaim: payment success  ${ar.result().body()}")
                    blockHash = ar.result().body().hash
                    Payments.INSTANCE.relinquishJackpot(sessionId, jackpot)
                    jackpot = 0.0
                    state = GameState.RECLAIMED
                    result = GameResult(blockHash, paymentAmount, playerAddress, sessionDigest, sessionHash)
                    persist()
                }
                else {
                    Util.log("Reclaim: Failed to request payment: ${ar.cause()}")
                }
                summary = summary() // regen with result
                resultHandler.handle(summary)
            }
        }
        else resultHandler.handle(summary)
    }

    @Synchronized fun abandon(resultHandler: Handler<GameSummary>) {
        Util.log("Abandoning session: $sessionId")
        state = GameState.ABANDONED
        Payments.INSTANCE.relinquishJackpot(sessionId, jackpot)
        jackpot = 0.0
        result = GameResult("", 0.0, playerAddress, sessionDigest, sessionHash)
        val summary = summary()
        persist()
        resultHandler.handle(summary)
    }

    private fun persist() {
        vertx.eventBus().localRequest<Any>(sessionTopic, summary(true) )
    }

    companion object {
        fun fromSummary(summary: GameSummary, vertx: Vertx): GameSession {
            val session = GameSession(summary.playerAddress, vertx, summary.cardPrice)
            session.state = summary.state
            session.startTime = summary.startTime
            session.sessionHash = summary.sessionHash
            session.blockHash = summary.result?.blockHash?: ""
            session.bombs = summary.bombs
            session.hearts = summary.hearts
            session.result = summary.result
            session.sessionDigest = summary.result?.cardDistribution ?: ""
            session.sessionId = summary.sessionId
            session.spent = summary.spent
            session.jackpot = summary.jackpot

            if(summary.state == GameState.ACTIVE)
                session.jackpot = Payments.INSTANCE.reserveJackpot(session.sessionId, summary.jackpot)

            summary.cards.forEach {
                session.cards[it.cardId] = it
            }
            return session
        }

        fun newSession(playerAddress: String, vertx: Vertx): GameSession {
            val session = GameSession(playerAddress, vertx, Payments.INSTANCE.CARD_PRICE)
            session.genDeck()
            session.jackpot = Payments.INSTANCE.reserveJackpot(session.sessionId)
            session.persist()
            return session
        }
    }
}