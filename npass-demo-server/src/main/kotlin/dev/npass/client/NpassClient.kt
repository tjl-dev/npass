package dev.npass.client

import com.google.gson.Gson
import com.rotilho.jnano.commons.NanoAmount
import com.rotilho.jnano.commons.NanoBlocks
import com.rotilho.jnano.commons.NanoSignatures
import dev.npass.*
import io.vertx.ext.web.client.WebClient
import io.vertx.kotlin.ext.web.client.sendJsonAwait


class NpassClient(val httpClient: WebClient, val host: String, val port: Int, val representative: String) {
    private val gson = Gson()

    suspend fun getAccountInfo(account: String): AccountInfoResponse? {
        val req = AccountInfoRequest("account_info", account)
        val response = httpClient.post(port, host, "/rpc")
                .ssl(true)
                .timeout(30000)
                .sendJsonAwait(
                        req
                )
        if (200 == response.statusCode()) {
            val accountInfoResponse: AccountInfoResponse = gson.fromJson(response.bodyAsString(), AccountInfoResponse::class.java)
            Util.log("getAccountInfo: returned $accountInfoResponse")
            return accountInfoResponse
        }
        Util.log("getAccountInfo: failed to request - ${response.statusCode()}: ${response.bodyAsString()}")
        return null
    }

    suspend fun getAccountBalance(account: String): AccountBalanceResponse? {
        val req = AccountInfoRequest("account_balance", account)
        val response = httpClient.post(port, host, "/rpc")
                .ssl(true)
                .timeout(30000)
                .sendJsonAwait(
                        req
                )
        if (200 == response.statusCode()) {
            val accountBalanceResponse: AccountBalanceResponse = gson.fromJson(response.bodyAsString(), AccountBalanceResponse::class.java)
            Util.log("getAccountBalance: returned $accountBalanceResponse")
            return accountBalanceResponse
        }
        Util.log("getAccountBalance: failed to request - ${response.statusCode()}: ${response.bodyAsString()}")
        return null
    }

    suspend fun getAccountsPending(account: String): AccountsPendingResponse? {
        val req = AccountsPendingRequest("accounts_pending", listOf(account))
        val response = httpClient.post(port, host, "/rpc")
                .ssl(true)
                .timeout(30000)
                .sendJsonAwait(
                        req
                )
        if (200 == response.statusCode()) {
            val accountsPendingResponse: AccountsPendingResponse = gson.fromJson(response.bodyAsString(), AccountsPendingResponse::class.java)
            Util.log("getAccountsPending: returned $accountsPendingResponse")
            return accountsPendingResponse
        }
        Util.log("getAccountsPending: failed to request - ${response.statusCode()}: ${response.bodyAsString()}")
        return null
    }

    suspend fun generateWork(hash: String, difficulty: String = "fffffffd00000000"): WorkResponse? {
        val req = WorkRequest("work_generate", hash, difficulty)
        val response = httpClient.post(port, host, "/rpc")
                .ssl(true)
                .timeout(30000)
                .sendJsonAwait(
                        req
                )
        if (200 == response.statusCode()) {
            val workResponse: WorkResponse = gson.fromJson(response.bodyAsString(), WorkResponse::class.java)
            Util.log("generateWork: returned $workResponse")
            return workResponse
        }
        Util.log("generateWork: failed to request - ${response.statusCode()}: ${response.bodyAsString()}")
        return null
    }

    suspend fun receivePending(blockHash: String, frontier: String, account: String, newBalance: NanoAmount, privateKey: ByteArray) {
        val work = generateWork(frontier)!!
        val hash = NanoBlocks.hashStateBlock(
                account,
                frontier,
                representative,
                newBalance,
                blockHash
        )
        val signature = NanoSignatures.sign(privateKey, hash)
        val signedBlock = Block( "state", frontier, account, blockHash, newBalance.toRaw().toString(), representative, work.work, signature )
        val publishBlock = BlockPublish(block = signedBlock)
        val response = httpClient.post(port, host, "/rpc")
                .ssl(true)
                .timeout(30000)
                .sendJsonAwait(
                        publishBlock
                )
        if (200 == response.statusCode()) {
            val blockPublishResponse: BlockPublishResult = gson.fromJson(response.bodyAsString(), BlockPublishResult::class.java)
            Util.log("receivePending: returned $blockPublishResponse")
            return
        }
        Util.log("receivePending: failed to receive - ${response.statusCode()}: ${response.bodyAsString()}")
    }

    suspend fun sendNano(toAddress: String, frontier: String, fromAccount: String, newBalance: NanoAmount, privateKey: ByteArray): BlockPublishResult? {
        val work = generateWork(frontier)!!
        val hash = NanoBlocks.hashStateBlock(
                fromAccount,
                frontier,
                representative,
                newBalance,
                toAddress
        )
        val signature = NanoSignatures.sign(privateKey, hash)
        val signedBlock = Block( "state", frontier, fromAccount, toAddress, newBalance.toRaw().toString(), representative, work.work, signature )
        val publishBlock = BlockPublish(block = signedBlock)
        val response = httpClient.post(port, host, "/rpc")
                .ssl(true)
                .timeout(30000)
                .sendJsonAwait(
                        publishBlock
                )
        if (200 == response.statusCode()) {
            val blockPublishResponse: BlockPublishResult = gson.fromJson(response.bodyAsString(), BlockPublishResult::class.java)
            Util.log("sendNano: returned $blockPublishResponse")
            return blockPublishResponse
        }
        Util.log("sendNano: failed to request - ${response.statusCode()}: ${response.bodyAsString()}")
        return null
    }

}