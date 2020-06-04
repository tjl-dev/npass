package dev.npass

import com.google.gson.Gson
import io.vertx.core.json.JsonObject
import io.vertx.ext.auth.User
import io.vertx.ext.auth.jwt.JWTAuth
import io.vertx.ext.web.RoutingContext
import io.vertx.ext.web.handler.impl.HttpStatusException
import io.vertx.ext.web.handler.impl.JWTAuthHandlerImpl
import java.lang.Exception

class NPassAuthHandler(authProvider: JWTAuth?, skip: String?): JWTAuthHandlerImpl(authProvider, skip) {
    private val gson = Gson()

    override fun handle(ctx: RoutingContext) {
        this.parseCredentials(ctx) { res ->
            if (res.failed()) {
                val user = ctx.user()
                if(user == null)
                    this.processException(ctx, res.cause())
                this.authorizeUser(ctx, user)
            } else {
                this.authProvider.authenticate(res.result() as JsonObject) { authN ->
                    if (authN.succeeded()) {
                        val authenticated = authN.result() as User
                        val session = ctx.session()
                        session?.regenerateId()
                        this.authorizeUser(ctx, authenticated)
                    } else {
                        this.processException(ctx, HttpStatusException(401, authN.cause()))
                    }
                }
            }
        }
    }

    private fun authorizeUser(ctx: RoutingContext, user:User) {
        try {
            val path = ctx.request().path()
            val tokenString = user.principal().getString("nPassToken")
            val tokenResponse: VerifyTokenResponse = gson.fromJson(tokenString, VerifyTokenResponse::class.java)
            if (path == tokenResponse.token.contentId) {
                Util.log("authorizeUser: authorized for $path")
                ctx.next()
            } else {
                Util.log("authorizeUser: Failed to authorize for $path token: $tokenResponse")
                throw HttpStatusException(401)
            }
        }
        catch (e: Exception) {
            Util.log("authorizeUser: Failed to authorize - exception: $e")
            this.processException(ctx, e)
        }
    }
}