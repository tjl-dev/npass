package dev.npass.games.nanobomb

import com.rotilho.jnano.commons.*
import com.rotilho.jnano.commons.NanoHelper.toByteArray
import dev.npass.*
import dev.npass.Util.log
import dev.npass.client.NpassClient
import dev.npass.games.nanobomb.PersistenceTopics.paymentReceiptTopic
import dev.npass.games.nanobomb.PersistenceTopics.paymentRequestTopic
import io.vertx.core.Vertx
import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.async
import kotlinx.coroutines.launch
import kotlinx.coroutines.runBlocking
import java.math.BigDecimal


class Payments private constructor() {
    private val MAX_JACKPOT = 0.02 //yay
    private val ACCOUNT_BUFFER = 2.0 // leave some in account to handle non jackpot payouts
    private val MAX_POOL_SIZE = 3.0  //the most i'm prepared to lose in a day
    val CARD_PRICE = 0.001

    private var vertx: Vertx? = null
    private val paymentRequests = mutableMapOf<String, PaymentRequest>()
    private val reservedSessions = mutableMapOf<String, Double>()
    private var jackpotPool = 0.0
    private var jackpotReserved = 0.0
    private var jackpotClaimed = 0.0
    private val jackpotModifier = 0.1
    private var npassClient: NpassClient? = null
    private var account = ""
    private var accountBalance = 0.0
    private var privateKey: ByteArray = ByteArray(0)
    private var publicKey: ByteArray = ByteArray(0)

    private object HOLDER {
        val INSTANCE = Payments()
    }

    companion object {
        val INSTANCE: Payments by lazy { HOLDER.INSTANCE }
    }

    fun initAccount(seed: String, npassClient: NpassClient, vertx: Vertx) {
        if(account.isNotEmpty() && privateKey.isNotEmpty())
            return
        if(!NanoSeeds.isValid(toByteArray(seed))){
            throw Exception("Invalid Seed")
        }
        this.vertx = vertx
        this.npassClient = npassClient
        privateKey= NanoKeys.createPrivateKey(toByteArray(seed), 0)
        publicKey = NanoKeys.createPublicKey(privateKey)
        account = NanoAccounts.createAccount(publicKey)
        updateServerAccount()
    }

    suspend fun processPaymentRequest(request: PaymentRequest): BlockPublishResult {
        paymentRequests[request.requestId] = request // or send on message bus
        persist(request)
        val result = GlobalScope.async {
            val info = npassClient!!.getAccountInfo(account)!!
            val spendRaw =  NanoAmount.of(BigDecimal.valueOf(request.amount), NanoUnit.NANO)
            val newBalance = NanoAmount.of(info.balance!!, NanoUnit.RAW).subtract(spendRaw)

            if(newBalance.toNano() <= BigDecimal.ZERO)
                throw Exception("Not enough funds to process payment request ${request}  ${info}")

            val block = npassClient!!.sendNano(request.address, info.frontier!!, account, newBalance, privateKey)!!
            val receipt = PaymentReceipt(request.requestId, request, block)
            persist(receipt)
            updateServerAccount()
            block
        }.await()
        return result
    }

    @Synchronized
    fun updateServerAccount() {
        GlobalScope.async {
            try {
                val balanceResult = npassClient!!.getAccountBalance(account)!!
                accountBalance = NanoAmount.of(balanceResult.balance!!, NanoUnit.RAW).toNano().toDouble()
                log("updateServerAccount accountBalance: $accountBalance")

                val pending = NanoAmount.of(balanceResult.pending!!, NanoUnit.RAW)
                if(pending.toRaw() > BigDecimal.ZERO){
                    log("Found pending amount server account: ${pending.toNano()}")
                    val accountsPendingResponse = npassClient!!.getAccountsPending(account)!!
                    receiveAllPending(accountsPendingResponse)
                }
            }
            catch (e: java.lang.Exception) {
                log("Failed to update server account: ${e.message}")
            }
        }
    }

    fun receiveAllPending(accountsPendingResponse: AccountsPendingResponse) {
        try {
            if(accountsPendingResponse.blocks.containsKey(account)) {
                val blocksForAccount = accountsPendingResponse.blocks.get(account)!!
                blocksForAccount.forEach { blockHash, blockInfo ->
                    receivePending(blockHash, blockInfo)
                }
                vertx!!.setTimer(1000 * 10) { id ->
                    updateServerAccount()
                }
            }
        }
        catch (e: java.lang.Exception) {
            log("Failed to receive all pending for server account: ${e.message}")
        }
    }

    fun receivePending(blockHash: String, blockPendingInfo: BlockPendingInfo) {
        Util.log("Receive pending block  $blockHash, $blockPendingInfo")
        try {
            runBlocking {
                val info = npassClient!!.getAccountInfo(account)!!
                val receiveAmountRaw = NanoAmount.of(blockPendingInfo.amount, NanoUnit.RAW)
                val newBalance = NanoAmount.of(info.balance!!, NanoUnit.RAW).add(receiveAmountRaw)
                npassClient!!.receivePending(blockHash, info.frontier!!, account, newBalance, privateKey)
            }
        }
        catch (e: java.lang.Exception) {
            Util.log("Failed to receive pending for server block $blockHash: ${e.message}")
        }
    }


    fun getJackpotAmout(): Double {
        jackpotReserved = reservedSessions.values.sum()
        val availableToPool = Math.max(0.0,accountBalance - ACCOUNT_BUFFER)
        jackpotPool = Math.max(0.0, Math.min(availableToPool, MAX_POOL_SIZE) - jackpotClaimed - jackpotReserved)
        return  Math.min(MAX_JACKPOT, jackpotPool * jackpotModifier)
    }

    @Synchronized
    fun reserveJackpot(sessionId: String, amount: Double = getJackpotAmout()): Double {
        Util.log("Reserving jackpot of $amount for $sessionId")
        reservedSessions[sessionId] = amount
        return amount
    }

    @Synchronized
    fun relinquishJackpot(sessionId: String, amount: Double): Double {
        Util.log("Relinquishing jackpot of $amount for $sessionId")
        if(reservedSessions.containsKey(sessionId)) {
            reservedSessions.remove(sessionId)
        }
        return amount
    }

    @Synchronized
    fun claimJackpot(sessionId: String, amount: Double): Double {
        Util.log("Jackpot of $amount claimed by $sessionId")
        reservedSessions.remove(sessionId)
        jackpotClaimed += amount
        return amount
    }

    private fun persist(request: PaymentRequest) {
        vertx!!.eventBus().localRequest<Any>(paymentRequestTopic, request)
    }

    private fun persist(receipt: PaymentReceipt) {
        vertx!!.eventBus().localRequest<Any>(paymentReceiptTopic, receipt)
    }

    // TODO persist jackpot state?
    // TODO load any old paymentRequests that have not been processed
}