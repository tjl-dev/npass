package dev.npass

import com.google.gson.Gson
import io.vertx.core.AsyncResult
import io.vertx.core.Future
import io.vertx.core.Handler
import io.vertx.core.json.JsonObject
import io.vertx.ext.auth.User
import io.vertx.ext.auth.jwt.JWTAuth
import io.vertx.ext.auth.jwt.impl.JWTUser
import io.vertx.ext.jwt.JWTOptions
import io.vertx.ext.web.client.WebClient
import io.vertx.kotlin.ext.web.client.sendJsonAwait
import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.async
import kotlinx.coroutines.launch
import java.time.Instant

class NPassAuthProvider(val httpClient: WebClient): JWTAuth {

    private val gson = Gson()
    private val tokensCache = mutableMapOf<String, VerifyTokenResponse>()

    override fun authenticate(authInfo: JsonObject?, resultHandler: Handler<AsyncResult<User>>?) {
        GlobalScope.launch {
            try {
                val decryptedToken = extractNpassToken(authInfo!!)
                if (validateTokenResponse(decryptedToken!!)) {
                    val payload = JsonObject()
                    payload.put("nPassToken", gson.toJson(decryptedToken))
                    Util.log("NPassAuthProvider: authenticated $decryptedToken")
                    resultHandler!!.handle(Future.succeededFuture(JWTUser(payload, "")))
                }
                else
                    Util.log("NPassAuthProvider: token not valid $decryptedToken")
            } catch (e: Exception) {
                Util.log("NPassAuthProvider: exception $e")
                resultHandler!!.handle(Future.failedFuture(e))
            }
        }
    }

    suspend fun extractNpassToken(authInfo: JsonObject): VerifyTokenResponse? {
        var tokenResponse: VerifyTokenResponse
        val tokenString: String = authInfo.getString("jwt").orEmpty()
        if (tokensCache.containsKey(tokenString)) {
            return tokensCache.getValue(tokenString)
        }

        // not cached, request decode + verify
        val verifyTokenRequest = VerifyTokenRequest(
                "",
                tokenString)
        tokenResponse = GlobalScope.async {
            verifyNpassToken(verifyTokenRequest)!!

        }.await()
        tokensCache[tokenString] = tokenResponse

        return tokenResponse
    }

    suspend fun verifyNpassToken(verifyTokenRequest: VerifyTokenRequest): VerifyTokenResponse? {
        val response = httpClient.post(443, "npass.dev", "/rpc/token/verify")
                .ssl(true)
                .timeout(30000)
                .sendJsonAwait(
                        verifyTokenRequest
                )
        if (200 == response.statusCode()) {
            val tokenResponse: VerifyTokenResponse = gson.fromJson(response.bodyAsString(), VerifyTokenResponse::class.java)
            Util.log("verifyNpassToken: returned token $tokenResponse")
            return tokenResponse
        }
        Util.log("verifyNpassToken: failed to verify token - ${response.statusCode()}: ${response.bodyAsString()}")
        return null
    }

    fun validateTokenResponse(tokenResponse: VerifyTokenResponse): Boolean {
        if ("VALID" != tokenResponse.tokenStatus.name)
            return false
        return tokenIsCurrent(tokenResponse.token)
    }

    fun tokenIsCurrent(token: NPassToken): Boolean {
        if (token.expiry.isEmpty())
            return false
        val expiry = token.expiry.toLong()
        val now = Instant.now().epochSecond
        return expiry > now
    }

    override fun generateToken(p0: JsonObject?, p1: JWTOptions?): String {
        throw Exception("generateToken not supported")
    }
}
